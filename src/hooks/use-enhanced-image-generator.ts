import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createSemanticMapping } from '@/lib/semantic-image-mapping';
import { buildEnhancedPrompts } from '@/lib/enhanced-image-prompts';
import { calculateImageConfidence, quickUrlConfidenceCheck } from '@/lib/image-confidence-scoring';
import { useAuth } from './use-auth';

interface ImageResult {
  url: string;
  source: 'ai' | 'unsplash' | 'fallback';
  confidence: number;
  cached?: boolean;
}

interface ImageCache {
  [giftIdea: string]: ImageResult;
}

/**
 * Enhanced image generator that combines AI and Unsplash with confidence scoring
 */
export function useEnhancedImageGenerator() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [cache, setCache] = useState<ImageCache>({});
  const userChoices = useRef<{[giftIdea: string]: string}>({});

  /**
   * Get image with enhanced semantic understanding
   */
  const getEnhancedImage = useCallback(async (giftIdea: string): Promise<ImageResult> => {
    // Return cached result if available
    if (cache[giftIdea]) {
      return { ...cache[giftIdea], cached: true };
    }

    // Check user manual choice
    if (userChoices.current[giftIdea]) {
      const userChoice: ImageResult = {
        url: userChoices.current[giftIdea],
        source: 'fallback',
        confidence: 1.0,
        cached: true
      };
      setCache(prev => ({ ...prev, [giftIdea]: userChoice }));
      return userChoice;
    }

    // Don't process if already loading
    if (loading.has(giftIdea)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return cache[giftIdea] || getFallbackImage(giftIdea);
    }

    setLoading(prev => new Set(prev.add(giftIdea)));

    try {
      // Step 1: Create semantic mapping
      const mapping = createSemanticMapping(giftIdea);
      console.log('Semantic mapping for', giftIdea, ':', mapping);

      // Step 2: Build enhanced prompts
      const prompts = buildEnhancedPrompts(mapping, giftIdea);
      console.log('Enhanced prompts:', prompts);

      let bestResult: ImageResult | null = null;

      // Step 3: Try AI generation first if high confidence mapping
      if (mapping.confidence > 0.6) {
        try {
          const aiResult = await generateAIImage(giftIdea, prompts, mapping);
          if (aiResult && aiResult.confidence > 0.7) {
            bestResult = aiResult;
          }
        } catch (error) {
          console.warn('AI generation failed:', error);
        }
      }

      // Step 4: Try Unsplash if AI failed or low confidence
      if (!bestResult || bestResult.confidence < 0.7) {
        try {
          const unsplashResult = await searchUnsplashImage(giftIdea, prompts, mapping);
          if (unsplashResult && (!bestResult || unsplashResult.confidence > bestResult.confidence)) {
            bestResult = unsplashResult;
          }
        } catch (error) {
          console.warn('Unsplash search failed:', error);
        }
      }

      // Step 5: Fallback if no good results
      if (!bestResult || bestResult.confidence < 0.3) {
        bestResult = getFallbackImage(giftIdea);
      }

      // Cache result
      setCache(prev => ({ ...prev, [giftIdea]: bestResult! }));
      
      // Log for analytics
      await logImageRequest(giftIdea, mapping, bestResult!);

      return bestResult!;

    } catch (error) {
      console.error('Enhanced image generation failed:', error);
      const fallback = getFallbackImage(giftIdea);
      setCache(prev => ({ ...prev, [giftIdea]: fallback }));
      return fallback;
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(giftIdea);
        return newSet;
      });
    }
  }, [cache, loading]);

  /**
   * Generate AI image using enhanced prompts
   */
  const generateAIImage = async (
    giftIdea: string, 
    prompts: any, 
    mapping: any
  ): Promise<ImageResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-gift-image', {
        body: {
          giftName: giftIdea,
          promptParams: {
            positive: prompts.positive,
            negative: prompts.negative,
            steps: prompts.steps,
            guidance: prompts.guidance
          }
        }
      });

      if (error || !data?.imageData) {
        return null;
      }

      const imageUrl = `data:image/webp;base64,${data.imageData}`;
      const confidence = quickUrlConfidenceCheck(imageUrl, giftIdea);

      return {
        url: imageUrl,
        source: 'ai',
        confidence: Math.min(0.9, confidence + 0.3) // AI images get bonus confidence
      };
    } catch (error) {
      console.error('AI image generation error:', error);
      return null;
    }
  };

  /**
   * Search Unsplash with enhanced query
   */
  const searchUnsplashImage = async (
    giftIdea: string,
    prompts: any,
    mapping: any
  ): Promise<ImageResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('unsplash-gift-ideas', {
        body: {
          idea_text: giftIdea,
          search_query: prompts.unsplashQuery,
          max_results: 3
        }
      });

      if (error || !data?.image?.url) {
        return null;
      }

      // Calculate confidence based on metadata
      const confidenceResult = calculateImageConfidence(
        giftIdea,
        {
          title: data.image.title,
          description: data.image.description,
          altText: data.image.alt_description,
          tags: data.image.tags
        },
        mapping
      );

      if (confidenceResult.shouldFallback) {
        return null;
      }

      return {
        url: data.image.url,
        source: 'unsplash',
        confidence: confidenceResult.score
      };
    } catch (error) {
      console.error('Unsplash search error:', error);
      return null;
    }
  };

  /**
   * Get curated fallback image
   */
  const getFallbackImage = (giftIdea: string): ImageResult => {
    const ideaLower = giftIdea.toLowerCase();
    
    // Enhanced fallback logic with more specific matching
    let fallbackUrl = '/src/assets/generated/gifts/chocolate-dark.jpg'; // default

    if (ideaLower.includes('rhum') || ideaLower.includes('rum')) {
      fallbackUrl = '/src/assets/generated/gifts/aged-rum.jpg';
    } else if (/(vin|wine|bordeaux|bourgogne|bottle)/.test(ideaLower)) {
      fallbackUrl = '/src/assets/generated/gifts/wine-premium.jpg';
    } else if (/(chocolat|truffe|pralin|cacao|chocolate)/.test(ideaLower)) {
      fallbackUrl = '/src/assets/generated/gifts/chocolate-premium.jpg';
    } else if (/(parfum|perfume|eau de parfum|fragrance)/.test(ideaLower)) {
      fallbackUrl = '/src/assets/generated/gifts/perfume-luxury.jpg';
    } else if (/(plante|succulent|cactus|monstera|plant)/.test(ideaLower)) {
      fallbackUrl = '/src/assets/generated/gifts/indoor-plants-easy.jpg';
    } else if (/(café|coffee|espresso|arabica)/.test(ideaLower)) {
      fallbackUrl = '/src/assets/generated/gifts/specialty-coffee.jpg';
    } else if (/(peinture|peindre|pinceau|toile|art|painting)/.test(ideaLower)) {
      fallbackUrl = '/src/assets/generated/gifts/painting-supplies.jpg';
    } else if (/(livre|book|roman|lecture)/.test(ideaLower)) {
      fallbackUrl = '/src/assets/generated/gifts/architecture-book.jpg';
    } else if (/(enceinte|speaker|audio|jbl|bose)/.test(ideaLower)) {
      fallbackUrl = '/src/assets/generated/gifts/bike-accessories.jpg'; // Temp fallback
    }

    return {
      url: fallbackUrl,
      source: 'fallback',
      confidence: 0.6
    };
  };

  /**
   * Allow manual image replacement
   */
  const setManualChoice = useCallback((giftIdea: string, imageUrl: string) => {
    userChoices.current[giftIdea] = imageUrl;
    const manualChoice: ImageResult = {
      url: imageUrl,
      source: 'fallback',
      confidence: 1.0
    };
    setCache(prev => ({ ...prev, [giftIdea]: manualChoice }));

    // Store choice persistently  
    try {
      localStorage.setItem(`pliiiz:manual-image:${giftIdea}`, imageUrl);
    } catch (error) {
      console.warn('Failed to store manual image choice:', error);
    }
  }, []);

  /**
   * Load manual choices from storage
   */
  const loadManualChoices = useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('pliiiz:manual-image:')
      );
      
      keys.forEach(key => {
        const giftIdea = key.replace('pliiiz:manual-image:', '');
        const imageUrl = localStorage.getItem(key);
        if (imageUrl) {
          userChoices.current[giftIdea] = imageUrl;
        }
      });
    } catch (error) {
      console.warn('Failed to load manual choices:', error);
    }
  }, []);

  /**
   * Log image request for analytics
   */
  const logImageRequest = async (
    giftIdea: string,
    mapping: any,
    result: ImageResult
  ) => {
    if (!user) return;

    try {
      // Use existing gift_images_logs table
      await supabase.from('gift_images_logs').insert({
        user_id: user.id,
        gift_name: giftIdea,
        gift_type: mapping.category,
        prompt_positive: `Enhanced: ${mapping.brand || mapping.category}`,
        prompt_negative: `Confidence: ${result.confidence}`,
        success: result.confidence > 0.5,
        error_message: result.source
      });
    } catch (error) {
      console.warn('Failed to log image request:', error);
    }
  };

  return {
    getEnhancedImage,
    setManualChoice,
    loadManualChoices,
    isLoading: (giftIdea: string) => loading.has(giftIdea),
    getCachedResult: (giftIdea: string) => cache[giftIdea]
  };
}