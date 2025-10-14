import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PurgeCacheResponse {
  success: boolean;
  message: string;
  deletedCount: number;
  error?: string;
}

export function useImageCachePurge() {
  const [isPurging, setIsPurging] = useState(false);
  const [lastPurgeResult, setLastPurgeResult] = useState<PurgeCacheResponse | null>(null);

  const purgeImageCache = useCallback(async (): Promise<PurgeCacheResponse> => {
    setIsPurging(true);
    
    try {
      console.log('Starting image cache purge...');
      
      const { data, error } = await supabase.functions.invoke('images-purge-cache', {
        body: {}
      });

      if (error) {
        console.error('Error purging cache:', error);
        const result = {
          success: false,
          message: 'Failed to purge cache',
          deletedCount: 0,
          error: error.message
        };
        setLastPurgeResult(result);
        return result;
      }

      const result = data as PurgeCacheResponse;
      console.log('Cache purge result:', result);
      setLastPurgeResult(result);
      return result;

    } catch (error: any) {
      console.error('Error calling purge function:', error);
      const result = {
        success: false,
        message: 'Failed to call purge function',
        deletedCount: 0,
        error: error.message
      };
      setLastPurgeResult(result);
      return result;
    } finally {
      setIsPurging(false);
    }
  }, []);

  return {
    purgeImageCache,
    isPurging,
    lastPurgeResult
  };
}