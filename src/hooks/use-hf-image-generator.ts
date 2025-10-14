import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HFImageCache {
  [key: string]: string;
}

interface GenerateImageParams {
  label: string;
  canonical?: string;
  size?: string;
}

interface GenerateImageResponse {
  url: string;
  cached: boolean;
  retryAfter?: number;
  error?: string;
}

export function useHFImageGenerator() {
  const [imageCache, setImageCache] = useState<HFImageCache>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const generateImage = useCallback(async (params: GenerateImageParams): Promise<string> => {
    const cacheKey = `${params.label}-${params.canonical || ''}-${params.size || '1024x1024'}`;
    
    // Return cached image if available
    if (imageCache[cacheKey]) {
      return imageCache[cacheKey];
    }

    // Don't generate if already loading
    if (loadingImages.has(cacheKey)) {
      return getFallbackImage(params.label);
    }

    setLoadingImages(prev => new Set(prev.add(cacheKey)));

    try {
      const { data, error } = await supabase.functions.invoke('images-generate', {
        body: {
          label: params.label,
          canonical: params.canonical,
          size: params.size || '1024x1024'
        }
      });

      if (error) {
        console.error('Error calling images-generate function:', error);
        return getFallbackImage(params.label);
      }

      const response = data as GenerateImageResponse;
      
      if (response?.url) {
        // Cache the image URL
        setImageCache(prev => ({
          ...prev,
          [cacheKey]: response.url
        }));
        
        return response.url;
      }

      return getFallbackImage(params.label);

    } catch (error: any) {
      console.error('Error generating image:', error);
      return getFallbackImage(params.label);
    } finally {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(cacheKey);
        return newSet;
      });
    }
  }, [imageCache, loadingImages]);

  const getFallbackImage = (label: string): string => {
    // Return a default gift image based on simple text matching
    const s = label.toLowerCase();
    
    if (/(chocolat|truffe|pralin|cacao|chocolate)/.test(s)) {
      return '/src/assets/generated/gifts/chocolate-dark.jpg';
    }
    if (/(vin|wine|bordeaux|bourgogne|bottle)/.test(s)) {
      return '/src/assets/generated/gifts/wine-premium.jpg';
    }
    if (/(parfum|perfume|eau de parfum|fragrance)/.test(s)) {
      return '/src/assets/generated/gifts/perfume-luxury.jpg';
    }
    if (/(plante|succulent|cactus|monstera|plant)/.test(s)) {
      return '/src/assets/generated/gifts/plants-succulents.jpg';
    }
    if (/(café|coffee|espresso|arabica)/.test(s)) {
      return '/src/assets/generated/gifts/coffee-artisan.jpg';
    }
    if (/(peinture|peindre|peintures|pinceau|pinceaux|toile|acrylique|gouache|matos|matériel\s+de\s+peinture|art|painting|paint)/.test(s)) {
      return '/src/assets/generated/gifts/painting-supplies.jpg';
    }
    
    // Default neutral placeholder (no more chocolate by default)
    return '/placeholder.svg';
  };

  const isImageLoading = useCallback((label: string, canonical?: string, size?: string) => {
    const cacheKey = `${label}-${canonical || ''}-${size || '1024x1024'}`;
    return loadingImages.has(cacheKey);
  }, [loadingImages]);

  return {
    generateImage,
    isImageLoading,
    getFallbackImage
  };
}