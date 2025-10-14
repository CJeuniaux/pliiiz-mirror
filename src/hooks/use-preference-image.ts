import { useState, useEffect, useCallback } from 'react';
import { useUnsplash } from './use-unsplash';
import { useUnsplashRebuild } from './use-unsplash-rebuild';
import { supabase } from '@/integrations/supabase/client';

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
const CACHE_PREFIX = 'unsplash_preference_v2_';

export function usePreferenceImage(preference: string, opts?: { category?: string; occasion?: string }) {
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

    const category = opts?.category ?? null;
    const occasion = opts?.occasion ?? null;
    const cacheKey = `${searchTerm}::${category || ''}::${occasion || ''}`;

    // 0) Use cache as a temporary placeholder only (we'll still fetch fresh data)
    const cached = getCachedImage(cacheKey);
    if (cached) {
      setImageData(cached);
    }

    try {
      // 1) Priorité V2 (base Supabase) — prend le dessus sur le cache s'il y a une nouvelle image
      const v2Image = await getImageByIdea(searchTerm, category || undefined, occasion || undefined);
      console.log(`[usePreferenceImage] V2 search for "${searchTerm}" (cat=${category} occ=${occasion}):`, v2Image);
      
      if (v2Image && v2Image.image_url) {
        const nextData = {
          id: v2Image.unsplash_id || 'v2-' + Date.now(),
          author: v2Image.photographer_name || 'Unknown',
          username: v2Image.photographer_name || 'unknown',
          profileUrl: v2Image.photographer_url || '#',
          url400: v2Image.image_url,
          htmlLink: v2Image.unsplash_url || '#',
          downloadLocation: '',
          cachedAt: Date.now(),
          dbId: (v2Image as any).db_id
        } as PreferenceImageData;

        // Si l'URL diffère du cache, on remplace et on met à jour le cache
        if (!cached || cached.url400 !== nextData.url400) {
          setImageData(nextData);
          setCachedImage(cacheKey, nextData);
        }
        setLoading(false);
        return;
      }

      // 2) Fallback base directe (tente V2 sans catégorie, puis par texte en privilégiant V2)
      const { data: v2NoCat } = await supabase.rpc('get_gift_idea_image_v2', {
        p_idea_text: searchTerm,
        p_category: null,
        p_occasion: null,
      });
      const v2NoCatUrl = Array.isArray(v2NoCat) && v2NoCat.length > 0 ? (v2NoCat[0] as any).image_url : undefined;
      if (v2NoCatUrl) {
        const entry: any = (v2NoCat as any)[0];
        const nextData: PreferenceImageData = {
          id: entry.unsplash_id || 'v2-' + Date.now(),
          author: entry.photographer_name || 'Unknown',
          username: entry.photographer_name || 'unknown',
          profileUrl: entry.photographer_url || '#',
          url400: entry.image_url,
          htmlLink: entry.unsplash_url || '#',
          downloadLocation: '',
          cachedAt: Date.now(),
          dbId: entry.id
        };
        setImageData(nextData);
        setCachedImage(cacheKey, nextData);
        setLoading(false);
        return;
      }

      // Fallback: dernière image par texte (priorise generator_version = 'v2')
      const { data: txtRows } = await supabase
        .from('gift_idea_unsplash')
        .select('id, image_url, photographer_name, photographer_url, unsplash_url, generator_version, updated_at')
        .eq('gift_idea_text', searchTerm)
        .order('generator_version', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1);

      if (txtRows && txtRows.length > 0 && (txtRows[0] as any).image_url) {
        const row: any = txtRows[0];
        const nextData: PreferenceImageData = {
          id: String(row.id),
          author: row.photographer_name || 'Unknown',
          username: row.photographer_name || 'unknown',
          profileUrl: row.photographer_url || '#',
          url400: row.image_url,
          htmlLink: row.unsplash_url || '#',
          downloadLocation: '',
          cachedAt: Date.now(),
          dbId: row.id
        };
        setImageData(nextData);
        setCachedImage(cacheKey, nextData);
        setLoading(false);
        return;
      }

      // 3) Fallback Unsplash direct (v1)
      const result = await searchImages(searchTerm, 1, 1);
      if (result && result.results.length > 0) {
        const image = result.results[0];
        const nextData: PreferenceImageData = {
          id: image.id,
          author: image.author,
          username: image.username,
          profileUrl: image.profileUrl,
          url400: image.url400,
          htmlLink: image.htmlLink,
          downloadLocation: image.downloadLocation,
          cachedAt: Date.now()
        };
        setImageData(nextData);
        setCachedImage(cacheKey, nextData);
      } else {
        // 3) Aucun résultat — on laisse éventuellement le cache existant
        if (!cached) setImageData(null);
      }
    } catch (err) {
      console.error('Error fetching preference image:', err);
      setError('Failed to load image');
      if (!cached) setImageData(null);
    } finally {
      setLoading(false);
    }
  }, [searchImages, getImageByIdea, getCachedImage, setCachedImage, opts?.category, opts?.occasion]);

  const handleOfferClick = useCallback(async () => {
    if (imageData?.downloadLocation) {
      await trackDownload(imageData.downloadLocation);
    }
  }, [imageData, trackDownload]);

  useEffect(() => {
    if (preference) {
      fetchImage(preference);
    }
  }, [preference, opts?.category, opts?.occasion, fetchImage]);

  return {
    imageData,
    loading,
    error,
    handleOfferClick,
    refetch: () => fetchImage(preference)
  };
}