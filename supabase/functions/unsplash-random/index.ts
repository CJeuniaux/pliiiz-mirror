import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
  };
  links: {
    html: string;
    download_location: string;
  };
  user: {
    name: string;
    username: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const url = new URL(req.url);
    const query = url.searchParams.get('q') || undefined;
    const count = Math.min(30, Math.max(1, parseInt(url.searchParams.get('count') || '10')));

    console.log(`Getting ${count} random photos from Unsplash${query ? ` with query: "${query}"` : ''}`);

    let unsplashUrl = `https://api.unsplash.com/photos/random?count=${count}&orientation=squarish`;
    if (query) {
      unsplashUrl += `&query=${encodeURIComponent(query)}`;
    }
    
    const response = await fetch(unsplashUrl, {
      headers: {
        'Authorization': `Client-ID ${unsplashAccessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Unsplash error details:', errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: response.headers.get('X-RateLimit-Remaining') 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Failed to fetch random images from Unsplash' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data: UnsplashPhoto[] = await response.json();
    console.log(`Received ${data?.length || 0} random photos from Unsplash`);

    // Transform the response according to our specification
    const transformedResults = data?.map((photo: UnsplashPhoto) => ({
      id: photo.id,
      author: photo.user.name,
      username: photo.user.username,
      profileUrl: `https://unsplash.com/@${photo.user.username}?utm_source=pliiiz&utm_medium=referral`,
      url400: `${photo.urls.raw}&w=400&h=400&fit=crop&crop=faces,entropy&auto=format&q=70`,
      htmlLink: `${photo.links.html}?utm_source=pliiiz&utm_medium=referral`,
      downloadLocation: photo.links.download_location,
    })) || [];

    return new Response(JSON.stringify({
      results: transformedResults,
      count: transformedResults.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in unsplash-random function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});