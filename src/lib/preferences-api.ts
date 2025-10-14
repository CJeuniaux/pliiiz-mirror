import { supabase } from '@/integrations/supabase/client';
import { executeSupabaseOperation } from './supabase-helpers';

export interface PreferencesData {
  likes?: string[];
  dislikes?: string[];
  allergies?: string[];
  current_wants?: string[];
  gift_ideas?: string[];
  sizes?: Record<string, string>;
}

/**
 * Sauvegarde les préférences utilisateur avec upsert
 * Utilise la contrainte unique sur user_id pour gérer les conflits
 */
export async function savePreferences(userId: string, preferences: PreferencesData) {
  return executeSupabaseOperation(
    async () => {
      const result = await supabase
        .from('preferences')
        .upsert(
          { user_id: userId, ...preferences },
          { onConflict: 'user_id' } // CRUCIAL: utiliser la contrainte unique
        )
        .select()
        .single();
      return result;
    },
    {
      successMessage: 'Préférences enregistrées',
      errorMessage: 'Échec de l\'enregistrement des préférences'
    }
  );
}

/**
 * Récupère les préférences d'un utilisateur
 */
export async function getPreferences(userId: string) {
  return executeSupabaseOperation(
    async () => {
      const result = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      return result;
    },
    {
      errorMessage: 'Erreur lors du chargement des préférences',
      showToast: false
    }
  );
}

/**
 * Patch profond des préférences via RPC (pour global_preferences et occasion_prefs)
 */
export async function patchPreferencesDeep(userId: string, patch: any) {
  return executeSupabaseOperation(
    async () => {
      const { error } = await supabase.rpc('patch_preferences_deep_v1', {
        p_user_id: userId,
        p_patch: patch,
      });
      
      if (error) {
        return { data: null, error };
      }
      
      // Récupérer les préférences mises à jour
      const { data, error: fetchError } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      return { data, error: fetchError };
    },
    {
      successMessage: 'Préférences mises à jour',
      errorMessage: 'Échec de la mise à jour des préférences'
    }
  );
}
