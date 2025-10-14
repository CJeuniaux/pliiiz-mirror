// Switched to Deno.serve for better background task support
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SemanticMapping {
  category: string;
  keywords: string[];
  excludeKeywords: string[];
  anchors: string[];
  unsplashQueries: string[];
  confidence: number;
}

interface GiftIdea {
  id: number;
  gift_idea_text: string;
  category?: string;
  occasion?: string;
  visual_version: number;
  is_user_uploaded: boolean;
}

interface JobStats {
  total: number;
  processed: number;
  success: number;
  failed: number;
  ai_generated: number;
  unsplash_generated: number;
  avg_confidence: number;
}

// Semantic database (excerpt - would be full in production)
const SEMANTIC_DATABASE: Record<string, any> = {
  "vin": {
    "category": "vin",
    "synonyms": ["bouteille de vin","cave à vin","vignoble","oenologie"],
    "positive": ["bottle of wine","vineyard","sommelier","decanter","wine cellar"],
    "negative": ["beer","whisky","flower"],
    "anchors": ["bouteille étiquetée","verre ballon","carafe"],
    "unsplash": ["red wine bottle studio", "vineyard sunset"]
  },
  "enceinte bluetooth": {
    "category": "audio",
    "synonyms": ["haut-parleur bluetooth","enceinte portable","speaker"],
    "positive": ["portable bluetooth speaker","outdoor","waterproof","controls"],
    "negative": ["flower rose","bouquet","headphones"],
    "anchors": ["grille textile","boutons lecture","USB-C"],
    "unsplash": ["portable bluetooth speaker outdoor"]
  },
  "chocolat": {
    "category": "gourmandise",
    "synonyms": ["chocolats fins","tablette cacao","ganaches"],
    "positive": ["artisan chocolate","truffles","cocoa beans"],
    "negative": ["candy bright colors"],
    "anchors": ["boîte cadeau chocolat","tablettes empilées"],
    "unsplash": ["artisan chocolate box dark"]
  }
};

function createSemanticMapping(giftIdea: string): SemanticMapping {
  const normalizedIdea = giftIdea.toLowerCase().trim();
  
  // Exact match
  if (SEMANTIC_DATABASE[normalizedIdea]) {
    const entry = SEMANTIC_DATABASE[normalizedIdea];
    return {
      category: entry.category,
      keywords: entry.positive,
      excludeKeywords: entry.negative,
      anchors: entry.anchors,
      unsplashQueries: entry.unsplash,
      confidence: 0.9
    };
  }
  
  // Fuzzy match based on synonyms
  for (const [key, entry] of Object.entries(SEMANTIC_DATABASE)) {
    if (entry.synonyms.some((synonym: string) => 
      normalizedIdea.includes(synonym.toLowerCase()) || 
      synonym.toLowerCase().includes(normalizedIdea)
    )) {
      return {
        category: entry.category,
        keywords: entry.positive,
        excludeKeywords: entry.negative,
        anchors: entry.anchors,
        unsplashQueries: entry.unsplash,
        confidence: 0.8
      };
};
  }

  // Fallback
  return {
    category: 'general',
    keywords: [giftIdea, 'product', 'gift'],
    excludeKeywords: ['office', 'corporate'],
    anchors: [giftIdea],
    unsplashQueries: [giftIdea],
    confidence: 0.3
  };
}

// Background task helper compatible with different runtimes
function runBg(task: () => Promise<void>) {
  try {
    // @ts-ignore - EdgeRuntime may exist in Supabase Edge
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(task());
      return;
    }
  } catch {}
  // Fallback: fire and forget
  task();
}

