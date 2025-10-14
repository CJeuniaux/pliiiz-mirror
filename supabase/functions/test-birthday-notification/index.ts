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
    
    console.log('[Test] Creating birthday reminder notifications...');
    
    // Créer notification pour Pliiiz App (J-7) pour Charlotte
    const notif1 = await supabase
      .from('notifications')
      .insert({
        user_id: 'ce48c3ea-3224-4763-945d-849f45d7a6ce', // Charlotte
        type: 'birthday_reminder',
        message: 'Pliiiz App fête bientôt son anniversaire',
        payload: {
          contact_id: 'dfd2bf34-0a2c-45bf-bc1b-fb620195c7d4',
          contact_name: 'Pliiiz App',
          days_before: 7,
          year: '2025'
        }
      })
      .select();

    // Créer notification pour Axelle Henry (J-14) pour Charlotte
    const notif2 = await supabase
      .from('notifications')
      .insert({
        user_id: 'ce48c3ea-3224-4763-945d-849f45d7a6ce', // Charlotte
        type: 'birthday_reminder',
        message: 'Axelle Henry fête bientôt son anniversaire',
        payload: {
          contact_id: '007c3d76-5d7f-411d-8f43-9daafcca01be',
          contact_name: 'Axelle Henry',
          days_before: 14,
          year: '2025'
        }
      })
      .select();

    // Créer notification pour Pliiiz App (J-7) pour Axelle
    const notif3 = await supabase
      .from('notifications')
      .insert({
        user_id: '007c3d76-5d7f-411d-8f43-9daafcca01be', // Axelle
        type: 'birthday_reminder',
        message: 'Pliiiz App fête bientôt son anniversaire',
        payload: {
          contact_id: 'dfd2bf34-0a2c-45bf-bc1b-fb620195c7d4',
          contact_name: 'Pliiiz App',
          days_before: 7,
          year: '2025'
        }
      })
      .select();

    const results = {
      charlotte_pliiiz: notif1.data ? 'created' : notif1.error?.message,
      charlotte_axelle: notif2.data ? 'created' : notif2.error?.message,
      axelle_pliiiz: notif3.data ? 'created' : notif3.error?.message
    };

    console.log('[Test] Results:', results);

    return new Response(
      JSON.stringify({ ok: true, results }),
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