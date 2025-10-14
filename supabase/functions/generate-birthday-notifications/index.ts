import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Contact = { 
  id: string; 
  owner_id: string; 
  contact_user_id: string;
  display_name: string;
  birthday: string;
};

type Profile = {
  user_id: string;
  first_name: string;
  last_name: string | null;
  birthday: string | null;
};

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const nextOccurrence = (birthday: string, fromYear: number): Date => {
  const [, month, day] = birthday.split("-").map(Number);
  const adjustedDay = (month === 2 && day === 29 && !isLeap(fromYear)) ? 28 : day;
  return new Date(Date.UTC(fromYear, month - 1, adjustedDay));
};

const daysBetweenUTC = (a: Date, b: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const todayUTC = new Date();
    const today = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate()));
    const currentYear = today.getUTCFullYear();

    console.log(`[Birthday Notifications] Starting job for ${today.toISOString()}`);

    // Récupérer tous les contacts avec anniversaires
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id, owner_id, contact_user_id");

    if (contactsError) {
      console.error("[Birthday Notifications] Error fetching contacts:", contactsError);
      return new Response(
        JSON.stringify({ ok: false, error: contactsError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!contacts || contacts.length === 0) {
      console.log("[Birthday Notifications] No contacts found");
      return new Response(
        JSON.stringify({ ok: true, inserted: 0, skipped: 0, errors: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Récupérer les profils avec anniversaires
    const contactUserIds = contacts.map(c => c.contact_user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, birthday")
      .in("user_id", contactUserIds)
      .not("birthday", "is", null);

    if (profilesError) {
      console.error("[Birthday Notifications] Error fetching profiles:", profilesError);
      return new Response(
        JSON.stringify({ ok: false, error: profilesError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const profilesMap = new Map<string, Profile>();
    profiles?.forEach(p => profilesMap.set(p.user_id, p as Profile));

    const milestones = [14, 7]; // J-14 et J-7
    let inserted = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const contact of contacts) {
      const profile = profilesMap.get(contact.contact_user_id);
      if (!profile || !profile.birthday) {
        skipped++;
        continue;
      }

      const nextBirthday = nextOccurrence(profile.birthday, currentYear);
      const daysUntil = daysBetweenUTC(today, nextBirthday);

      // Vérifier si on est à un jalon (J-14 ou J-7)
      if (!milestones.includes(daysUntil)) {
        skipped++;
        continue;
      }

      const contactName = profile.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : profile.first_name;

      const payload = {
        contact_id: contact.contact_user_id,
        contact_name: contactName,
        days_before: daysUntil,
        year: currentYear.toString()
      };

      const { error: insertError } = await supabase
        .from("notifications")
        .insert({
          user_id: contact.owner_id,
          type: "birthday_reminder",
          message: `${contactName} fête bientôt son anniversaire`,
          payload
        });

      if (insertError) {
        // Code 23505 = contrainte unique violée (doublon)
        if (insertError.code === "23505") {
          skipped++;
        } else {
          errors.push({ 
            contact_id: contact.contact_user_id, 
            message: insertError.message 
          });
        }
      } else {
        inserted++;
        console.log(`[Birthday Notifications] Created notification for ${contactName} (J-${daysUntil})`);
      }
    }

    console.log(`[Birthday Notifications] Job complete. Inserted: ${inserted}, Skipped: ${skipped}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ ok: true, inserted, skipped, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("[Birthday Notifications] Unexpected error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