function calculateIntentHash(mapping: SemanticMapping, giftIdea: string): string {
  const content = JSON.stringify({
    category: mapping.category,
    keywords: mapping.keywords.sort(),
    anchors: mapping.anchors.sort(),
    idea: giftIdea.toLowerCase().trim()
  });
  
  // Simple hash for demo - use crypto in production
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

async function generateAIImage(supabase: any, mapping: SemanticMapping, giftIdea: string): Promise<{url: string; confidence: number; prompts: {positive: string; negative: string}} | null> {
  try {
    // Build AI prompt using semantic structure
    const positive = `${mapping.category} — ${mapping.keywords.slice(0, 4).join(', ')} — montrer ${mapping.anchors.slice(0, 2).join(', ')} — style photo produit — fond neutre — bonne lumière — haute qualité`;
    const negative = `low quality, blurry, pixelated, watermark, text, logos, multiple items, cluttered background, no ${mapping.excludeKeywords.join(', no ')}`;
    
    console.log(`Generating AI image for "${giftIdea}" with prompt: ${positive}`);
    
    // Call our generate-gift-image function which handles OpenAI properly
    const { data, error } = await supabase.functions.invoke('generate-gift-image', {
      body: {
        giftName: giftIdea,
        promptParams: {
          positive,
          negative
        }
      }
    });
    
    if (error || !data || data.fallback) {
      throw new Error(error?.message || data?.error || 'Image generation failed');
    }
    
    // Return the public URL from storage
    if (data.publicUrl) {
      return { 
        url: data.publicUrl, 
        confidence: mapping.confidence, 
        prompts: { positive, negative } 
      };
    }
    
    return null;
  } catch (error) {
    console.error(`AI generation failed for "${giftIdea}":`, error);
    return null;
  }
}

// Unsplash removed - using OpenAI exclusively

async function processGiftIdea(
  supabase: any,
  idea: GiftIdea,
  jobId: string
): Promise<{ success: boolean; source: string; confidence: number; error?: string }> {
  try {
    const mapping = createSemanticMapping(idea.gift_idea_text);
    const intentHash = calculateIntentHash(mapping, idea.gift_idea_text);
    
    console.log(`Processing idea ${idea.id}: "${idea.gift_idea_text}"`);
    
    // Generate image with OpenAI
    const result = await generateAIImage(supabase, mapping, idea.gift_idea_text);
    const source = 'openai';
    
    if (!result) {
      return { success: false, source: 'none', confidence: 0, error: 'OpenAI image generation failed' };
    }
    
    // Add generation to history
    const historyEntry = {
      date: new Date().toISOString(),
      source,
      confidence: result.confidence,
      prompt_positive: result.prompts.positive,
      prompt_negative: result.prompts.negative
    };

    // Update the database record
    const updateData: any = {
      image_url: result.url,
      visual_version: idea.visual_version + 1,
      visual_intent_hash: intentHash,
      visual_source: source,
      visual_confidence: result.confidence,
      last_generated_at: new Date().toISOString(),
      last_prompt_positive: result.prompts.positive,
      last_prompt_negative: result.prompts.negative,
      generator_version: 'v2',
      regenerated_at: new Date().toISOString()
    };
    
    // Add Unsplash metadata if applicable
    if (source === 'unsplash' && 'metadata' in result) {
      Object.assign(updateData, result.metadata);
    }

    // Fetch current history and append new entry (keep last 10)
    const { data: currentData } = await supabase
      .from('gift_idea_unsplash')
      .select('generation_history')
      .eq('id', idea.id)
      .single();

    const currentHistory = currentData?.generation_history || [];
    const newHistory = [...currentHistory, historyEntry].slice(-10);
    updateData.generation_history = newHistory;
    
    const { error: updateError } = await supabase
      .from('gift_idea_unsplash')
      .update(updateData)
      .eq('id', idea.id);
    
    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }
    
    console.log(`✅ Successfully updated idea ${idea.id} with ${source} image (confidence: ${result.confidence})`);
    return { success: true, source, confidence: result.confidence };
    
  } catch (error: any) {
    console.error(`❌ Error processing idea ${idea.id}:`, error);
    return { success: false, source: 'error', confidence: 0, error: error.message };
  }
}

