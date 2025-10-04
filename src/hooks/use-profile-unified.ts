import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  email_verified?: boolean;
  language?: string;
  birthday?: string;
  city?: string;
  country?: string;
  regift_enabled?: boolean;
  regift_note?: string;
  avatar_url?: string;
  bio?: string;
  display_name?: string;
  global_preferences?: any;
  occasion_prefs?: any;
  created_at: string;
  updated_at: string;
}

export function useProfileUnified() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // Utiliser la fonction sécurisée pour garantir la sauvegarde
      const { data, error } = await supabase
        .rpc('safe_upsert_profile', {
          p_user_id: user.id,
          p_updates: updates as any
        });

      if (error) {
        toast.error('Erreur lors de la sauvegarde: ' + error.message);
        console.error('Profile update error:', error);
        return { error };
      }

      // Update local state and show success
      const profileData = Array.isArray(data) ? data[0] : data;
      setProfile(profileData);
      toast.success('Profil sauvegardé');
      return { data: profileData };
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error('Profile update exception:', error);
      return { error };
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile
  };
}