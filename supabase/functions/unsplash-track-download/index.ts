import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const unsplashAccessKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!unsplashAccessKey) {
      console.error('UNSPLASH_ACCESS_KEY not configured');
      return new Response(JSON.stringify({ error: 'Unsplash API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { downloadLocation } = await req.json();
    
    if (!downloadLocation) {
      return new Response(JSON.stringify({ error: 'Download location is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Tracking download for: ${downloadLocation}`);

    // Track the download as required by Unsplash API guidelines
    const trackingUrl = `${downloadLocation}?client_id=${unsplashAccessKey}`;
    
    const response = await fetch(trackingUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Client-ID ${unsplashAccessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      console.error(`Unsplash download tracking error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Tracking error details:', errorText);
    } else {
      console.log('Download tracked successfully');
    }

    // Always return success to the client, even if tracking fails
    // This ensures the user experience is not impacted by tracking issues
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error in unsplash-track-download function:', error);
    // Return success even on error to not impact user experience
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
});