async function updateJobProgress(
  supabase: any,
  jobId: string,
  progress: Partial<JobStats>,
  logs?: string[]
) {
  const updateData: any = {
    processed_items: progress.processed,
    success_items: progress.success,
    failed_items: progress.failed,
    updated_at: new Date().toISOString()
  };
  
  if (logs && logs.length > 0) {
    updateData.error_log = logs;
  }
  
  if (progress.processed === progress.total) {
    updateData.status = 'completed';
    updateData.completed_at = new Date().toISOString();
    updateData.stats = {
      ai_generated: progress.ai_generated,
      unsplash_generated: progress.unsplash_generated,
      avg_confidence: progress.avg_confidence
    };
    console.log(`✅ Job ${jobId} terminé avec succès. Stats finales:`, updateData.stats);
  }
  
  const { error } = await supabase
    .from('gift_regen_jobs')
    .update(updateData)
    .eq('id', jobId);
    
  if (error) {
    console.error('Erreur lors de la mise à jour du job:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: any = {};
    if (req.method === 'POST') {
      try { body = await req.json(); } catch { body = {}; }
    }
    const { action, force_regen = false, jobId } = body;

    if (action === 'start_regeneration') {
      console.log('🚀 Starting gift ideas regeneration job with force_regen =', force_regen);
      
      // Create job record
      const { data: job, error: jobError } = await supabase
        .from('gift_regen_jobs')
        .insert({
          job_type: 'full_regeneration',
          status: 'running',
          force_regen,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (jobError) {
        console.error('Error creating job:', jobError);
        throw new Error(`Failed to create job: ${jobError.message}`);
      }

      const newJobId = job.id;
      console.log(`✅ Created job ${newJobId} with force_regen=${force_regen}`);

      // Fetch gift ideas to process - ALL non-user-uploaded ideas when force_regen is true
      const { data: giftIdeas, error: fetchError } = await supabase
        .from('gift_idea_unsplash')
        .select('id, gift_idea_text, category, occasion, visual_version, is_user_uploaded, image_url')
        .eq('is_user_uploaded', false); // Only auto-generated images

      if (fetchError) {
        console.error('Error fetching gift ideas:', fetchError);
        throw new Error(`Failed to fetch gift ideas: ${fetchError.message}`);
      }

      const totalItems = giftIdeas?.length || 0;
      console.log(`📊 Found ${totalItems} gift ideas to process (force_regen=${force_regen})`);

      // Update job with total count
      await supabase
        .from('gift_regen_jobs')
        .update({ total_items: totalItems })
        .eq('id', newJobId);

      if (totalItems === 0) {
        await supabase
          .from('gift_regen_jobs')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString() 
          })
          .eq('id', newJobId);

        return new Response(JSON.stringify({
          success: true,
          message: 'No gift ideas to process',
          jobId: newJobId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Start background processing
      runBg(async () => {
        const batchSize = 5; // Smaller batches for more reliable processing
        const stats: JobStats = {
          total: totalItems,
          processed: 0,
          success: 0,
          failed: 0,
          ai_generated: 0,
          unsplash_generated: 0,
          avg_confidence: 0
        };
        
        let totalConfidence = 0;
        const logs: string[] = [];

        const pushLog = async (msg: string) => {
          const line = `${new Date().toISOString()} :: ${msg}`;
          logs.push(line);
          await supabase.from('gift_regen_jobs').update({ error_log: logs, updated_at: new Date().toISOString() }).eq('id', newJobId);
        };

        await pushLog(`Job démarré (${totalItems} éléments)`);
        
        console.log(`🔄 Starting background processing of ${totalItems} items in batches of ${batchSize}`);

        for (let i = 0; i < giftIdeas.length; i += batchSize) {
          const batch = giftIdeas.slice(i, i + batchSize);
          const batchNum = Math.floor(i/batchSize) + 1;
          await pushLog(`Traitement du batch ${batchNum}/${Math.ceil(giftIdeas.length/batchSize)} (${batch.length} items)`);

          // Process batch sequentially to avoid overwhelming APIs
          for (const idea of batch) {
            try {
              await pushLog(`Traitement ${stats.processed + 1}/${totalItems} :: ideaId=${idea.id} :: ${idea.gift_idea_text}`);
              const result = await processGiftIdea(supabase, idea as GiftIdea, newJobId);
              
              stats.processed++;
              if (result.success) {
                stats.success++;
                totalConfidence += result.confidence;
                if (result.source === 'ai') stats.ai_generated++;
                if (result.source === 'unsplash') stats.unsplash_generated++;
                await pushLog(`image_v2 saved (source=${result.source}, conf=${result.confidence.toFixed(2)})`);
              } else {
                stats.failed++;
                await pushLog(`échec: ${result.error || 'unknown'}`);
              }
            } catch (error) {
              stats.processed++;
              stats.failed++;
              await pushLog(`exception: ${(error as Error).message}`);
              console.error(`💥 Exception processing idea ${idea.id}:`, error);
            }

            // Update progress after each item
            stats.avg_confidence = stats.success > 0 ? totalConfidence / stats.success : 0;
            await updateJobProgress(supabase, newJobId, stats, logs);
          }

          // Add delay between batches
          if (i + batchSize < giftIdeas.length) {
            await pushLog(`Pause 3s avant le prochain batch`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }

        await pushLog(`Traitement terminé. Success=${stats.success}, Failed=${stats.failed}`);
        console.log(`🎉 Background processing completed for job ${newJobId}:`, stats);
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Regeneration started in background',
        jobId: newJobId
      }), {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'job_status') {
      if (!jobId) {
        return new Response(JSON.stringify({ error: 'Missing jobId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const { data: job, error } = await supabase
        .from('gift_regen_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error fetching job:', error);
        return new Response(JSON.stringify({ 
          error: 'Job not found', 
          details: error.message 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ job }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'retry_failed') {
      // Retry a failed job
      if (!jobId) {
        return new Response(JSON.stringify({ error: 'Missing jobId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Fetch the failed job
      const { data: failedJob, error: fetchError } = await supabase
        .from('gift_regen_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (fetchError || !failedJob || failedJob.status !== 'failed') {
        return new Response(JSON.stringify({ 
          error: 'Job not found or not in failed status' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create a new retry job
      const { data: retryJob, error: createError } = await supabase
        .from('gift_regen_jobs')
        .insert({
          job_type: `retry_${failedJob.job_type}`,
          status: 'running',
          force_regen: failedJob.force_regen,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`🔄 Retrying failed job ${jobId} as new job ${retryJob.id}`);

      // Get failed items from error log
      const errorLog = failedJob.error_log || [];
      const failedIdeas: number[] = [];
      
      // Extract failed idea IDs from logs
      errorLog.forEach((log: string) => {
        const match = log.match(/ideaId=(\d+)/);
        if (match && log.includes('échec:')) {
          failedIdeas.push(parseInt(match[1]));
        }
      });

      if (failedIdeas.length === 0) {
        await supabase
          .from('gift_regen_jobs')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            error_log: ['No failed items to retry']
          })
          .eq('id', retryJob.id);

        return new Response(JSON.stringify({
          success: true,
          message: 'No failed items to retry',
          jobId: retryJob.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Fetch failed gift ideas
      const { data: giftIdeas, error: fetchIdeasError } = await supabase
        .from('gift_idea_unsplash')
        .select('id, gift_idea_text, category, occasion, visual_version, is_user_uploaded')
        .in('id', failedIdeas);

      if (fetchIdeasError || !giftIdeas || giftIdeas.length === 0) {
        return new Response(JSON.stringify({ error: 'Failed to fetch gift ideas' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const totalItems = giftIdeas.length;
      await supabase
        .from('gift_regen_jobs')
        .update({ total_items: totalItems })
        .eq('id', retryJob.id);

      // Start background retry
      runBg(async () => {
        const stats: JobStats = {
          total: totalItems,
          processed: 0,
          success: 0,
          failed: 0,
          ai_generated: 0,
          unsplash_generated: 0,
          avg_confidence: 0
        };
        
        let totalConfidence = 0;
        const logs: string[] = [];

        const pushLog = async (msg: string) => {
          const line = `${new Date().toISOString()} :: ${msg}`;
          logs.push(line);
          await supabase.from('gift_regen_jobs').update({ error_log: logs }).eq('id', retryJob.id);
        };

        await pushLog(`Retry job démarré (${totalItems} éléments failed du job ${jobId})`);

        for (const idea of giftIdeas) {
          await pushLog(`Retry ${stats.processed + 1}/${totalItems} :: ideaId=${idea.id} :: ${idea.gift_idea_text}`);
          const result = await processGiftIdea(supabase, idea as GiftIdea, retryJob.id);
          
          stats.processed++;
          if (result.success) {
            stats.success++;
            totalConfidence += result.confidence;
            if (result.source === 'ai') stats.ai_generated++;
            if (result.source === 'unsplash') stats.unsplash_generated++;
            await pushLog(`✅ réussi (source=${result.source}, conf=${result.confidence.toFixed(2)})`);
          } else {
            stats.failed++;
            await pushLog(`❌ échec: ${result.error || 'unknown'}`);
          }

          stats.avg_confidence = stats.success > 0 ? totalConfidence / stats.success : 0;
          await updateJobProgress(supabase, retryJob.id, stats, logs);
          
          // Add delay between items
          await new Promise(r => setTimeout(r, 2000));
        }

        await pushLog(`Retry terminé. Success=${stats.success}, Failed=${stats.failed}`);
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Retry started',
        jobId: retryJob.id,
        retryingItems: totalItems
      }), {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'get_stats') {
      // Aggregate stats for dashboard
      const { data, error } = await supabase
        .from('gift_idea_unsplash')
        .select('visual_source, visual_confidence, is_user_uploaded, generator_version');

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const stats = {
        total: data.length,
        auto_generated: data.filter((i: any) => !i.is_user_uploaded).length,
        user_uploaded: data.filter((i: any) => i.is_user_uploaded).length,
        v2_generated: data.filter((i: any) => i.generator_version === 'v2').length,
        ai_source: data.filter((i: any) => i.visual_source === 'ai').length,
        unsplash_source: data.filter((i: any) => i.visual_source === 'unsplash').length,
        avg_confidence: data.reduce((sum: number, it: any) => sum + (it.visual_confidence || 0), 0) / Math.max(data.length, 1),
        low_confidence: data.filter((i: any) => (i.visual_confidence || 0) < 0.5).length,
      };

      return new Response(JSON.stringify({ stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'start_test') {
      console.log('🧪 Starting TEST regeneration job');
      // Create job record
      const { data: job, error: jobError } = await supabase
        .from('gift_regen_jobs')
        .insert({ job_type: 'test', status: 'running', started_at: new Date().toISOString() })
        .select()
        .single();

      if (jobError) {
        console.error('Error creating test job:', jobError);
        return new Response(JSON.stringify({ error: jobError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const newJobId = job.id;

      // Select limited set for test: low confidence or random 10
      const { data: giftIdeas, error: fetchError } = await supabase
        .from('gift_idea_unsplash')
        .select('id, gift_idea_text, category, occasion, visual_version, is_user_uploaded, image_url, visual_confidence')
        .eq('is_user_uploaded', false)
        .order('visual_confidence', { ascending: true, nullsFirst: true })
        .limit(10);

      if (fetchError) {
        return new Response(JSON.stringify({ error: fetchError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const totalItems = giftIdeas?.length || 0;
      await supabase.from('gift_regen_jobs').update({ total_items: totalItems }).eq('id', newJobId);

      runBg(async () => {
        const stats: JobStats = { total: totalItems, processed: 0, success: 0, failed: 0, ai_generated: 0, unsplash_generated: 0, avg_confidence: 0 };
        const logs: string[] = [];
        const pushLog = async (msg: string) => {
          const line = `${new Date().toISOString()} :: ${msg}`;
          logs.push(line);
          await supabase.from('gift_regen_jobs').update({ error_log: logs, updated_at: new Date().toISOString() }).eq('id', newJobId);
        };

        await pushLog(`Job TEST démarré (${totalItems} éléments)`);
        let totalConfidence = 0;
        for (const idea of giftIdeas) {
          await pushLog(`Traitement ${stats.processed + 1}/${totalItems} :: ideaId=${idea.id} :: ${idea.gift_idea_text}`);
          const result = await processGiftIdea(supabase, idea as GiftIdea, newJobId);
          stats.processed++;
          if (result.success) {
            stats.success++;
            totalConfidence += result.confidence;
            if (result.source === 'ai') stats.ai_generated++;
            if (result.source === 'unsplash') stats.unsplash_generated++;
            await pushLog(`image_v2 saved (source=${result.source}, conf=${result.confidence.toFixed(2)})`);
          } else {
            stats.failed++;
            await pushLog(`échec: ${result.error || 'unknown'}`);
          }
          stats.avg_confidence = stats.success > 0 ? totalConfidence / stats.success : 0;
          await updateJobProgress(supabase, newJobId, stats, logs);
          await new Promise(r => setTimeout(r, 500));
        }
        await pushLog(`TEST terminé. Success=${stats.success}, Failed=${stats.failed}`);
      });

      return new Response(JSON.stringify({ success: true, message: 'Test started', jobId: newJobId }), {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('❌ Error in regenerate-gift-images:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});