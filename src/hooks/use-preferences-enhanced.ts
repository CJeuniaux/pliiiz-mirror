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
  current_wants: string[];
  sizes: any;
  created_at: string;
  updated_at: string;
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPreferences = async () => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
        setPreferences(null);
      } else {
        setPreferences(data as UserPreferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setPreferences(null);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) {
      toast.error('Utilisateur non connecté');
      return { error: 'User not authenticated' };
    }

    try {
      // Utiliser la fonction sécurisée pour garantir la sauvegarde
      const { data, error } = await supabase
        .rpc('safe_upsert_preferences', {
          p_user_id: user.id,
          p_updates: updates as any
        });

      if (error) {
        console.error('Error updating preferences:', error);
        toast.error('Erreur lors de la sauvegarde');
        return { error };
      }

      const prefsData = Array.isArray(data) ? data[0] : data;
      setPreferences(prefsData);
      toast.success('Idées cadeaux sauvegardées avec succès');
      return { data: prefsData, error: null };
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Erreur lors de la sauvegarde');
      return { error };
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  return {
    preferences,
    loading,
    updatePreferences,
    refetch: fetchPreferences
  };
}