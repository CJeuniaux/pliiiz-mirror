import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DisplayableAvatarRequest {
  avatar_url?: string | null;
  avatar_path?: string | null;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const avatarsBucketPublic = Deno.env.get('AVATARS_BUCKET_PUBLIC') === 'true'

    // Create service client for signed URLs
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { avatar_url, avatar_path }: DisplayableAvatarRequest = await req.json()

    console.log('[public-profile-avatar] Processing request:', { avatar_url, avatar_path, avatarsBucketPublic })

    const displayableUrl = await toDisplayableAvatarUrl(
      supabase, 
      supabaseUrl, 
      avatar_url, 
      avatar_path, 
      avatarsBucketPublic
    )

    return new Response(
      JSON.stringify({ avatar_url_public: displayableUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('[public-profile-avatar] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message, avatar_url_public: null }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function isPublicUrl(url: string): boolean {
  return /\/storage\/v1\/object\/public\//.test(url)
}

function extractPathFromSupabaseUrl(url?: string | null): { bucket: string; path: string } | null {
  if (!url) return null
  // Extract after ".../object/public/<bucket>/" or ".../object/<bucket>/"
  const match = url.match(/\/object\/(?:public\/)?([^/]+)\/(.+)$/)
  return match ? { bucket: match[1], path: match[2] } : null
}

function publicObjectUrl(baseUrl: string, bucket: string, path: string, width = 320): string {
  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}?width=${width}&quality=80&format=webp`
}

async function toDisplayableAvatarUrl(
  supabase: any,
  baseUrl: string,
  avatar_url?: string | null, 
  avatar_path?: string | null,
  avatarsBucketPublic = true
): Promise<string | null> {
  
  // 1) URL already public
  if (avatar_url && isPublicUrl(avatar_url)) {
    console.log('[toDisplayableAvatarUrl] Using existing public URL')
    return avatar_url
  }

  // 2) Try to reconstruct via path + bucket
  const info = avatar_path 
    ? { bucket: 'avatars', path: avatar_path } 
    : extractPathFromSupabaseUrl(avatar_url ?? '')

  if (info?.bucket && info?.path) {
    console.log('[toDisplayableAvatarUrl] Found bucket/path:', info)
    
    // a) if bucket is public → direct URL
    if (avatarsBucketPublic) {
      console.log('[toDisplayableAvatarUrl] Using public bucket URL')
      return publicObjectUrl(baseUrl, info.bucket, info.path)
    }
    
    // b) private bucket → signed URL 1 year
    console.log('[toDisplayableAvatarUrl] Creating signed URL for private bucket')
    try {
      const { data, error } = await supabase.storage
        .from(info.bucket)
        .createSignedUrl(info.path, 60 * 60 * 24 * 365) // 1 year TTL
      
      if (!error && data?.signedUrl) {
        console.log('[toDisplayableAvatarUrl] Generated signed URL successfully')
        return data.signedUrl
      } else {
        console.error('[toDisplayableAvatarUrl] Error creating signed URL:', error)
      }
    } catch (e) {
      console.error('[toDisplayableAvatarUrl] Exception creating signed URL:', e)
    }
  }

  console.log('[toDisplayableAvatarUrl] No displayable URL found, using fallback')
  return null // Frontend will show initials fallback
}