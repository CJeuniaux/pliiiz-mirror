import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnsplashGiftImageRequest {
  idea_text: string;
  category?: string;
  occasion?: string;
  per_page?: number;
}

// Fonction pour construire une query Unsplash optimisée pour les idées cadeaux
function buildUnsplashQueryForGiftIdea(
  ideaText: string, 
  category?: string, 
  occasion?: string
): { query: string; negative: string } {
  // Nettoyer et normaliser le texte d'idée
  const cleanIdea = ideaText.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Termes positifs de base
  let positiveTerms = [
    'gift', 'present', 'lifestyle', 'photography', 'product', 
    'real', 'minimal', 'background', 'elegant'
  ];

  // Ajouter l'idée principale
  if (cleanIdea) {
    positiveTerms.unshift(cleanIdea);
  }

  // Ajouter des termes selon la catégorie
  if (category) {
    const categoryTerms: Record<string, string[]> = {
      'tech': ['technology', 'gadget', 'device', 'modern'],
      'books': ['book', 'reading', 'literature', 'novel'],
      'fashion': ['style', 'clothing', 'accessories', 'fashion'],
      'home': ['home', 'decoration', 'interior', 'cozy'],
      'sport': ['sport', 'fitness', 'active', 'outdoor'],
      'food': ['gourmet', 'cooking', 'culinary', 'delicious'],
      'art': ['creative', 'artistic', 'craft', 'handmade'],
      'beauty': ['beauty', 'skincare', 'cosmetics', 'wellness']
    };
    
    const terms = categoryTerms[category.toLowerCase()];
    if (terms) {
      positiveTerms.push(...terms);
    }
  }

  // Ajouter des termes selon l'occasion
  if (occasion) {
    const occasionTerms: Record<string, string[]> = {
      'anniversaire': ['birthday', 'celebration', 'festive', 'party'],
      'brunch': ['breakfast', 'morning', 'fresh', 'bright'],
      'cremaillere': ['housewarming', 'home', 'new', 'welcoming'],
      'diner_amis': ['dinner', 'social', 'gathering', 'friends']
    };
    
    const terms = occasionTerms[occasion.toLowerCase()];
    if (terms) {
      positiveTerms.push(...terms);
    }
  }

  // Termes négatifs pour éviter les illustrations et contenus non désirés
  const negativeTerms = [
    'cartoon', 'illustration', 'logo', 'abstract', 'clipart',
    'drawing', 'sketch', 'animated', 'icon', 'symbol',
    'fake', 'mockup', 'template', 'text', 'word'
  ];

  const query = positiveTerms.slice(0, 8).join(' '); // Limiter à 8 termes
  const negative = negativeTerms.map(term => `-${term}`).join(' ');

  return { query, negative };
}

