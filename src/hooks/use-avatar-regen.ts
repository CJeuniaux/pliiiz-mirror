import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RegenResult {
  id: string;
  ok?: boolean;
  changed?: boolean;
  version?: number;
  hash?: string;
  skipped?: string;
  error?: string;
}

export interface RegenResponse {
  ok: boolean;
  processed: number;
  results: RegenResult[];
  error?: string;
}

export function useAvatarRegen() {
  const [loading, setLoading] = useState(false);
  const [lastResults, setLastResults] = useState<RegenResult[]>([]);
  const { toast } = useToast();

  /**
   * Régénère les métadonnées d'avatar pour un profil
   */
  const regenerateProfile = async (profileId: string): Promise<RegenResponse | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-images', {
        body: { profile_id: profileId }
      });

      if (error) throw error;

      const response = data as RegenResponse;
      setLastResults(response.results || []);

      if (response.ok) {
        toast({
          title: 'Images régénérées',
          description: `${response.processed} profil(s) traité(s)`,
        });
      } else {
        toast({
          title: 'Erreur',
          description: response.error || 'Échec de la régénération',
          variant: 'destructive',
        });
      }

      return response;
    } catch (error: any) {
      console.error('[useAvatarRegen] Error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Échec de la régénération',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Régénère les métadonnées d'avatar pour tous les profils (batch)
   */
  const regenerateBatch = async (): Promise<RegenResponse | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-images', {
        body: { all: true }
      });

      if (error) throw error;

      const response = data as RegenResponse;
      setLastResults(response.results || []);

      if (response.ok) {
        toast({
          title: 'Batch régénéré',
          description: `${response.processed} profil(s) traité(s)`,
        });
      } else {
        toast({
          title: 'Erreur',
          description: response.error || 'Échec du batch',
          variant: 'destructive',
        });
      }

      return response;
    } catch (error: any) {
      console.error('[useAvatarRegen] Batch error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Échec du batch',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Récupère les jobs de régénération actifs
   */
  const getActiveJobs = async () => {
    const { data, error } = await supabase
      .from('image_regen_jobs')
      .select('*')
      .in('status', ['queued', 'running'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[useAvatarRegen] Error fetching jobs:', error);
      return [];
    }

    return data || [];
  };

  return {
    loading,
    lastResults,
    regenerateProfile,
    regenerateBatch,
    getActiveJobs,
  };
}
