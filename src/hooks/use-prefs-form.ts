import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PreferencesData {
  likes: string[];
  avoid: string[];
  gift_ideas: string[];
  allergies: string[];
  brands: string[];
  sizes: any;
  occasions: any;
  updated_at?: string;
}

export function usePrefsForm() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<PreferencesData | null>(null);
  const [form, setForm] = useState<PreferencesData | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fonction pour normaliser les données depuis profiles
  const normalizePrefs = (data: any): PreferencesData => ({
    likes: data?.global_preferences?.likes || [],
    avoid: data?.global_preferences?.avoid || [],
    gift_ideas: data?.global_preferences?.giftIdeas || [],
    allergies: data?.global_preferences?.allergies || [],
    brands: data?.global_preferences?.brands || [],
    sizes: data?.global_preferences?.sizes || {},
    occasions: data?.occasion_prefs || {},
    updated_at: data?.updated_at
  });

  // Charger les préférences depuis profiles uniquement
  const fetchPrefs = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Récupérer les données depuis profiles seulement
      const { data, error } = await supabase
        .from('profiles')
        .select('global_preferences, occasion_prefs, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile preferences:', error);
        return;
      }

      const normalized = normalizePrefs(data);
      setPrefs(normalized);
      
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hydrater le formulaire une seule fois (et quand updated_at change)
useEffect(() => {
  if (prefs) {
    setForm(structuredClone(prefs));
  }
}, [prefs]);

  // Charger les données au montage
  useEffect(() => {
    if (user) {
      fetchPrefs();
    } else {
      setPrefs(null);
      setForm(null);
      setLoading(false);
    }
  }, [user]);

  // Fonction pour détecter les différences
  const isEqual = (a: any, b: any): boolean => {
    return JSON.stringify(a) === JSON.stringify(b);
  };

  // Annuler les modifications
  const onCancel = () => {
    if (prefs) {
      setForm(structuredClone(prefs));
    }
    setEditing(false);
  };

  // Sauvegarder les modifications
  const onSave = async () => {
    if (!user || !form || !prefs) return;

    try {
      const patch: any = {};
      
      // Comparer et inclure seulement les champs modifiés
      if (!isEqual(form.likes, prefs.likes)) patch.likes = form.likes;
      if (!isEqual(form.avoid, prefs.avoid)) patch.avoid = form.avoid;
      if (!isEqual(form.gift_ideas, prefs.gift_ideas)) patch.gift_ideas = form.gift_ideas;
      if (!isEqual(form.allergies, prefs.allergies)) patch.allergies = form.allergies;
      if (!isEqual(form.brands, prefs.brands)) patch.brands = form.brands;
      if (!isEqual(form.sizes, prefs.sizes)) patch.sizes = form.sizes;
      if (!isEqual(form.occasions, prefs.occasions)) patch.occasions = form.occasions;

      if (Object.keys(patch).length > 0) {
        // Validation des données avant envoi
        const { validateAndSanitizePatch } = await import('@/lib/preferences-validation');
        const validatedPatch = validateAndSanitizePatch(patch);
        
        console.log('[Save] Sending patch to RPC:', validatedPatch);
        
        // 1) Ensure profile exists before patching
        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert({ user_id: user.id }, { onConflict: 'user_id' });
        if (upsertErr) {
          console.error('[Save] Upsert error:', upsertErr);
          toast.error(`Erreur de sauvegarde: ${upsertErr.message || 'Problème de base de données'}`);
          return;
        }

        // 2) Apply deep patch via RPC
        const { error } = await supabase.rpc('patch_preferences_deep_v1', {
          p_user_id: user.id,
          p_patch: validatedPatch as any
        });

        if (error) {
          console.error('[Save] RPC Error details:', error);
          toast.error(`Erreur de sauvegarde: ${error.message || 'Problème de base de données'}`);
          return;
        }

        toast.success('Préférences sauvegardées');
        
        // Recharger les données
        await fetchPrefs();
      }
      
      setEditing(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  return {
    prefs,
    form,
    setForm,
    editing,
    setEditing,
    onSave,
    onCancel,
    loading
  };
}