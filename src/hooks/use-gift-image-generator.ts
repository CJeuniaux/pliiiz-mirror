import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { buildImagePrompt, categorizeGift, shouldExcludeFood } from '@/lib/gift-image-prompts';
import { useAuth } from './use-auth';

interface GiftImageCache {
  [giftName: string]: string;
}

export function useGiftImageGenerator() {
  const { user } = useAuth();
  const [imageCache, setImageCache] = useState<GiftImageCache>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const logImageGeneration = useCallback(async (
    giftName: string, 
    promptPositive: string, 
    promptNegative: string, 
    success: boolean, 
    errorMessage?: string
  ) => {
    if (!user) return;
    
    try {
      await supabase.from('gift_images_logs').insert({
        user_id: user.id,
        gift_name: giftName,
        gift_type: categorizeGift(giftName),
        prompt_positive: promptPositive,
        prompt_negative: promptNegative,
        success,
        error_message: errorMessage
      });
    } catch (error) {
      console.error('Failed to log image generation:', error);
    }
  }, [user]);

  const generateGiftImage = useCallback(async (giftName: string): Promise<string> => {
    // Return cached image if available
    if (imageCache[giftName]) {
      return imageCache[giftName];
    }

    // Don't generate if already loading
    if (loadingImages.has(giftName)) {
      return getFallbackImage(giftName);
    }

    // Check if we should exclude food items
    if (shouldExcludeFood(giftName)) {
      console.log('Excluding food item from AI generation:', giftName);
      const fallbackUrl = getFallbackImage(giftName);
      setImageCache(prev => ({ ...prev, [giftName]: fallbackUrl }));
      return fallbackUrl;
    }

    setLoadingImages(prev => new Set(prev.add(giftName)));

    try {
      // Build category-specific prompt
      const giftType = categorizeGift(giftName);
      const promptParams = buildImagePrompt(giftType, giftName);
      
      const { data, error } = await supabase.functions.invoke('generate-gift-image', {
        body: { 
          giftName,
          promptParams
        }
      });

      if (error) {
        console.error('Error generating gift image:', error);
        await logImageGeneration(giftName, promptParams.positive, promptParams.negative, false, error.message);
        return getFallbackImage(giftName);
      }

      if (data?.fallback) {
        await logImageGeneration(giftName, promptParams.positive, promptParams.negative, false, 'Fallback used');
        return getFallbackImage(giftName);
      }

      if (data?.imageData) {
        const imageUrl = `data:image/webp;base64,${data.imageData}`;
        
        // Cache the generated image
        setImageCache(prev => ({
          ...prev,
          [giftName]: imageUrl
        }));

        await logImageGeneration(giftName, promptParams.positive, promptParams.negative, true);
        return imageUrl;
      }

      return getFallbackImage(giftName);

    } catch (error: any) {
      console.error('Error calling generate-gift-image function:', error);
      return getFallbackImage(giftName);
    } finally {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(giftName);
        return newSet;
      });
    }
  }, [imageCache, loadingImages, logImageGeneration]);

  const getFallbackImage = (giftName: string): string => {
    // Return a default gift image based on simple text matching
    const s = giftName.toLowerCase();
    
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
    
    // Default fallback
    return '/src/assets/generated/gifts/chocolate-dark.jpg';
  };

  const isImageLoading = useCallback((giftName: string) => {
    return loadingImages.has(giftName);
  }, [loadingImages]);

  return {
    generateGiftImage,
    isImageLoading,
    getFallbackImage
  };
}