import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const method = req.method

    if (method === 'GET') {
      // GET /api/image-library?label=...
      const label = url.searchParams.get('label')
      
      if (!label) {
        return new Response(
          JSON.stringify({ error: 'Label parameter required' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      console.log('[image-library] Searching for label:', label)

      // Search for exact or close match using ilike for case-insensitive search
      const { data, error } = await supabase
        .from('image_library')
        .select('*')
        .or(`label.ilike.${label},label.ilike.%${label}%`)
        .order('label', { ascending: true })
        .limit(1)

      if (error) {
        console.error('[image-library] Database error:', error)
        return new Response(
          JSON.stringify({ error: 'Database error' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }

      const result = data && data.length > 0 ? data[0] : null
      console.log('[image-library] Found result:', result)

      return new Response(
        JSON.stringify(result ? { image_url: result.image_url, id: result.id } : null),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'POST') {
      // POST /api/image-library/lookup - match by category + attrs
      const { categoryId, attrs } = await req.json()
      
      console.log('[image-library] Lookup request:', { categoryId, attrs })

      let query = supabase.from('image_library').select('*')

      // Filter by category if provided
      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      // If attrs provided, try to match some attributes using JSON operations
      if (attrs && typeof attrs === 'object') {
        const attrKeys = Object.keys(attrs)
        if (attrKeys.length > 0) {
          // Try to find items that have at least one matching attribute
          for (const key of attrKeys.slice(0, 3)) { // Limit to first 3 keys for performance
            const value = attrs[key]
            if (value !== undefined && value !== null) {
              query = query.or(`attrs->>${key}.eq.${value}`)
            }
          }
        }
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('[image-library] Lookup error:', error)
        return new Response(
          JSON.stringify({ error: 'Database error' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }

      // Simple scoring: prefer exact category match, then by recency
      const result = data && data.length > 0 ? data[0] : null
      console.log('[image-library] Lookup result:', result)

      return new Response(
        JSON.stringify(result ? { image_url: result.image_url, id: result.id } : null),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    )

  } catch (error) {
    console.error('[image-library] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})