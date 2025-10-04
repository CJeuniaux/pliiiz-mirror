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

export interface UserPreferences {
  id: string;
  user_id: string;
  likes: string[];
  dislikes: string[];
  allergies: string[];
  sizes: {
    top?: string;
    bottom?: string;
    shoes?: string;
    other?: string;
  };
  current_wants: string[];
  gift_ideas: string[];
  created_at: string;
  updated_at: string;
}

// Hook unifié pour les profils - remplace use-profile.ts et use-profile-enhanced.ts
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
    if (!user) {
      toast.error("Utilisateur non connecté");
      return { error: 'User not authenticated' };
    }

    try {
      // Log pour debugging
      console.log('[Profile Update] Starting update for user:', user.id, updates);
      
      // Utiliser la fonction sécurisée pour garantir la sauvegarde
      const { data, error } = await supabase
        .rpc('safe_upsert_profile', {
          p_user_id: user.id,
          p_updates: updates as any
        });

      if (error) {
        console.error('[Profile Update] Database error:', error);
        toast.error(`Erreur lors de la sauvegarde: ${error.message}`);
        return { error };
      }

      // Update local state and show success
      const profileData = Array.isArray(data) ? data[0] : data;
      setProfile(profileData);
      console.log('[Profile Update] Success:', profileData);
      
      toast.success("Profil sauvegardé avec succès");
      
      return { data: profileData };
    } catch (error) {
      console.error('[Profile Update] Exception:', error);
      toast.error("Erreur lors de la sauvegarde");
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

// Hook unifié pour les préférences - remplace use-preferences.ts et use-preferences-enhanced.ts
export function usePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    } else {
      setPreferences(null);
      setLoading(false);
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          ...data,
          likes: data.likes || [],
          dislikes: data.dislikes || [],
          allergies: data.allergies || [],
          sizes: (data.sizes as any) || {},
          current_wants: data.current_wants || [],
          gift_ideas: data.gift_ideas || []
        });
      } else {
        // Créer des préférences par défaut si elles n'existent pas
        setPreferences({
          id: '',
          user_id: user.id,
          likes: [],
          dislikes: [],
          allergies: [],
          sizes: {},
          current_wants: [],
          gift_ideas: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) {
      toast.error("Utilisateur non connecté");
      return { error: 'User not authenticated' };
    }

    try {
      // Log pour debugging
      console.log('[Preferences Update] Starting update for user:', user.id, updates);
      
      // Utiliser la fonction sécurisée pour garantir la sauvegarde
      const { data, error } = await supabase
        .rpc('safe_upsert_preferences', {
          p_user_id: user.id,
          p_updates: updates as any
        });

      if (error) {
        console.error('[Preferences Update] Database error:', error);
        toast.error(`Erreur lors de la sauvegarde: ${error.message}`);
        return { error };
      }

      const prefsData = Array.isArray(data) ? data[0] : data;
      if (prefsData) {
        setPreferences({
          ...prefsData,
          likes: prefsData.likes || [],
          dislikes: prefsData.dislikes || [],
          allergies: prefsData.allergies || [],
          sizes: (prefsData.sizes as any) || {},
          current_wants: prefsData.current_wants || [],
          gift_ideas: prefsData.gift_ideas || []
        });
      }
      
      console.log('[Preferences Update] Success:', prefsData);
      toast.success("Préférences sauvegardées avec succès");
      
      return { data: prefsData };
    } catch (error) {
      console.error('[Preferences Update] Exception:', error);
      toast.error("Erreur lors de la sauvegarde");
      return { error };
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
    refetch: fetchPreferences
  };
}