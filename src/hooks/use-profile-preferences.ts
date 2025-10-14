import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizePrefList } from '@/lib/display-utils';

export interface UserPreferences {
  likes: string[];
  dislikes: string[];
  gift_ideas?: string[];
  sizes?: { 
    top?: string; 
    bottom?: string; 
    shoes?: string; 
    ring?: string;
    other?: string; 
  };
  brands?: string[]; // NOUVELLE CATÉGORIE : Marques préférées
  notes?: string;
  updated_at?: string;
}

export function useProfilePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Normaliser les données pour s'assurer de la structure
  const normalizePreferences = (data: any): UserPreferences => {
    const global_preferences = data?.global_preferences || {};
    
    return {
      likes: sanitizePrefList(global_preferences?.likes),
      dislikes: sanitizePrefList(global_preferences?.avoid || global_preferences?.dislikes),
      gift_ideas: sanitizePrefList(global_preferences?.giftIdeas || global_preferences?.gift_ideas),
      sizes: global_preferences?.sizes || {},
      brands: sanitizePrefList(global_preferences?.brands),
      notes: global_preferences?.notes || '',
      updated_at: data?.updated_at
    };
  };

  // Charger les préférences depuis profiles
  const fetchPreferences = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('global_preferences, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile preferences:', error);
        return;
      }

      const normalized = normalizePreferences(data);
      setPreferences(normalized);
      
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les préférences
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user || !preferences) return;

    try {
      // Construire la structure global_preferences
      const global_preferences = {
        likes: updates.likes || preferences.likes,
        avoid: updates.dislikes || preferences.dislikes,
        giftIdeas: updates.gift_ideas || preferences.gift_ideas,
        sizes: updates.sizes || preferences.sizes,
        brands: updates.brands || preferences.brands,
        notes: updates.notes || preferences.notes
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          global_preferences,
          // Vider les préférences par occasion
          occasion_prefs: {},
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating preferences:', error);
        toast.error('Erreur lors de la sauvegarde');
        return;
      }

      toast.success('Préférences sauvegardées');
      
      // Recharger les données
      await fetchPreferences();
      
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  // Charger les données au montage
  useEffect(() => {
    if (user) {
      fetchPreferences();
    } else {
      setPreferences(null);
      setLoading(false);
    }
  }, [user]);

  return {
    preferences,
    loading,
    updatePreferences,
    refetch: fetchPreferences
  };
}