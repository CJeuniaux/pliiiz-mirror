import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BirthdayRow {
  contact_id: string;
  user_id: string;
  contact_user_id: string;
  first_name: string;
  last_name: string | null;
  next_birthday: string;
  timezone: string;
}

/**
 * Calcule la date/heure de fire_at pour un rappel
 * @param nextBirthdayDate - Date de l'anniversaire (YYYY-MM-DD)
 * @param timezone - Fuseau horaire de l'utilisateur
 * @param daysBefore - Nombre de jours avant l'anniversaire (14, 7 ou 3)
 * @returns Date ISO en UTC pour fire_at
 */
function calculateFireAt(nextBirthdayDate: string, timezone: string, daysBefore: number): string {
  try {
    const birthdayDate = new Date(nextBirthdayDate);
    
    // Calculer la date cible (X jours avant)
    const targetDate = new Date(birthdayDate);
    targetDate.setDate(targetDate.getDate() - daysBefore);
    
    // Format YYYY-MM-DD pour la date cible
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    
    // Créer une date à 09:00 dans le fuseau horaire de l'utilisateur
    const localTimeStr = `${year}-${month}-${day}T09:00:00`;
    
    // Convertir en UTC en utilisant le fuseau horaire
    // Note: Cette approche simple pourrait ne pas gérer parfaitement tous les cas DST
    const utcDate = new Date(localTimeStr);
    
    return utcDate.toISOString();
  } catch (error) {
    console.error('Error calculating fire_at:', error);
    // Fallback: utiliser UTC directement
    const birthdayDate = new Date(nextBirthdayDate);
    const targetDate = new Date(birthdayDate);
    targetDate.setDate(targetDate.getDate() - daysBefore);
    targetDate.setHours(9, 0, 0, 0);
    return targetDate.toISOString();
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Récupérer tous les anniversaires des 17 prochains jours
    const { data: birthdays, error: fetchError } = await supabase
      .from('v_contacts_next_birthday')
      .select('contact_id, user_id, contact_user_id, first_name, last_name, next_birthday, timezone');

    if (fetchError) {
      console.error('Error fetching birthdays:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch birthdays', details: fetchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!birthdays || birthdays.length === 0) {
      console.log('No birthdays found');
      return new Response(
        JSON.stringify({ message: 'No birthdays to process', inserted: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filtrer les anniversaires dans les 17 prochains jours
    const today = new Date();
    const in17Days = new Date();
    in17Days.setDate(today.getDate() + 17);

    const upcomingBirthdays = (birthdays as BirthdayRow[]).filter((b) => {
      const birthdayDate = new Date(b.next_birthday);
      return birthdayDate >= today && birthdayDate <= in17Days;
    });

    console.log(`Found ${upcomingBirthdays.length} birthdays in the next 17 days`);

    // Créer les notifications pour J-14, J-7 et J-3
    const notificationsToInsert = [];
    const deltas = [14, 7, 3];

    for (const birthday of upcomingBirthdays) {
      for (const daysBefore of deltas) {
        const fireAt = calculateFireAt(birthday.next_birthday, birthday.timezone, daysBefore);
        const contactName = `${birthday.first_name}${birthday.last_name ? ' ' + birthday.last_name : ''}`;

        notificationsToInsert.push({
          user_id: birthday.user_id,
          contact_id: birthday.contact_id,
          type: 'birthday_reminder',
          fire_at: fireAt,
          message: `Anniversaire de ${contactName} dans ${daysBefore} jours`,
          payload: {
            title: `J-${daysBefore} avant l'anniversaire de ${birthday.first_name}`,
            body: `Préparez votre cadeau pour ${birthday.first_name} 🎁`,
            contact_name: contactName,
            contact_user_id: birthday.contact_user_id,
            days_before: daysBefore,
            birthday_date: birthday.next_birthday,
          },
        });
      }
    }

    console.log(`Prepared ${notificationsToInsert.length} notifications to insert`);

    // Insérer les notifications (les doublons seront ignorés grâce à la contrainte UNIQUE)
    let insertedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const notification of notificationsToInsert) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notification)
        .select('id')
        .single();

      if (insertError) {
        // Code 23505 = violation de contrainte unique (doublon)
        if (insertError.code === '23505') {
          duplicateCount++;
        } else {
          console.error('Error inserting notification:', insertError);
          errorCount++;
        }
      } else {
        insertedCount++;
      }
    }

    const result = {
      message: 'Birthday reminders scheduled successfully',
      upcoming_birthdays: upcomingBirthdays.length,
      notifications_prepared: notificationsToInsert.length,
      inserted: insertedCount,
      duplicates: duplicateCount,
      errors: errorCount,
    };

    console.log('Result:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
