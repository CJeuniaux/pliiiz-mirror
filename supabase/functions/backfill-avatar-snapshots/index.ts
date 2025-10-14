import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[backfill-avatar-snapshots] Starting avatar snapshots backfill...')

    // 1) Backfill avatar_url in public_profiles.public_payload
    const { error: updateError, count: updateCount } = await supabase
      .from('public_profiles')
      .update({
        public_payload: supabase.raw(`
          jsonb_set(
            public_payload,
            '{avatar_url}',
            COALESCE(to_jsonb(p.avatar_url), 'null'::jsonb),
            true
          )
        `),
        updated_at: new Date().toISOString()
      })
      .from('profiles p')
      .eq('p.user_id', supabase.raw('public_profiles.user_id'))
      .is('public_profiles.public_payload->avatar_url', null)

    console.log('[backfill-avatar-snapshots] Updated public_payload for', updateCount, 'profiles')

    if (updateError) {
      console.error('[backfill-avatar-snapshots] Error updating public_payload:', updateError)
      throw updateError
    }

    // 2) Emit reconstruction events to replication_outbox
    const { data: userIds, error: usersError } = await supabase
      .from('public_profiles')
      .select('user_id')

    if (usersError) {
      console.error('[backfill-avatar-snapshots] Error fetching user IDs:', usersError)
      throw usersError
    }

    console.log('[backfill-avatar-snapshots] Found', userIds?.length, 'profiles to rebuild')

    let outboxInserted = 0
    const batchSize = 100

    for (let i = 0; i < (userIds?.length || 0); i += batchSize) {
      const batch = userIds!.slice(i, i + batchSize)
      
      const outboxEntries = batch.map(({ user_id }) => ({
        user_id,
        event_type: 'UPSERT_PROFILE',
        source_version: 1,
        payload: {},
        idempotency_key: `backfill_avatar_${user_id}_${Date.now()}`
      }))

      const { error: outboxError, count } = await supabase
        .from('replication_outbox')
        .insert(outboxEntries)

      if (outboxError) {
        console.error('[backfill-avatar-snapshots] Error inserting outbox entries:', outboxError)
      } else {
        outboxInserted += count || 0
        console.log('[backfill-avatar-snapshots] Inserted', count, 'outbox entries (batch', Math.floor(i/batchSize) + 1, ')')
      }
    }

    console.log('[backfill-avatar-snapshots] Backfill completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        profiles_updated: updateCount,
        outbox_entries_created: outboxInserted,
        message: 'Avatar snapshots backfill completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('[backfill-avatar-snapshots] Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Backfill failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})