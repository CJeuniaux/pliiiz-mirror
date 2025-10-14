import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';
import { saveProfile, ProfileUpdate } from '@/lib/persistence';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email?: string;
  email_verified?: boolean;
  language?: string;
  birthday?: string;
  city?: string;
  country?: string;
  
  regift_enabled?: boolean;
  regift_note?: string;
  avatar_url?: string;
  avatar_url_public?: string;
  global_preferences?: any;
  occasion_prefs?: any;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
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
      // The updates already contain only the changed fields
      if (Object.keys(updates).length === 0) {
        toast.info('Aucune modification détectée');
        return { data: profile };
      }

      // Use the improved saveProfile function directly with the updates
      await saveProfile(updates as ProfileUpdate);

      // Fetch updated profile to get the latest data
      await fetchProfile();
      
      toast.success('Profil sauvegardé avec succès');
      return { data: profile };
    } catch (error: any) {
      const errorMessage = error?.message || 'Erreur lors de la sauvegarde';
      toast.error(errorMessage);
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