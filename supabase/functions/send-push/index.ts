import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  user_ids: string[];
  heading: string;
  content: string;
  url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_ids, heading, content, url }: PushPayload = await req.json();

    console.log('[Push] Sending notification to:', user_ids);

    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!oneSignalAppId || !oneSignalApiKey) {
      throw new Error('OneSignal credentials not configured');
    }

    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${oneSignalApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: oneSignalAppId,
        include_aliases: {
          external_id: user_ids,
        },
        target_channel: 'push',
        headings: {
          en: heading,
          fr: heading,
        },
        contents: {
          en: content,
          fr: content,
        },
        url: url || undefined,
        chrome_web_icon: '/favicon.ico',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Push] OneSignal error:', data);
      throw new Error(`OneSignal API error: ${JSON.stringify(data)}`);
    }

    console.log('[Push] Notification sent successfully:', data);

    return new Response(
      JSON.stringify({ ok: true, data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Push] Error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
