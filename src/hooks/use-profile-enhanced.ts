import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  birthday?: string;
  city?: string;
  country?: string;
  regift_enabled: boolean;
  regift_note?: string;
  email_verified: boolean;
  language: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      toast.error('Utilisateur non connecté');
      return { error: 'User not authenticated' };
    }

    try {
      // Utiliser la fonction sécurisée pour garantir la sauvegarde
      const { data, error } = await supabase
        .rpc('safe_upsert_profile', {
          p_user_id: user.id,
          p_updates: updates as any
        });

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Erreur lors de la sauvegarde');
        return { error };
      }

      const profileData = Array.isArray(data) ? data[0] : data;
      setProfile(profileData);
      toast.success('Profil sauvegardé avec succès');
      return { data: profileData, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la sauvegarde');
      return { error };
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile
  };
}