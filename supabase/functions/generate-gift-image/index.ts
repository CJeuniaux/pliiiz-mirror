import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { giftName, promptParams } = await req.json();

    if (!giftName) {
      return new Response(JSON.stringify({ error: 'Gift name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use enhanced prompts or fallback to simple prompt
    let positivePrompt, negativePrompt;
    
    if (promptParams) {
      positivePrompt = promptParams.positive;
      negativePrompt = promptParams.negative;
    } else {
      // Fallback to simple prompt with anti-chocolate bias
      positivePrompt = `A beautiful, clean, product-style photograph of ${giftName}. Professional product photography with soft lighting, white background, high quality, elegant presentation, studio lighting, detailed and realistic.`;
      negativePrompt = "no chocolate, no cacao, no cocoa, no dessert, no candy, no sweets, no food stains, no dripping, no text watermark, no logos";
    }

    console.log('Generating image for gift:', giftName);
    console.log('Positive prompt:', positivePrompt);
    console.log('Negative prompt:', negativePrompt);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: positivePrompt,
        negative_prompt: negativePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
        output_format: 'webp',
        background: 'opaque'
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0]) {
      throw new Error('No image data received from OpenAI');
    }

    // Return the base64 image data
    return new Response(JSON.stringify({ 
      imageData: data.data[0].b64_json,
      giftName: giftName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-gift-image function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallback: true // Indicate that we should use fallback image
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});