import { useState, useEffect, useCallback } from 'react';
import { useUnsplash } from './use-unsplash';
import { useUnsplashRebuild } from './use-unsplash-rebuild';

interface PreferenceImageData {
  id: string;
  author: string;
  username: string;
  profileUrl: string;
  url400: string;
  htmlLink: string;
  downloadLocation: string;
  cachedAt: number;
  dbId?: number; // ID from gift_idea_unsplash table
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_PREFIX = 'unsplash_preference_';

export function usePreferenceImage(preference: string) {
  const [imageData, setImageData] = useState<PreferenceImageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { searchImages, trackDownload } = useUnsplash();
  const { getImageByIdea } = useUnsplashRebuild();

  const getCachedImage = useCallback((key: string): PreferenceImageData | null => {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;
      
      const data = JSON.parse(cached) as PreferenceImageData;
      const isExpired = Date.now() - data.cachedAt > CACHE_DURATION;
      
      if (isExpired) {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  }, []);

  const setCachedImage = useCallback((key: string, data: PreferenceImageData) => {
    try {
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
        ...data,
        cachedAt: Date.now()
      }));
    } catch {
      // Ignore cache errors
    }
  }, []);

  const fetchImage = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError(null);

    // Check cache first
    const cached = getCachedImage(searchTerm);
    if (cached) {
      setImageData(cached);
      setLoading(false);
      return;
    }

    try {
      // Priorité 1: Essayer système v2 Unsplash rebuild
      const v2Image = await getImageByIdea(searchTerm);
      console.log(`[usePreferenceImage] V2 search for "${searchTerm}":`, v2Image);
      
      if (v2Image && v2Image.image_url && !v2Image.is_fallback) {
        console.log(`[usePreferenceImage] Using V2 image with score ${v2Image.relevance_score} for "${searchTerm}"`);
        const imageData = {
          id: v2Image.unsplash_id || 'v2-' + Date.now(),
          author: v2Image.photographer_name || 'Unknown',
          username: v2Image.photographer_name || 'unknown',
          profileUrl: v2Image.photographer_url || '#',
          url400: v2Image.image_url,
          htmlLink: v2Image.unsplash_url || '#',
          downloadLocation: '', // Pas de tracking nécessaire pour v2
          cachedAt: Date.now(),
          dbId: (v2Image as any).db_id // Add database ID for admin regen
        };
        
        setImageData(imageData);
        setCachedImage(searchTerm, imageData);
        return;
      }

      // Priorité 2: Fallback vers API Unsplash directe (système v1)
      const result = await searchImages(searchTerm, 1, 1);
      
      if (result && result.results.length > 0) {
        const image = result.results[0];
        const imageData = {
          id: image.id,
          author: image.author,
          username: image.username,
          profileUrl: image.profileUrl,
          url400: image.url400,
          htmlLink: image.htmlLink,
          downloadLocation: image.downloadLocation,
          cachedAt: Date.now()
        };
        
        setImageData(imageData);
        setCachedImage(searchTerm, imageData);
      } else {
        setImageData(null);
      }
    } catch (err) {
      console.error('Error fetching preference image:', err);
      setError('Failed to load image');
      setImageData(null);
    } finally {
      setLoading(false);
    }
  }, [searchImages, getImageByIdea, getCachedImage, setCachedImage]);

  const handleOfferClick = useCallback(async () => {
    if (imageData?.downloadLocation) {
      await trackDownload(imageData.downloadLocation);
    }
  }, [imageData, trackDownload]);

  useEffect(() => {
    if (preference) {
      fetchImage(preference);
    }
  }, [preference, fetchImage]);

  return {
    imageData,
    loading,
    error,
    handleOfferClick,
    refetch: () => fetchImage(preference)
  };
}