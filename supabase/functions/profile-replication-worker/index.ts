import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OutboxItem {
  id: number
  user_id: string
  event_type: 'UPSERT_PROFILE' | 'DELETE_PROFILE'
  source_version: number
  payload: any
  created_at: string
  retry_count: number
  idempotency_key: string
}

interface ProcessingResult {
  processed: number
  failed: number
  errors: string[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { batchSize = 50, reconcile = false } = await req.json().catch(() => ({}))

    let result: ProcessingResult

    if (reconcile) {
      result = await runReconciliation(supabaseClient)
    } else {
      result = await processOutboxBatch(supabaseClient, batchSize)
    }

    // Update metrics
    await updateMetrics(supabaseClient, result)

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Profile replication worker error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function processOutboxBatch(supabase: any, batchSize: number): Promise<ProcessingResult> {
  console.log(`Processing outbox batch (size: ${batchSize})`)
  
  const { data: items, error } = await supabase
    .from('replication_outbox')
    .select('*')
    .is('processed_at', null)
    .lt('retry_count', 5) // Don't retry more than 5 times
    .order('created_at', { ascending: true })
    .limit(batchSize)

  if (error) {
    throw new Error(`Failed to fetch outbox items: ${error.message}`)
  }

  if (!items || items.length === 0) {
    return { processed: 0, failed: 0, errors: [] }
  }

  let processed = 0
  let failed = 0
  const errors: string[] = []

  for (const item of items) {
    try {
      await processOutboxItem(supabase, item)
      processed++
    } catch (error) {
      console.error(`Failed to process outbox item ${item.id}:`, error)
      failed++
      errors.push(`Item ${item.id}: ${error.message}`)
      
      // Update retry count and error
      await supabase
        .from('replication_outbox')
        .update({
          retry_count: item.retry_count + 1,
          last_error: error.message
        })
        .eq('id', item.id)
    }
  }

  return { processed, failed, errors }
}

async function processOutboxItem(supabase: any, item: OutboxItem) {
  console.log(`Processing outbox item ${item.id} for user ${item.user_id}`)

  if (item.event_type === 'DELETE_PROFILE') {
    // Handle profile deletion
    await supabase
      .from('public_profile_versions')
      .delete()
      .eq('user_id', item.user_id)

    await markOutboxItemProcessed(supabase, item.id)
    return
  }

  // Build public payload from source data (now async)
  const publicPayload = await buildPublicPayload(supabase, item.payload)
  const checksum = calculateChecksum(publicPayload)

  // Upsert with version check for idempotency
  const { error: upsertError } = await supabase.rpc('upsert_public_profile_version', {
    p_user_id: item.user_id,
    p_version: item.source_version,
    p_checksum: checksum,
    p_public_payload: publicPayload
  })

  if (upsertError) {
    throw new Error(`Upsert failed: ${upsertError.message}`)
  }

  await markOutboxItemProcessed(supabase, item.id)
}

// Générer une URL publique optimisée pour les images (support bucket & fallback URL signée)
function toPublicUrl(path: string): string {
  const baseUrl = Deno.env.get('SUPABASE_URL')
  const useSigned = Deno.env.get('USE_SIGNED_URLS') === 'true'
  
  if (!baseUrl) {
    console.warn('SUPABASE_URL not found, using relative path')
    return `/storage/v1/object/public/user-uploads/${path}`
  }

  if (useSigned) {
    // Note: pour URLs signées, il faudrait appeler supabase.storage.createSignedUrl()
    // Ici on utilise le bucket public avec transformation d'image
    console.log('Signed URLs requested but using public bucket for now')
  }

  return `${baseUrl}/storage/v1/object/public/user-uploads/${path}?width=640&quality=80&format=webp`
}

// Récupérer les médias publics de l'utilisateur (max 8, ordre stable pour checksum)
async function getPublicUploads(supabase: any, userId: string): Promise<any[]> {
  console.log(`[getPublicUploads] Fetching media for user ${userId}`)
  
  const { data, error } = await supabase
    .from('user_uploads')
    .select('id, path, kind, is_public, width, height, created_at, url')
    .eq('user_id', userId)
    .eq('is_public', true)
    .not('path', 'is', null) // Exclure les uploads sans path
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    console.error('Error fetching user uploads:', error)
    return []
  }

  const uploads = data || []
  console.log(`[getPublicUploads] Found ${uploads.length} public uploads for user ${userId}`)

  // Construire les media avec URL publique optimisée
  const media = uploads.map((r: any) => {
    const finalPath = r.path || extractPathFromUrl(r.url)
    if (!finalPath) {
      console.warn(`[getPublicUploads] No path found for upload ${r.id}`)
      return null
    }

    return {
      id: r.id,
      kind: r.kind || 'gift_idea',
      path: finalPath,
      url: toPublicUrl(finalPath),
      w: r.width ?? null,
      h: r.height ?? null,
      created_at: r.created_at
    }
  }).filter(Boolean) // Filtrer les nulls

  console.log(`[getPublicUploads] Returning ${media.length} valid media items`)
  return media
}

// Helper pour extraire le path depuis une URL complète (fallback)
function extractPathFromUrl(url: string): string {
  if (!url) return ''
  const match = url.match(/\/object\/public\/user-uploads\/(.+)(?:\?|$)/)
  return match ? match[1] : ''
}

// Get Unsplash v2 images for gift ideas
async function getGiftIdeasImages(supabase: any, giftIdeas: any[]): Promise<any[]> {
  if (!giftIdeas || giftIdeas.length === 0) return []
  
  try {
    // Extraire les textes des gift ideas (support format string et objet)
    const ideaTexts = giftIdeas.map(idea => 
      typeof idea === 'string' ? idea : (idea.label || idea.text || '').toString()
    ).filter(Boolean).slice(0, 8) // Limiter à 8 pour performance
    
    if (ideaTexts.length === 0) return []
    
    const { data: results, error } = await supabase
      .from('gift_idea_unsplash')
      .select(`
        gift_idea_text,
        image_url,
        photographer_name,
        photographer_url,
        unsplash_url,
        relevance_score
      `)
      .in('gift_idea_text', ideaTexts)
      .eq('generator_version', 'v2')
      .not('image_url', 'is', null)
      .order('relevance_score', { ascending: false })
    
    if (error) {
      console.error('[ProfileWorker] Error fetching gift ideas images:', error)
      return []
    }
    
    // Déduplication et mapping
    const uniqueImages = new Map()
    results?.forEach(row => {
      if (!uniqueImages.has(row.gift_idea_text)) {
        uniqueImages.set(row.gift_idea_text, {
          gift_idea: row.gift_idea_text,
          url: row.image_url,
          photographer: row.photographer_name,
          photographer_url: row.photographer_url,
          unsplash_url: row.unsplash_url,
          score: row.relevance_score || 0,
          is_fallback: (row.relevance_score || 0) < 0.35
        })
      }
    })
    
    const images = Array.from(uniqueImages.values())
    console.log(`[ProfileWorker] Found ${images.length} Unsplash v2 images for ${ideaTexts.length} gift ideas`)
    
    return images
  } catch (error) {
    console.error('[ProfileWorker] Error fetching gift ideas images:', error)
    return []
  }
}

// Mapping robuste en liste blanche pour Public Profile v2
async function buildPublicPayload(supabase: any, profileData: any): Promise<any> {
  // Normalisation des clés d'occasions
  const normalizeOccasionKey = (key: string): string => {
    const keyMap: Record<string, string> = {
      'diner-entre-amis': 'diner_amis',
      'cremaillere': 'cremaillere',
      'crémaillère': 'cremaillere',
      'anniversaires': 'anniversaire',
      'brunch': 'brunch'
    }
    return keyMap[key] || key.toLowerCase().replace(/[^a-z0-9]/g, '_')
  }

  // Construction des occasions normalisées
  const buildOccasion = (key: string) => {
    const occData = profileData.occasion_prefs?.[key] || {}
    return {
      likes: Array.isArray(occData.likes) ? occData.likes : [],
      allergies: Array.isArray(occData.allergies) ? occData.allergies : [],
      avoid: Array.isArray(occData.avoid) ? occData.avoid : [],
      gift_ideas: Array.isArray(occData.giftIdeas || occData.gift_ideas) ? (occData.giftIdeas || occData.gift_ideas) : []
    }
  }

  // Récupérer les médias publics
  const media = await getPublicUploads(supabase, profileData.user_id)
  
  // Récupérer les images Unsplash v2 pour les gift ideas
  const giftIdeas = Array.isArray(profileData.global_preferences?.giftIdeas) 
    ? profileData.global_preferences.giftIdeas 
    : []
  const giftIdeasImages = await getGiftIdeasImages(supabase, giftIdeas)

  // Payload v2 avec structure exhaustive incluant media et images Unsplash v2
  return {
    user_id: profileData.user_id,
    name: profileData.first_name && profileData.last_name 
      ? `${profileData.first_name} ${profileData.last_name}`.trim()
      : profileData.first_name || profileData.last_name || null,
    regift: Boolean(profileData.regift_enabled || false),
    age: profileData.birthday 
      ? new Date().getFullYear() - new Date(profileData.birthday).getFullYear()
      : null,
    city: profileData.city || null,
    likes: Array.isArray(profileData.global_preferences?.likes) ? profileData.global_preferences.likes : [],
    avoid: Array.isArray(profileData.global_preferences?.avoid) ? profileData.global_preferences.avoid : [],
    gift_ideas: giftIdeas,
    gift_ideas_images: giftIdeasImages.length > 0 ? giftIdeasImages : null, // Images Unsplash v2
    sizes: {
      top: profileData.global_preferences?.sizes?.top || null,
      bottom: profileData.global_preferences?.sizes?.bottom || null,
      shoes: profileData.global_preferences?.sizes?.shoes || null,
      ring: profileData.global_preferences?.sizes?.ring || null,
      other: profileData.global_preferences?.sizes?.other || null
    },
    occasions: {
      brunch: buildOccasion('brunch'),
      cremaillere: buildOccasion('cremaillere') || buildOccasion('crémaillère'),
      anniversaire: buildOccasion('anniversaire') || buildOccasion('anniversaires'),
      diner_amis: buildOccasion('diner_amis') || buildOccasion('diner-entre-amis')
    },
    media,
    version: 1, // Version simplifiée pour l'instant
    updated_at: profileData.updated_at || new Date().toISOString()
  }
}

function calculateChecksum(data: any): string {
  return btoa(JSON.stringify(data)).slice(0, 32) // Simple checksum
}

async function markOutboxItemProcessed(supabase: any, itemId: number) {
  const { error } = await supabase
    .from('replication_outbox')
    .update({ processed_at: new Date().toISOString() })
    .eq('id', itemId)

  if (error) {
    throw new Error(`Failed to mark item processed: ${error.message}`)
  }
}

async function runReconciliation(supabase: any): Promise<ProcessingResult> {
  console.log('Running reconciliation v2 with selective field analysis')

  // Utilise la nouvelle fonction de réconciliation v2
  const { data: inconsistentProfiles, error } = await supabase.rpc('find_inconsistent_profiles_v2')

  if (error) {
    throw new Error(`Reconciliation v2 query failed: ${error.message}`)
  }

  if (!inconsistentProfiles || inconsistentProfiles.length === 0) {
    console.log('No profiles need reconciliation')
    return { processed: 0, failed: 0, errors: [] }
  }

  console.log(`Found ${inconsistentProfiles.length} profiles needing reconciliation`)

  let processed = 0
  let failed = 0
  const errors: string[] = []

  for (const profile of inconsistentProfiles) {
    try {
      // Log des champs manquants pour debugging
      if (profile.missing_fields && profile.missing_fields.length > 0) {
        console.log(`User ${profile.user_id} missing fields:`, profile.missing_fields)
      }

      // Récupère les données source actuelles depuis la vue consolidée
      const { data: sourceData, error: sourceError } = await supabase
        .from('v_public_profile_source')
        .select('*')
        .eq('user_id', profile.user_id)
        .single()

      if (sourceError || !sourceData) {
        console.error(`Failed to get source data for user ${profile.user_id}:`, sourceError)
        failed++
        errors.push(`User ${profile.user_id}: No source data found`)
        continue
      }

      // Re-emit event to outbox pour reconciliation avec données fraîches
      const idempotencyKey = `reconcile_v2_${profile.user_id}_${Date.now()}`
      
      await supabase
        .from('replication_outbox')
        .insert({
          user_id: profile.user_id,
          event_type: 'UPSERT_PROFILE',
          source_version: sourceData.version || 1,
          payload: sourceData,
          idempotency_key: idempotencyKey
        })

      processed++
    } catch (error) {
      console.error(`Reconciliation failed for user ${profile.user_id}:`, error)
      failed++
      errors.push(`User ${profile.user_id}: ${error.message}`)
    }
  }

  // Update reconciliation metrics
  await supabase
    .from('replication_metrics')
    .update({ 
      metric_value: supabase.raw('metric_value + 1'),
      updated_at: new Date().toISOString()
    })
    .eq('metric_name', 'reconciliation_runs')

  return { processed, failed, errors }
}

async function updateMetrics(supabase: any, result: ProcessingResult) {
  if (result.processed > 0) {
    await supabase
      .from('replication_metrics')
      .update({ 
        metric_value: supabase.raw(`metric_value + ${result.processed}`),
        updated_at: new Date().toISOString()
      })
      .eq('metric_name', 'replicated_ok')
  }

  if (result.failed > 0) {
    await supabase
      .from('replication_metrics')
      .update({ 
        metric_value: supabase.raw(`metric_value + ${result.failed}`),
        updated_at: new Date().toISOString()
      })
      .eq('metric_name', 'replicated_fail')
  }

  // Update outbox size metric
  const { count } = await supabase
    .from('replication_outbox')
    .select('*', { count: 'exact', head: true })
    .is('processed_at', null)

  await supabase
    .from('replication_metrics')
    .update({ 
      metric_value: count || 0,
      updated_at: new Date().toISOString()
    })
    .eq('metric_name', 'outbox_size')
}