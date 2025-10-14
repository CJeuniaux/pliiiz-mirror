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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Récupérer l'utilisateur depuis le JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    
    // Route: POST /regift-api/gifts/:giftId/regift
    if (req.method === 'POST' && pathParts[2] === 'gifts' && pathParts[4] === 'regift') {
      const giftId = pathParts[3]
      const { toContactId, reason, visibility } = await req.json()

      // Validation
      if (!toContactId) {
        return new Response(JSON.stringify({ error: 'toContactId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Vérifier que le contact appartient à l'utilisateur
      const { data: contact, error: contactError } = await supabaseClient
        .from('contacts')
        .select('id, owner_id, contact_user_id')
        .eq('id', toContactId)
        .eq('owner_id', user.id)
        .single()

      if (contactError || !contact) {
        return new Response(JSON.stringify({ error: 'Contact not found or not accessible' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Vérifier que le cadeau existe et appartient à l'utilisateur
      const { data: gift, error: giftError } = await supabaseClient
        .from('gifts')
        .select('id, user_id, name, status')
        .eq('id', giftId)
        .eq('user_id', user.id)
        .single()

      if (giftError || !gift) {
        return new Response(JSON.stringify({ error: 'Gift not found or not accessible' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Vérifier que le cadeau peut être re-gifted
      if (gift.status !== 'available') {
        return new Response(JSON.stringify({ error: 'Gift is not available for regifting' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Créer le regift
      const { data: regift, error: regiftError } = await supabaseClient
        .from('regifts')
        .insert({
          gift_id: giftId,
          from_user_id: user.id,
          to_contact_id: toContactId,
          reason: reason || null,
          visibility: visibility || 'private',
          status: 'suggested'
        })
        .select()
        .single()

      if (regiftError) {
        console.error('Regift creation error:', regiftError)
        return new Response(JSON.stringify({ error: 'Failed to create regift suggestion' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ 
        success: true, 
        regift,
        message: 'Regift suggestion created successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: GET /regift-api/regifts - Lister les regifts de l'utilisateur
    if (req.method === 'GET' && pathParts[2] === 'regifts') {
      const { data: regifts, error: regiftsError } = await supabaseClient
        .from('regifts')
        .select(`
          id,
          gift_id,
          from_user_id,
          to_contact_id,
          status,
          reason,
          visibility,
          created_at,
          updated_at,
          gifts (
            id,
            name,
            description,
            category,
            image_url
          ),
          contacts (
            id,
            contact_user_id,
            alias
          )
        `)
        .or(`from_user_id.eq.${user.id},to_contact_id.in.(${
          // Sous-requête pour les contacts où l'utilisateur est propriétaire
          await supabaseClient
            .from('contacts')
            .select('id')
            .eq('owner_id', user.id)
            .then(({ data }) => data?.map(c => c.id).join(',') || '')
        })`)
        .order('created_at', { ascending: false })

      if (regiftsError) {
        console.error('Regifts fetch error:', regiftsError)
        return new Response(JSON.stringify({ error: 'Failed to fetch regifts' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ regifts }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route non trouvée
    return new Response(JSON.stringify({ error: 'Route not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})