// Fonction pour scorer la pertinence d'une image
function scoreImageRelevance(image: any, ideaText: string): number {
  let score = 0;
  const lowerIdea = ideaText.toLowerCase();
  
  // Score basé sur la description
  if (image.description) {
    const desc = image.description.toLowerCase();
    if (desc.includes(lowerIdea)) score += 3;
    if (desc.includes('gift') || desc.includes('present')) score += 2;
  }

  // Score basé sur les tags
  if (image.tags) {
    for (const tag of image.tags) {
      const tagTitle = tag.title?.toLowerCase() || '';
      if (tagTitle.includes(lowerIdea)) score += 2;
      if (tagTitle.includes('gift') || tagTitle.includes('present')) score += 1;
    }
  }

  // Score basé sur le titre alt
  if (image.alt_description) {
    const alt = image.alt_description.toLowerCase();
    if (alt.includes(lowerIdea)) score += 2;
  }

  return score;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const body: UnsplashGiftImageRequest = await req.json();
    
    if (!body.idea_text) {
      return new Response(JSON.stringify({
        error: 'Missing idea_text parameter'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const unsplashAccessKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!unsplashAccessKey) {
      throw new Error('UNSPLASH_ACCESS_KEY not configured');
    }

    // Initialize Supabase for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create cache key
    const cacheKey = `gift_idea_${body.idea_text}_${body.category || 'none'}_${body.occasion || 'none'}`;
    
    // Check cache first (24h expiry)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: cachedResult } = await supabase
      .from('image_library')
      .select('*')
      .eq('category_id', cacheKey)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cachedResult) {
      console.log(`[UnsplashGiftIdeas] Cache hit for: ${cacheKey}`);
      return new Response(JSON.stringify({
        cached: true,
        image: {
          id: cachedResult.id,
          url: cachedResult.image_url,
          author: cachedResult.attrs?.author || 'Unknown',
          source: 'cache'
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build optimized query
    const { query, negative } = buildUnsplashQueryForGiftIdea(
      body.idea_text,
      body.category,
      body.occasion
    );

    const fullQuery = `${query} ${negative}`;
    const perPage = Math.min(body.per_page || 3, 10); // Max 10 images

    console.log(`[UnsplashGiftIdeas] Searching with query: "${fullQuery}"`);

    // Search Unsplash
    const unsplashUrl = new URL('https://api.unsplash.com/search/photos');
    unsplashUrl.searchParams.set('query', fullQuery);
    unsplashUrl.searchParams.set('per_page', perPage.toString());
    unsplashUrl.searchParams.set('orientation', 'squarish');
    unsplashUrl.searchParams.set('content_filter', 'high');

    const response = await fetch(unsplashUrl.toString(), {
      headers: {
        'Authorization': `Client-ID ${unsplashAccessKey}`,
        'Accept-Version': 'v1'
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      // Fallback: use a simple "gift" query
      console.log(`[UnsplashGiftIdeas] No results, using fallback query`);
      
      const fallbackUrl = new URL('https://api.unsplash.com/search/photos');
      fallbackUrl.searchParams.set('query', 'gift present lifestyle');
      fallbackUrl.searchParams.set('per_page', '3');
      fallbackUrl.searchParams.set('orientation', 'squarish');

      const fallbackResponse = await fetch(fallbackUrl.toString(), {
        headers: {
          'Authorization': `Client-ID ${unsplashAccessKey}`,
          'Accept-Version': 'v1'
        }
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.results && fallbackData.results.length > 0) {
          data.results = fallbackData.results;
        }
      }
    }

    let selectedImage;
    
    if (data.results && data.results.length > 0) {
      // Re-rank images by relevance if we have multiple
      if (data.results.length > 1) {
        const scoredImages = data.results.map((img: any) => ({
          ...img,
          relevanceScore: scoreImageRelevance(img, body.idea_text)
        }));

        scoredImages.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);
        selectedImage = scoredImages[0];
      } else {
        selectedImage = data.results[0];
      }

      // Cache the result
      try {
        await supabase
          .from('image_library')
          .insert({
            category_id: cacheKey,
            label: `Gift idea: ${body.idea_text}`,
            image_url: selectedImage.urls.regular,
            source: 'unsplash',
            attrs: {
              author: selectedImage.user.name,
              author_username: selectedImage.user.username,
              unsplash_id: selectedImage.id,
              download_location: selectedImage.links.download_location,
              idea_text: body.idea_text,
              category: body.category,
              occasion: body.occasion,
              query_used: fullQuery,
              relevance_score: selectedImage.relevanceScore || 0
            }
          });
      } catch (cacheError) {
        console.error('[UnsplashGiftIdeas] Cache save error:', cacheError);
        // Don't fail the request for cache errors
      }

      // Track download for Unsplash API compliance
      if (selectedImage.links.download_location) {
        try {
          await fetch(selectedImage.links.download_location, {
            headers: {
              'Authorization': `Client-ID ${unsplashAccessKey}`
            }
          });
        } catch (downloadError) {
          console.error('[UnsplashGiftIdeas] Download tracking error:', downloadError);
        }
      }

      return new Response(JSON.stringify({
        cached: false,
        image: {
          id: selectedImage.id,
          url: selectedImage.urls.regular,
          url_small: selectedImage.urls.small,
          author: selectedImage.user.name,
          author_url: selectedImage.user.links.html,
          unsplash_url: selectedImage.links.html,
          description: selectedImage.description || selectedImage.alt_description,
          source: 'unsplash'
        },
        query_used: fullQuery,
        total_results: data.total,
        relevance_score: selectedImage.relevanceScore || 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      // No images found, return placeholder or error
      return new Response(JSON.stringify({
        cached: false,
        image: null,
        message: 'No suitable images found for this gift idea',
        query_used: fullQuery,
        suggestion: 'Try using a more general gift idea or different category'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('[UnsplashGiftIdeas] Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch gift idea image',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});