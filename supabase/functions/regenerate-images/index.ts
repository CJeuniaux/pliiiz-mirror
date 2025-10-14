import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Util: sha1 ArrayBuffer -> hex
async function sha1Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  const array = Array.from(new Uint8Array(digest));
  return array.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Fallback couleur dominante : moyenne RGB simple
function quickDominantColor(imageData: ImageData): string {
  const pixels = imageData.data;
  let r = 0, g = 0, b = 0, count = 0;
  
  for (let i = 0; i < pixels.length; i += 4) {
    r += pixels[i];
    g += pixels[i + 1];
    b += pixels[i + 2];
    count++;
  }
  
  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);
  
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Encoder BlurHash (algorithme simplifié)
function encodeBlurHash(imageData: ImageData, componentX = 4, componentY = 3): string {
  // Implementation simplifiée du BlurHash
  // Pour production, utiliser la lib blurhash complète
  const { width, height, data } = imageData;
  const factors: number[] = [];
  
  for (let y = 0; y < componentY; y++) {
    for (let x = 0; x < componentX; x++) {
      const factor = computeFactor(data, width, height, x, y, componentX, componentY);
      factors.push(factor);
    }
  }
  
  return encodeBase83(factors);
}

function computeFactor(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  componentX: number,
  componentY: number
): number {
  let r = 0, g = 0, b = 0;
  
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const basis = Math.cos((Math.PI * x * i) / width) * Math.cos((Math.PI * y * j) / height);
      const idx = (j * width + i) * 4;
      r += basis * sRGBToLinear(pixels[idx]);
      g += basis * sRGBToLinear(pixels[idx + 1]);
      b += basis * sRGBToLinear(pixels[idx + 2]);
    }
  }
  
  const scale = 1 / (width * height);
  return Math.sqrt((r * r + g * g + b * b) * scale);
}

function sRGBToLinear(value: number): number {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function encodeBase83(values: number[]): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~';
  return values.map(v => {
    const encoded = Math.floor(Math.max(0, Math.min(82, v)));
    return chars[encoded];
  }).join('');
}

type Payload = {
  profile_id?: string;
  all?: boolean;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: Payload = await req.json().catch(() => ({} as Payload));
    const singleId = body.profile_id;

    console.log('[regenerate-images] Processing request:', { singleId, all: body.all });

    // Sélection des cibles
    let profiles;
    if (singleId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_path, avatar_url, avatar_hash')
        .eq('id', singleId)
        .limit(1);
      
      if (error) throw error;
      profiles = data ?? [];
    } else {
      // Batch: on prend 50 profils avec avatars
      const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_path, avatar_url, avatar_hash, avatar_last_regen')
        .not('avatar_url', 'is', null)
        .order('avatar_last_regen', { ascending: true, nullsFirst: true })
        .limit(50);
      
      if (error) throw error;
      profiles = data ?? [];
    }

    console.log(`[regenerate-images] Processing ${profiles.length} profiles`);

    const results = [];
    
    for (const p of profiles) {
      // Extraire le path depuis avatar_url si avatar_path n'existe pas
      let avatarPath = p.avatar_path;
      
      if (!avatarPath && p.avatar_url) {
        // Extraire le path de l'URL publique
        const match = p.avatar_url.match(/\/avatars\/(.+?)(?:\?|$)/);
        if (match) {
          avatarPath = match[1];
        }
      }

      if (!avatarPath) {
        results.push({ id: p.id, skipped: 'no_avatar' });
        continue;
      }

      try {
        // Récupérer le binaire depuis Storage
        const { data: file, error: dlErr } = await supabase.storage
          .from('avatars')
          .download(avatarPath);

        if (dlErr || !file) {
          console.error(`[regenerate-images] Download failed for ${p.id}:`, dlErr);
          results.push({ id: p.id, error: 'download_failed' });
          continue;
        }

        const buf = new Uint8Array(await file.arrayBuffer());

        // Hash de contenu
        const hash = await sha1Hex(buf);

        // Créer ImageBitmap pour analyse
        const blob = new Blob([buf]);
        const bitmap = await createImageBitmap(blob).catch(() => null);
        
        let blurhash = null;
        let dominant = '#cccccc';
        
        if (bitmap) {
          // Canvas offscreen pour analyse
          const canvas = new OffscreenCanvas(
            Math.min(64, bitmap.width),
            Math.min(64, bitmap.height)
          );
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Calculer couleur dominante
            dominant = quickDominantColor(imageData);
            
            // Générer BlurHash (version simplifiée)
            blurhash = encodeBlurHash(imageData, 4, 3);
          }
        }

        // Vérifier si hash a changé
        const changed = p.avatar_hash !== hash;
        const { data: current } = await supabase
          .from('profiles')
          .select('avatar_version')
          .eq('id', p.id)
          .single();

        const nextVersion = changed ? ((current?.avatar_version ?? 0) + 1) : (current?.avatar_version ?? 0);

        // Upsert des métadonnées
        const { error: upErr } = await supabase
          .from('profiles')
          .update({
            avatar_path: avatarPath,
            avatar_hash: hash,
            avatar_version: nextVersion,
            avatar_blurhash: blurhash,
            avatar_dominant: dominant,
            avatar_last_regen: new Date().toISOString()
          })
          .eq('id', p.id);

        if (upErr) {
          console.error(`[regenerate-images] Update failed for ${p.id}:`, upErr);
          results.push({ id: p.id, error: 'update_failed' });
          continue;
        }

        console.log(`[regenerate-images] Processed ${p.id}: hash=${hash}, version=${nextVersion}, changed=${changed}`);
        results.push({ id: p.id, ok: true, changed, version: nextVersion, hash });
        
      } catch (error: any) {
        console.error(`[regenerate-images] Error processing ${p.id}:`, error);
        results.push({ id: p.id, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('[regenerate-images] Error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
