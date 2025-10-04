import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UnsplashImage {
  id: string;
  author: string;
  username: string;
  profileUrl: string;
  url400: string;
  htmlLink: string;
  downloadLocation: string;
}

interface UnsplashSearchResponse {
  results: UnsplashImage[];
  total: number;
  total_pages: number;
  current_page: number;
  per_page: number;
}

interface UnsplashRandomResponse {
  results: UnsplashImage[];
  count: number;
}

export function useUnsplash() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchImages = useCallback(async (
    query: string = 'gift',
    page: number = 1,
    perPage: number = 20
  ): Promise<UnsplashSearchResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('unsplash-search', {
        body: {
          q: query,
          page,
          per_page: perPage,
        },
      });

      if (fnError) {
        console.error('Error calling unsplash-search:', fnError);
        setError('Failed to search images');
        return null;
      }

      return data as UnsplashSearchResponse;
    } catch (err) {
      console.error('Error searching images:', err);
      setError('An error occurred while searching images');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRandomImages = useCallback(async (
    count: number = 10,
    query?: string
  ): Promise<UnsplashRandomResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const params: any = { count };
      if (query) params.q = query;

      const { data, error: fnError } = await supabase.functions.invoke('unsplash-random', {
        body: params,
      });

      if (fnError) {
        console.error('Error calling unsplash-random:', fnError);
        setError('Failed to get random images');
        return null;
      }

      return data as UnsplashRandomResponse;
    } catch (err) {
      console.error('Error getting random images:', err);
      setError('An error occurred while getting random images');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const trackDownload = useCallback(async (downloadLocation: string): Promise<void> => {
    try {
      const { error: fnError } = await supabase.functions.invoke('unsplash-track-download', {
        body: { downloadLocation },
      });

      if (fnError) {
        console.error('Error tracking download:', fnError);
        // Don't throw error as this shouldn't impact user experience
      }
    } catch (err) {
      console.error('Error tracking download:', err);
      // Don't throw error as this shouldn't impact user experience
    }
  }, []);

  return {
    searchImages,
    getRandomImages,
    trackDownload,
    loading,
    error,
  };
}