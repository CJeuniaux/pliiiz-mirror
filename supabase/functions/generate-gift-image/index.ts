import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { giftName, promptParams } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ fallback: true, error: 'AI gateway key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Generating image for:', giftName);
    console.log('Prompt:', promptParams.positive);

    // Call Lovable AI Gateway (Gemini image model)
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          { role: 'user', content: promptParams.positive }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      const status = aiResponse.status;
      const mapped = status === 429
        ? { status: 429, msg: 'Rate limit exceeded' }
        : status === 402
        ? { status: 402, msg: 'Payment required or credits exhausted' }
        : { status: 500, msg: 'AI gateway error' };
      return new Response(
        JSON.stringify({ fallback: true, error: mapped.msg }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: mapped.status }
      );
    }

    const data = await aiResponse.json();
    const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('Invalid AI gateway response:', data);
      return new Response(
        JSON.stringify({ fallback: true, error: 'Invalid AI response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Extract base64 from data URL
    const match = imageUrl.match(/^data:(.+);base64,(.*)$/);
    const mimeType = match?.[1] || 'image/png';
    const imageData = match?.[2] || '';

    // Store in Supabase storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('jpeg') ? 'jpg' : mimeType.includes('webp') ? 'webp' : 'png';
    const fileName = `${Date.now()}-${giftName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${ext}`;
    const filePath = `generated/${fileName}`;

    // Convert base64 to bytes
    const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from('gift-images')
      .upload(filePath, imageBytes, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Return the base64 image anyway
      return new Response(
        JSON.stringify({ imageData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from('gift-images')
      .getPublicUrl(filePath);

    console.log('Image generated and stored successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        imageData,
        publicUrl,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-gift-image function:', error);
    return new Response(
      JSON.stringify({ 
        fallback: true, 
        error: error.message || 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
