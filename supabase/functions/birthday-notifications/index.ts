import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MILESTONES = [21, 7, 3, 1]; // Jalons de notification en jours

// Utilitaires de date (copie des fonctions de birthdays.ts)
function parseDOB(dob: string): { day: number; month: number } | null {
  if (!dob) return null;
  const s = dob.trim();
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return { month: +m[2], day: +m[3] };
  if ((m = s.match(/^(\d{2})-(\d{2})$/)))        return { month: +m[1], day: +m[2] };
  if ((m = s.match(/^(\d{2})\/(\d{2})(?:\/\d{4})?$/))) return { day: +m[1], month: +m[2] };
  return null;
}

function nextBirthdayFrom(day: number, month: number, from = new Date()): Date {
  const y = from.getFullYear();
  const isFeb29 = day === 29 && month === 2;
  const candidateThisYear = new Date(y, month - 1, isFeb29 && !isLeap(y) ? 28 : day);
  if (stripTime(candidateThisYear) >= stripTime(from)) return candidateThisYear;
  const nextY = y + 1;
  return new Date(nextY, month - 1, isFeb29 && !isLeap(nextY) ? 28 : day);
}

function daysBetweenUTC(a: Date, b: Date): number {
  const ms = stripTime(b).getTime() - stripTime(a).getTime();
  return Math.round(ms / 86400000);
}

const stripTime = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

function daysUntilNextBirthday(dob: string, now = new Date()) {
  const dm = parseDOB(dob);
  if (!dm) return null;
  const next = nextBirthdayFrom(dm.day, dm.month, now);
  return { days: daysBetweenUTC(now, next), date: next };
}

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1) Récupérer toutes les relations "contacts" avec un anniversaire connu
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select(`
        id,
        owner_id,
        contact_user_id,
        profiles!contacts_contact_user_id_fkey (
          user_id,
          first_name,
          last_name,
          birthday
        )
      `)
      .not('profiles.birthday', 'is', null);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      throw contactsError;
    }

    const now = new Date();
    let created = 0;

    for (const contact of contacts || []) {
      const profile = contact.profiles as any;
      if (!profile?.birthday) continue;

      const info = daysUntilNextBirthday(profile.birthday, now);
      if (!info) continue;

      const { days, date } = info;
      if (!MILESTONES.includes(days)) continue;

      const year = date.getFullYear();
      const contactName = profile.first_name || profile.last_name 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
        : 'Votre contact';

      // 2) Dédup: existe-t-il déjà une notif pour ce user/contact/année/jalon ?
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', contact.owner_id)
        .eq('type', 'birthday_upcoming')
        .contains('payload', { 
          contact_user_id: contact.contact_user_id, 
          year: year, 
          milestone: days 
        })
        .single();

      if (existing) continue;

      // 3) Créer la notification avec les données d'avatar du contact
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: contact.owner_id,
          type: 'birthday_upcoming',
          message: `🎂 Anniversaire de ${contactName} dans ${days} jour${days > 1 ? 's' : ''}`,
          actor_user_id: contact.contact_user_id,
          actor_name: contactName,
          actor_avatar_url: profile.avatar_url,
          payload: {
            contact_user_id: contact.contact_user_id,
            contact_name: contactName,
            days_until: days,
            birthday: date.toISOString().slice(0, 10),
            date: date.toISOString().slice(0, 10),
            year,
            milestone: days
          }
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
        continue;
      }

      created++;
    }

    console.log(`Birthday notifications job completed. Created ${created} notifications.`);

    return new Response(
      JSON.stringify({ ok: true, created }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in birthday-notifications function:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
}

Deno.serve(handler);