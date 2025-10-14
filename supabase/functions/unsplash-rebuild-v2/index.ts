import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  user: {
    name: string;
    links: { html: string };
  };
  links: {
    html: string;
    download_location: string;
  };
  description: string | null;
  alt_description: string | null;
  tags: Array<{ title: string }>;
}

interface GiftIdea {
  id: string;
  text: string;
  category: string | null;
  occasion: string | null;
  user_id: string | null;
}

// Utilise le nouveau générateur de requêtes amélioré
async function buildUnsplashQueryV2(ideaText: string, category?: string, occasion?: string): Promise<string> {
  try {
    // Utilise la fonction Unsplash Query Generator améliorée
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase.functions.invoke('unsplash-query-generator', {
      body: { giftIdea: ideaText, language: 'fr' }
    });
    
    if (error || !data?.query) {
      console.warn(`[UnsplashRebuildV2] Query generator failed for "${ideaText}", using fallback`);
      return buildFallbackQuery(ideaText, category, occasion);
    }
    
    console.log(`[UnsplashRebuildV2] Generated query: "${data.query}" for "${ideaText}"`);
    return data.query;
  } catch (error) {
    console.warn(`[UnsplashRebuildV2] Query generator error for "${ideaText}":`, error);
    return buildFallbackQuery(ideaText, category, occasion);
  }
}

// Fallback simple en cas d'échec du générateur
function buildFallbackQuery(ideaText: string, category?: string, occasion?: string): string {
  const cleanIdea = ideaText.toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôöùûüÿç-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const baseTerms = ['product', 'isolated', 'clean'];
  const negativeTerms = ['-cartoon', '-illustration', '-drawing', '-sketch', '-text', '-logo'];
  
  const positiveQuery = [cleanIdea, ...baseTerms].join(' ');
  const negativeQuery = negativeTerms.join(' ');
  
  return `${positiveQuery} ${negativeQuery}`;
}

// Re-ranking sémantique
function scoreImageRelevance(image: UnsplashImage, ideaText: string): number {
  let score = 0;
  const lowerIdea = ideaText.toLowerCase();
  const ideaWords = lowerIdea.split(' ').filter(w => w.length > 2);
  
  // Score description (pondération forte)
  if (image.description) {
    const desc = image.description.toLowerCase();
    ideaWords.forEach(word => {
      if (desc.includes(word)) score += 3;
    });
    if (desc.includes('gift') || desc.includes('present')) score += 2;
  }
  
  // Score alt description
  if (image.alt_description) {
    const alt = image.alt_description.toLowerCase();
    ideaWords.forEach(word => {
      if (alt.includes(word)) score += 2;
    });
  }
  
  // Score tags
  if (image.tags && image.tags.length > 0) {
    image.tags.forEach(tag => {
      const tagTitle = tag.title?.toLowerCase() || '';
      ideaWords.forEach(word => {
        if (tagTitle.includes(word)) score += 1;
      });
      if (tagTitle.includes('gift') || tagTitle.includes('present')) score += 1;
    });
  }
  
  return score;
}

// Rate limiting avec backoff exponentiel
class UnsplashRateLimiter {
  private lastCall = 0;
  private retryCount = 0;
  private baseDelay: number;
  
  constructor(baseDelayMs = 350) {
    this.baseDelay = baseDelayMs;
  }
  
  async waitForNextCall(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    const requiredDelay = this.baseDelay * Math.pow(2, this.retryCount);
    
    if (timeSinceLastCall < requiredDelay) {
      await new Promise(resolve => setTimeout(resolve, requiredDelay - timeSinceLastCall));
    }
    
    this.lastCall = Date.now();
  }
  
  onSuccess(): void {
    this.retryCount = Math.max(0, this.retryCount - 1);
  }
  
  onError(): void {
    this.retryCount = Math.min(5, this.retryCount + 1);
  }
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
    const { action, gift_ideas, session_id } = await req.json();
    
