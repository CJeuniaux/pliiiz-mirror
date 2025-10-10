import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Seed data
const SEED = [
  {name:"Librairie Pax", city:"Liège", category:"books_indie"},
  {name:"Point Virgule", city:"Namur", category:"books_indie"},
  {name:"Club", city:"Namur", category:"books_chain"},
  {name:"FNAC", city:"Liège", category:"books_chain"},
  {name:"Lost in Sound", city:"Liège", category:"vinyls"},
  {name:"Lido Music", city:"Namur", category:"vinyls"},
  {name:"Juke-Box", city:"Namur", category:"vinyls"},
  {name:"Ludotrotter", city:"Namur", category:"board_games"},
  {name:"Hasard Ludique", city:"Mons", category:"board_games"},
  {name:"L'Autre Monde", city:"Liège", category:"board_games"},
  {name:"La Coccinelle", city:"Namur", category:"board_games"},
  {name:"Galler", city:"Liège", category:"chocolate"},
  {name:"Neuhaus", city:"Namur", category:"chocolate"},
  {name:"Darcis", city:"Verviers", category:"chocolate"},
  {name:"Palais des Thés", city:"Namur", category:"tea"},
  {name:"Kusmi Tea", city:"Liège", category:"tea"},
  {name:"Teatower", city:"Namur", category:"tea"},
  {name:"ICI Paris XL", city:"Namur", category:"beauty"},
  {name:"Rituals", city:"Liège", category:"beauty"},
  {name:"April", city:"Namur", category:"beauty"},
  {name:"Dille & Kamille", city:"Namur", category:"home_decor"},
  {name:"Maisons du Monde", city:"Namur", category:"home_decor"},
  {name:"Oh!Green", city:"Naninne", category:"plants"},
  {name:"Aveve", city:"Namur", category:"plants"},
  {name:"MediaMarkt", city:"Liège", category:"tech"},
  {name:"Vanden Borre", city:"Namur", category:"tech"},
  {name:"Krëfel", city:"Bouge", category:"tech"},
  {name:"Thermes de Spa", city:"Spa", category:"experience_spa"},
  {name:"Château des Thermes", city:"Chaudfontaine", category:"experience_spa"},
  {name:"Karting des Fagnes", city:"Mariembourg", category:"experience_karting"},
  {name:"Karting Eupen", city:"Eupen", category:"experience_karting"},
  {name:"La Boverie", city:"Liège", category:"experience_museum"},
  {name:"Bois du Cazier", city:"Charleroi", category:"experience_museum"},
  {name:"Musée Hergé", city:"Louvain-la-Neuve", category:"experience_museum"},
];

// Category type filtering
const TYPE_FILTER: Record<string, string[]> = {
  tea: ['cafe', 'store'],
  chocolate: ['store','bakery'],
  books_indie: ['book_store'],
  books_chain: ['book_store'],
  vinyls: ['store'],
  board_games: ['store'],
  beauty: ['beauty_salon','store'],
  home_decor: ['home_goods_store','furniture_store'],
  plants: ['florist','store','home_goods_store'],
  tech: ['electronics_store'],
  experience_spa: ['spa','lodging'],
  experience_karting: ['amusement_center','tourist_attraction'],
  experience_museum: ['museum'],
};

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  types: string[];
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  website?: string;
  url?: string;
  formatted_phone_number?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    }
  };
  rating?: number;
  user_ratings_total?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY is not configured')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    async function textSearch(query: string): Promise<{ results: PlaceResult[] }> {
      const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
      url.searchParams.set('query', query);
      url.searchParams.set('region', 'be');
      url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
      
      const response = await fetch(url);
      return await response.json();
    }

    async function getPlaceDetails(place_id: string): Promise<{ result: PlaceDetails }> {
      const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
      url.searchParams.set('place_id', place_id);
      url.searchParams.set('key', GOOGLE_MAPS_API_KEY);
      url.searchParams.set('fields', 'place_id,name,formatted_address,website,url,formatted_phone_number,geometry,rating,user_ratings_total');
      
      const response = await fetch(url);
      return await response.json();
    }

    function hasAcceptableType(types: string[] | undefined, category: string): boolean {
      if (!types) return true;
      const allowedTypes = TYPE_FILTER[category] || [];
      return allowedTypes.length ? allowedTypes.some(t => types.includes(t)) : true;
    }

    console.log(`Starting enrichment of ${SEED.length} partners...`);

    for (const partner of SEED) {
      try {
        console.log(`Processing: ${partner.name} in ${partner.city}`);
        
        // Text search with Wallonia bias
        const query = `${partner.name} ${partner.city} Wallonie Belgique`;
        const searchResults = await textSearch(query);
        
        if (!searchResults.results || searchResults.results.length === 0) {
          console.warn(`No search results for: ${partner.name}`);
          continue;
        }

        // Find best candidate
        const candidate = searchResults.results.find(result => 
          result.name?.toLowerCase().includes(partner.name.toLowerCase().split(' ')[0]) &&
          (result.formatted_address || '').toLowerCase().includes(partner.city.toLowerCase()) &&
          hasAcceptableType(result.types, partner.category)
        ) || searchResults.results[0];

        if (!candidate?.place_id) {
          console.warn(`No valid candidate found for: ${partner.name}`);
          continue;
        }

        // Get detailed information
        const detailsResponse = await getPlaceDetails(candidate.place_id);
        const details = detailsResponse.result;

        if (!details) {
          console.warn(`No details found for place_id: ${candidate.place_id}`);
          continue;
        }

        // Build Google Maps URL
        const google_maps_url = details.url || 
          `https://www.google.com/maps/search/?api=1&query=place_id:${encodeURIComponent(details.place_id)}`;

        // Upsert partner data
        const partnerData = {
          name: details.name || partner.name,
          city: partner.city,
          category: partner.category,
          place_id: details.place_id,
          formatted_address: details.formatted_address,
          website: details.website || null,
          google_maps_url,
          phone: details.formatted_phone_number || null,
          lat: details.geometry?.location?.lat || null,
          lng: details.geometry?.location?.lng || null,
          rating: details.rating || null,
          user_ratings_total: details.user_ratings_total || null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabaseClient
          .from('partners')
          .upsert(partnerData, { 
            onConflict: 'place_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error(`Error upserting ${partner.name}:`, error);
        } else {
          console.log(`✅ Successfully processed: ${partner.name}`);
        }

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing ${partner.name}:`, error);
      }
    }

    // Get final count
    const { count } = await supabaseClient
      .from('partners')
      .select('*', { count: 'exact', head: true });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Enrichment completed. Total partners in database: ${count}`,
        processed: SEED.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enrich-partners function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
})