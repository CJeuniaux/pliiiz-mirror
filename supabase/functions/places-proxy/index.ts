import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const url = new URL(req.url)
    const params = url.searchParams

    // Extraire les paramètres
    const query = params.get('q')
    const lat = params.get('lat')
    const lng = params.get('lng')
    const radius = params.get('radius') || '5000'

    if (!query || !lat || !lng) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: q, lat, lng' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Récupérer la clé Google Maps API
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!googleMapsApiKey) {
      return new Response(JSON.stringify({ error: 'Google Maps API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Construire l'URL de l'API Google Places
    const googleUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    googleUrl.searchParams.set('query', query)
    googleUrl.searchParams.set('location', `${lat},${lng}`)
    googleUrl.searchParams.set('radius', radius)
    googleUrl.searchParams.set('key', googleMapsApiKey)

    // Appeler l'API Google Places
    const response = await fetch(googleUrl.toString())
    const data = await response.json()

    if (!response.ok) {
      console.error('Google Places API error:', data)
      return new Response(JSON.stringify({ error: 'Google Places API error', details: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Filtrer et formater les résultats
    const places = (data.results || []).slice(0, 20).map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      geometry: {
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        }
      },
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      types: place.types,
      price_level: place.price_level,
      opening_hours: place.opening_hours ? {
        open_now: place.opening_hours.open_now
      } : undefined
    }))

    return new Response(JSON.stringify({ 
      results: places,
      status: data.status 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Places proxy error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})