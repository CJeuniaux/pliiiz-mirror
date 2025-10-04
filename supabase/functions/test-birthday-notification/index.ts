import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Créer une notification de test pour l'anniversaire de Charlotte dans 21 jours
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 21);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: 'ce48c3ea-3224-4763-945d-849f45d7a6ce', // ID de Charlotte
        type: 'birthday_upcoming',
        message: 'Anniversaire de Pliiiz App dans 21 jours',
        payload: {
          contact_user_id: 'some-contact-id',
          contact_name: 'Pliiiz App',
          days_until: 21,
          date: testDate.toISOString().slice(0, 10),
          year: testDate.getFullYear(),
          milestone: 21
        }
      })
      .select();

    if (error) {
      console.error('Error creating test notification:', error);
      throw error;
    }

    console.log('Test birthday notification created:', data);

    return new Response(
      JSON.stringify({ ok: true, created: 1, data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in test-birthday-notification function:', error);
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