    if (action !== 'rebuild_all') {
      return new Response(JSON.stringify({
        error: 'Invalid action. Use "rebuild_all"'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const unsplashAccessKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!unsplashAccessKey) {
      throw new Error('UNSPLASH_ACCESS_KEY not configured');
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const sessionId = session_id || crypto.randomUUID();
    const rateLimiter = new UnsplashRateLimiter(350);
    
    let stats = {
      total: 0,
      processed: 0,
      success: 0,
      fallback: 0,
      skip: 0,
      errors: 0
    };

    console.log(`[UnsplashRebuildV2] Starting rebuild session: ${sessionId}`);

    // Si pas d'idées fournies, on récupère depuis les profils
    let ideasToProcess: GiftIdea[] = gift_ideas || [];
    
    if (ideasToProcess.length === 0) {
      console.log('[UnsplashRebuildV2] Fetching gift ideas from profiles...');
      
      // Récupérer toutes les idées cadeaux depuis les profils
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, global_preferences')
        .not('global_preferences', 'is', null);

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      profiles?.forEach(profile => {
        const giftIdeas = profile.global_preferences?.giftIdeas || [];
        giftIdeas.forEach((idea: any) => {
          if (typeof idea === 'string') {
            ideasToProcess.push({
              id: crypto.randomUUID(),
              text: idea,
              category: null,
              occasion: null,
              user_id: profile.user_id
            });
          } else if (idea?.label) {
            ideasToProcess.push({
              id: crypto.randomUUID(),
              text: idea.label,
              category: idea.category || null,
              occasion: null,
              user_id: profile.user_id
            });
          }
        });
      });
    }

    stats.total = ideasToProcess.length;
    console.log(`[UnsplashRebuildV2] Processing ${stats.total} gift ideas`);

    // Traitement des idées avec rate limiting
    for (const idea of ideasToProcess) {
      try {
        stats.processed++;
        
        // Calculer hash stable
        const { data: hashResult } = await supabase.rpc('stable_gift_idea_hash', {
          idea_text: idea.text,
          category: idea.category,
          occasion: idea.occasion
        });
        
        const ideaHash = hashResult;
        
        // Vérifier si v2 existe déjà ET a une image valide
        const { data: existing } = await supabase
          .from('gift_idea_unsplash')
          .select('id, image_url, image_status')
          .eq('gift_idea_hash', ideaHash)
          .eq('generator_version', 'v2')
          .limit(1)
          .maybeSingle();

        // Skip seulement si l'image existe ET est valide (not pending/error)
        if (existing && existing.image_url && existing.image_status === 'ok') {
          stats.skip++;
          console.log(`[UnsplashRebuildV2] Skipping existing valid image: ${idea.text}`);
          continue;
        }

        console.log(`[UnsplashRebuildV2] Processing: ${idea.text} (${existing ? 'updating' : 'creating'})`);


        // Rate limiting
        await rateLimiter.waitForNextCall();

        // Construire query v2 avec le nouveau générateur amélioré
        const query = await buildUnsplashQueryV2(idea.text, idea.category || undefined, idea.occasion || undefined);
        
        console.log(`[UnsplashRebuildV2] Searching: "${query}" for "${idea.text}"`);

        // Appel Unsplash
        const unsplashUrl = new URL('https://api.unsplash.com/search/photos');
        unsplashUrl.searchParams.set('query', query);
        unsplashUrl.searchParams.set('per_page', '6');
        unsplashUrl.searchParams.set('orientation', 'squarish');
        unsplashUrl.searchParams.set('content_filter', 'high');

        const response = await fetch(unsplashUrl.toString(), {
          headers: {
            'Authorization': `Client-ID ${unsplashAccessKey}`,
            'Accept-Version': 'v1'
          }
        });

        if (!response.ok) {
          if (response.status === 429 || response.status === 503) {
            rateLimiter.onError();
            console.log('[UnsplashRebuildV2] Rate limited, increasing delay');
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          throw new Error(`Unsplash API error: ${response.status}`);
        }

        rateLimiter.onSuccess();
        const data = await response.json();

        let selectedImage: UnsplashImage | null = null;
        let relevanceScore = 0;

        if (data.results && data.results.length > 0) {
          // Re-ranking par pertinence
          const scoredImages = data.results.map((img: UnsplashImage) => ({
            image: img,
            score: scoreImageRelevance(img, idea.text)
          }));

          scoredImages.sort((a, b) => b.score - a.score);
          
          const best = scoredImages[0];
          if (best.score >= 0.35) {
            selectedImage = best.image;
            relevanceScore = best.score;
          }
        }

        // Enregistrer résultat
        if (selectedImage) {
          await supabase
            .from('gift_idea_unsplash')
            .insert({
              gift_idea_text: idea.text,
              gift_idea_hash: ideaHash,
              user_id: idea.user_id,
              category: idea.category,
              occasion: idea.occasion,
              unsplash_id: selectedImage.id,
              image_url: selectedImage.urls.regular,
              photographer_name: selectedImage.user.name,
              photographer_url: selectedImage.user.links.html,
              unsplash_url: selectedImage.links.html,
              query_used: query,
              relevance_score: relevanceScore,
              generator_version: 'v2',
              regenerated_at: new Date().toISOString()
            });

          // Track download pour Unsplash
          if (selectedImage.links.download_location) {
            try {
              await fetch(selectedImage.links.download_location, {
                headers: { 'Authorization': `Client-ID ${unsplashAccessKey}` }
              });
            } catch (e) {
              console.error('[UnsplashRebuildV2] Download tracking failed:', e);
            }
          }

          stats.success++;
          console.log(`[UnsplashRebuildV2] Success: ${idea.text} (score: ${relevanceScore})`);
        } else {
          // Fallback entry
          await supabase
            .from('gift_idea_unsplash')
            .insert({
              gift_idea_text: idea.text,
              gift_idea_hash: ideaHash,
              user_id: idea.user_id,
              category: idea.category,
              occasion: idea.occasion,
              query_used: query,
              relevance_score: 0,
              generator_version: 'v2',
              regenerated_at: new Date().toISOString()
            });

          stats.fallback++;
          console.log(`[UnsplashRebuildV2] Fallback: ${idea.text}`);
        }

      } catch (error) {
        stats.errors++;
        console.error(`[UnsplashRebuildV2] Error processing "${idea.text}":`, error);
        
        // Enregistrer métrique d'erreur
        await supabase
          .from('unsplash_rebuild_metrics')
          .insert({
            rebuild_session_id: sessionId,
            metric_name: 'error_detail',
            metric_value: 1,
            details: {
              gift_idea: idea.text,
              error: error.message
            }
          });
      }
    }

    // Enregistrer métriques finales
    const metricsToInsert = [
      { metric_name: 'rebuild_total', metric_value: stats.total },
      { metric_name: 'rebuild_processed', metric_value: stats.processed },
      { metric_name: 'rebuild_success', metric_value: stats.success },
      { metric_name: 'rebuild_fallback', metric_value: stats.fallback },
      { metric_name: 'rebuild_skip', metric_value: stats.skip },
      { metric_name: 'rebuild_errors', metric_value: stats.errors }
    ].map(metric => ({
      rebuild_session_id: sessionId,
      ...metric
    }));

    await supabase
      .from('unsplash_rebuild_metrics')
      .insert(metricsToInsert);

    console.log(`[UnsplashRebuildV2] Session completed: ${sessionId}`, stats);

    return new Response(JSON.stringify({
      session_id: sessionId,
      status: 'completed',
      stats,
      message: `Processed ${stats.processed}/${stats.total} gift ideas. Success: ${stats.success}, Fallback: ${stats.fallback}, Skipped: ${stats.skip}, Errors: ${stats.errors}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[UnsplashRebuildV2] Critical error:', error);
    return new Response(JSON.stringify({
      error: 'Rebuild failed',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});