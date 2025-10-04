import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Redirects legacy /profil/:id URLs to canonical /p/:slug format
 * Preserves all query parameters (especially UTM parameters)
 */
export function LegacyProfileRedirect() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlug = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      // Use SECURITY DEFINER RPC to bypass RLS
      const { data, error } = await supabase.rpc('get_active_slug', { user_uuid: id });
      if (error) {
        console.error('RPC get_active_slug error:', error);
      }
      setSlug((data as string) || null);
      setLoading(false);
    };
    fetchSlug();
  }, [id]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  if (!slug) {
    // Redirect to 404 if no slug found
    return <Navigate to="/404" replace />;
  }

  // Build the new URL with preserved query parameters
  const queryString = searchParams.toString();
  const newPath = `/p/${slug}${queryString ? `?${queryString}` : ''}`;

  // 301 permanent redirect to canonical URL
  return <Navigate to={newPath} replace />;
}
