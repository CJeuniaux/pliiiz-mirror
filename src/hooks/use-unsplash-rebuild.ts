import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RebuildStats {
  total: number;
  processed: number;
  success: number;
  fallback: number;
  skip: number;
  errors: number;
}

interface RebuildResult {
  session_id: string;
  status: string;
  stats: RebuildStats;
  message: string;
}

export function useUnsplashRebuild() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RebuildResult | null>(null);

  const startRebuild = useCallback(async (giftIdeas?: any[]): Promise<RebuildResult | null> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('unsplash-rebuild-v2', {
        body: {
          action: 'rebuild_all',
          gift_ideas: giftIdeas || [], // Si vide, récupère automatiquement depuis profiles
          session_id: crypto.randomUUID()
        }
      });

      if (fnError) {
        console.error('Error calling unsplash-rebuild-v2:', fnError);
        setError('Failed to start rebuild process');
        return null;
      }

      setResult(data);
      return data;
    } catch (err) {
      console.error('Error starting Unsplash rebuild:', err);
      setError('An error occurred while starting the rebuild process');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRebuildStats = useCallback(async (sessionId?: string) => {
    try {
      const query = supabase
        .from('unsplash_rebuild_metrics')
        .select('*');
      
      if (sessionId) {
        query.eq('rebuild_session_id', sessionId);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching rebuild metrics:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error fetching rebuild stats:', err);
      return null;
    }
  }, []);

  const getGiftIdeasStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('v_unsplash_rebuild_stats')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching gift ideas stats:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error fetching gift ideas stats:', err);
      return null;
    }
  }, []);

  const getImageByIdea = useCallback(async (ideaText: string, category?: string, occasion?: string) => {
    try {
      const { data, error } = await supabase.rpc('get_gift_idea_image_v2', {
        p_idea_text: ideaText,
        p_category: category || null,
        p_occasion: occasion || null
      });

      if (error) {
        console.error('Error fetching gift idea image:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (err) {
      console.error('Error fetching gift idea image:', err);
      return null;
    }
  }, []);

  return {
    startRebuild,
    getRebuildStats,
    getGiftIdeasStats,
    getImageByIdea,
    loading,
    error,
    result,
  };
}