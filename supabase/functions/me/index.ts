import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function slugify(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanum to hyphen
    .replace(/(^-|-$)+/g, '') // trim hyphens
    .slice(0, 50);
}

function isValidSlug(slug?: string | null): boolean {
  if (!slug) return false;
  // require at least one word + hyphen + 8 hex suffix to ensure uniqueness
  return /^[a-z0-9]+(?:-[a-z0-9]+)*-[a-f0-9]{8}$/.test(slug);
}

function resolveBaseUrl(req: Request, appBase?: string | null): string {
  // Priority: configured base URL > request Origin > request URL origin > fallback
  const configured = (appBase || '').trim();
  if (configured && /^https?:\/\//i.test(configured)) return configured.replace(/\/$/, '');
  const origin = req.headers.get('origin');
  if (origin && /^https?:\/\//i.test(origin)) return origin.replace(/\/$/, '');
  try {
    const url = new URL(req.url);
    if (url.origin) return url.origin.replace(/\/$/, '');
  } catch {}
  return 'https://pliiiz.app';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, email, avatar_url, city, country, birthday')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch optional configured base URL from app_meta
    let configuredBase: string | null = null;
    try {
      const { data: appMeta } = await supabase
        .from('app_meta')
        .select('value')
        .eq('key', 'public_base_url')
        .maybeSingle();
      configuredBase = (appMeta as any)?.value ?? null;
    } catch (e) {
      // ignore if table not present or not accessible
      configuredBase = null;
    }

    // Fetch or create share link with robust slug
    const { data: shareLink, error: shareLinkError } = await supabase
      .from('share_links')
      .select('id, slug, is_active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (shareLinkError) {
      console.warn('Share link fetch error:', shareLinkError);
    }

    // Build expected slug
    const baseName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || (user.email?.split('@')[0] ?? 'profil');
    const safeName = slugify(baseName) || 'profil';
    const uidSuffix = (user.id || '').replace(/-/g, '').slice(0, 8) || 'userxxxx';
    const expectedSlug = `${safeName}-${uidSuffix}`;

    let finalSlug = shareLink?.slug ?? null;

    if (!isValidSlug(finalSlug)) {
      // insert or update
      if (!shareLink) {
        const { data: inserted, error: insErr } = await supabase
          .from('share_links')
          .insert({ user_id: user.id, slug: expectedSlug, is_active: true })
          .select('slug, is_active')
          .single();
        if (!insErr) {
          finalSlug = inserted.slug;
        } else {
          console.error('Insert share_link error:', insErr);
          // Fallback to suffix only slug
          finalSlug = expectedSlug;
        }
      } else {
        const { data: updated, error: updErr } = await supabase
          .from('share_links')
          .update({ slug: expectedSlug, is_active: shareLink.is_active ?? true })
          .eq('id', (shareLink as any).id)
          .select('slug, is_active')
          .single();
        if (!updErr) {
          finalSlug = updated.slug;
        } else {
          console.error('Update share_link error:', updErr);
          finalSlug = expectedSlug;
        }
      }
    }

    // Resolve base URL for current environment
    const baseUrl = resolveBaseUrl(req, configuredBase);
    const shareUrl = finalSlug ? `${baseUrl}/p/${finalSlug}` : null;

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          ...profile,
        },
        shareUrl,
        shareLink: {
          slug: finalSlug,
          is_active: shareLink?.is_active ?? true,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in me function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});