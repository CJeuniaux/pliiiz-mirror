import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const BUCKET = Deno.env.get('IMAGE_BUCKET') || 'ai-previews';
const HF_TOKEN = Deno.env.get('HF_TOKEN');
const TIMEOUT = Number(Deno.env.get('IMAGE_TIMEOUT_MS') || 30000);
const MODEL = Deno.env.get('IMAGE_MODEL') || 'runwayml/stable-diffusion-v1-5';
const IMAGE_CDN_BASE = Deno.env.get('IMAGE_CDN_BASE') || `https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/${BUCKET}`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { label, canonical, size = '1024x1024' } = await req.json();
    
    console.log('Generating image for:', { label, canonical, size });

    // 1) Build prompts
    const positive = `${label}, product photography, high quality, soft lighting, simple background, gift catalog style`;
    const negative = 'low quality, blurry, watermark, text overlay, deformed, logo';
    
    console.log('Prompts:', { positive, negative });

    // 2) Create cache key
    const sig = JSON.stringify({ MODEL, label, canonical, size });
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sig));
    const hashHex = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const path = `${hashHex.substring(0, 16)}.png`; // Use first 16 chars for shorter filename
    const publicUrl = `${IMAGE_CDN_BASE}/${path}`;

    console.log('Cache key:', { hash: hashHex, path, publicUrl });

    // 3) Check cache
    const { data: files } = await supabase.storage.from(BUCKET).list('', { search: path });
    if (files?.some(f => f.name === path)) {
      console.log('Found cached image');
      return json({ url: publicUrl, cached: true });
    }

    console.log('No cached image found, generating new one');

    // 4) Call Hugging Face Inference API
    if (!HF_TOKEN) {
      throw new Error('HF_TOKEN not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const [w, h] = (size as string).split('x').map((n: string) => parseInt(n, 10) || 1024);
    const fallbackModel = 'stabilityai/sd-turbo';

    async function requestModel(modelName: string) {
      const res = await fetch(`https://api-inference.huggingface.co/models/${modelName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: positive,
          parameters: {
            negative_prompt: negative,
            num_inference_steps: 28,
            guidance_scale: 7.5,
            width: w,
            height: h
          }
        }),
        signal: controller.signal
      });
      return res;
    }

    try {
      // Try primary model first
      let hfResponse = await requestModel(MODEL);

      // Fallback on common failure codes
      if (!hfResponse.ok && [404, 403, 429, 500, 502, 503].includes(hfResponse.status)) {
        console.warn(`Primary model failed (${MODEL}) with ${hfResponse.status}. Falling back to ${fallbackModel}`);
        hfResponse = await requestModel(fallbackModel);
      }

      clearTimeout(timeoutId);

      if (!hfResponse.ok) {
        const errorText = await hfResponse.text();
        console.error('HF API error:', hfResponse.status, errorText);
        throw new Error(`hf_${hfResponse.status}: ${errorText}`);
      }

      // 5) Get image bytes
      const imageBytes = new Uint8Array(await hfResponse.arrayBuffer());
      console.log('Generated image size:', imageBytes.length, 'bytes');

      // 6) Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, imageBytes, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Successfully uploaded image to storage');

      return json({ url: publicUrl, cached: false });

    } finally {
      clearTimeout(timeoutId);
    }

  } catch (error: any) {
    console.error('Image generation failed:', error);

    // Ensure placeholder exists in storage (upload once if missing)
    try {
      const placeholderName = 'placeholder.png';
      const { data: phFiles } = await supabase.storage.from(BUCKET).list('', { search: placeholderName });
      const exists = phFiles?.some(f => f.name === placeholderName);

      if (!exists) {
        // 1x1 transparent PNG
        const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(placeholderName, bytes, { contentType: 'image/png', upsert: true });
        if (upErr) console.error('Failed to upload placeholder:', upErr);
      }
    } catch (phErr) {
      console.error('Placeholder ensure error:', phErr);
    }
    
    // Return placeholder on any error
    const placeholderUrl = `${IMAGE_CDN_BASE}/placeholder.png`;
    return json({
      url: placeholderUrl,
      cached: false,
      retryAfter: 3600,
      error: error.message
    }, 202);
  }
});

function json(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'application/json' 
    }
  });
}