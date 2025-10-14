import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

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

export function usePreferencesUnified() {
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
    if (!user) return { error: 'User not authenticated' };

    try {
      // Utiliser la fonction sécurisée pour garantir la sauvegarde
      const { data, error } = await supabase
        .rpc('safe_upsert_preferences', {
          p_user_id: user.id,
          p_updates: updates as any
        });

      if (error) {
        toast.error('Erreur lors de la sauvegarde: ' + error.message);
        console.error('Preferences update error:', error);
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
      
      toast.success('Préférences sauvegardées');
      return { data: prefsData };
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error('Preferences update exception:', error);
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