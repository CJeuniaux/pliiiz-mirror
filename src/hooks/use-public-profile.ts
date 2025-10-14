import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicProfile {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  wishlist?: string[];
  food_prefs?: string[];
  style_prefs?: string[];
  dislikes?: string[];
  regift_enabled?: boolean;
  regift_note?: string;
  updated_at: string;
}

export function usePublicProfile(userId: string) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchPublicProfile();
    }
  }, [userId]);

  const fetchPublicProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_public_profile_secure', { profile_user_id: userId })
        .single();

      if (error) {
        console.error('Error fetching public profile:', error);
        setError(error.message);
        setProfile(null);
      } else {
        const norm = (v: any): string[] => Array.isArray(v) ? v.map((x) => String(x)) : [];
        
        // Extract preferences from global_preferences JSONB
        const globalPrefs = (data.global_preferences || {}) as any;
        
        setProfile({
          user_id: data.user_id,
          display_name: data.display_name,
          avatar_url: data.avatar_url || undefined,
          bio: undefined,
          wishlist: norm(globalPrefs.giftIdeas || globalPrefs.likes),
          food_prefs: norm(globalPrefs.allergies),
          style_prefs: norm(globalPrefs.likes),
          dislikes: norm(globalPrefs.avoid),
          regift_enabled: !!data.regift_enabled,
          regift_note: undefined,
          updated_at: data.updated_at,
        });
      }
    } catch (error) {
      console.error('Error fetching public profile:', error);
      setError('Erreur lors du chargement du profil');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    refetch: fetchPublicProfile
  };
}