import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PublicProfileView } from "@/components/profile/public-profile-view";

/**
 * ProfileView with UUID-to-slug resolution
 * If the :slug param is actually a UUID, redirects to canonical /p/:slug URL
 */
export default function ProfileView() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Force scroll to top when mounting
  useEffect(() => {
    const scroller = document.querySelector('.app-scroll') as HTMLElement | null;
    if (scroller) scroller.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const resolveSlug = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      // Check if slug is a UUID (basic pattern match)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidPattern.test(slug)) {
        // It's a UUID, resolve to slug
        const { data, error } = await supabase.rpc('get_active_slug', { user_uuid: slug });
        if (error) {
          console.error('RPC get_active_slug error:', error);
        }
        setResolvedSlug((data as string) || null);
      } else {
        // It's already a slug, no need to resolve
        setResolvedSlug(slug);
      }
      
      setLoading(false);
    };

    resolveSlug();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!resolvedSlug) {
    // No slug found, redirect to 404
    return <Navigate to="/404" replace />;
  }

  // If we had to resolve a UUID to slug, redirect to canonical URL
  if (slug !== resolvedSlug) {
    const queryString = searchParams.toString();
    const newPath = `/p/${resolvedSlug}${queryString ? `?${queryString}` : ''}`;
    return <Navigate to={newPath} replace />;
  }

  // Normal case: display the profile
  return <PublicProfileView />;
}