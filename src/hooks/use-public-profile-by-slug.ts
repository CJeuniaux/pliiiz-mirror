import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicProfile {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  birthday?: string;
  city?: string;
  country?: string;
  global_preferences: any;
  occasion_prefs: any;
  regift_enabled: boolean;
  updated_at: string;
}

export function usePublicProfileBySlug(slug: string) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    fetchProfileBySlug();
  }, [slug]);

  const fetchProfileBySlug = async () => {
    try {
      setLoading(true);
      setError(null);

      // Resolve user_id from slug via SECURITY DEFINER RPC (bypass RLS)
      const { data: userId, error: slugError } = await supabase
        .rpc('get_user_id_by_slug', { p_slug: slug });

      if (slugError) {
        console.error('Error resolving slug:', slugError);
        setError('Erreur lors de la récupération du lien');
        return;
      }

      if (!userId) {
        setError('Profil non trouvé ou inactif');
        return;
      }

      // Then get the profile data using the security definer function
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_public_profile_secure', {
          profile_user_id: userId as string
        });

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Erreur lors de la récupération du profil');
        return;
      }

      if (!profileData || profileData.length === 0) {
        setError('Profil non accessible');
        return;
      }

      setProfile(profileData[0]);
    } catch (error) {
      console.error('Error fetching profile by slug:', error);
      setError('Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    refetch: fetchProfileBySlug
  };
}