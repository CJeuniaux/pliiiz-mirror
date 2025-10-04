import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface PlaceSearchRequest {
  query?: string;
  type?: string;
  lat: number;
  lng: number;
  radius?: number;
}

// Mapping des types de cadeaux vers les types Google Places
const getPlaceTypesFromGift = (giftItem: string): { types: string[], keywords: string[] } => {
  const gift = giftItem.toLowerCase();
  
  if (gift.includes('chocolat') || gift.includes('bonbon') || gift.includes('confiser')) {
    return { types: ['food', 'store'], keywords: ['chocolaterie', 'confiserie', 'chocolat'] };
  }
  
  if (gift.includes('thé') || gift.includes('tea')) {
    return { types: ['food', 'store'], keywords: ['thé', 'tea shop', 'salon de thé'] };
  }
  
  if (gift.includes('café') || gift.includes('coffee')) {
    return { types: ['cafe', 'food'], keywords: ['café', 'coffee shop', 'torréfacteur'] };
  }
  
  if (gift.includes('livre') || gift.includes('book')) {
    return { types: ['book_store'], keywords: ['librairie', 'bookstore'] };
  }
  
  if (gift.includes('fleur') || gift.includes('flower') || gift.includes('bouquet')) {
    return { types: ['florist'], keywords: ['fleuriste', 'flowers'] };
  }
  
  if (gift.includes('parfum') || gift.includes('perfume') || gift.includes('beauté')) {
    return { types: ['beauty_salon', 'store'], keywords: ['parfumerie', 'cosmétiques', 'beauté'] };
  }
  
  if (gift.includes('vin') || gift.includes('wine') || gift.includes('alcool')) {
    return { types: ['liquor_store'], keywords: ['cave à vin', 'wine shop', 'spiritueux'] };
  }
  
  if (gift.includes('sport') || gift.includes('fitness')) {
    return { types: ['sporting_goods_store'], keywords: ['sport', 'fitness', 'équipement sportif'] };
  }
  
  if (gift.includes('bijou') || gift.includes('jewelry')) {
    return { types: ['jewelry_store'], keywords: ['bijouterie', 'jewelry'] };
  }
  
  if (gift.includes('vêtement') || gift.includes('mode') || gift.includes('fashion')) {
    return { types: ['clothing_store'], keywords: ['boutique', 'vêtements', 'mode'] };
  }
  
  if (gift.includes('maison') || gift.includes('déco') || gift.includes('home')) {
    return { types: ['home_goods_store', 'furniture_store'], keywords: ['décoration', 'maison', 'mobilier'] };
  }
  
  if (gift.includes('tech') || gift.includes('électronique') || gift.includes('gadget')) {
    return { types: ['electronics_store'], keywords: ['électronique', 'tech', 'informatique'] };
  }
  
  // Fallback générique
  return { types: ['store'], keywords: [gift, 'magasin', 'boutique'] };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type, lat, lng, radius = 5000 }: PlaceSearchRequest = await req.json();
    
    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: 'Latitude et longitude requises' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Clé API Google Maps non configurée' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const location = `${lat},${lng}`;
    const allPlaces: any[] = [];
    
    // Déterminer les types de lieux à rechercher
    const { types, keywords } = query ? getPlaceTypesFromGift(query) : { types: [type || 'store'], keywords: [] };
    
    // Recherche par type
    for (const placeType of types) {
      try {
        const typeUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${placeType}&key=${apiKey}`;
        const typeResponse = await fetch(typeUrl);
        const typeData = await typeResponse.json();
        
        if (typeData.status === 'OK' && typeData.results) {
          allPlaces.push(...typeData.results);
        }
      } catch (error) {
        console.error(`Erreur recherche par type ${placeType}:`, error);
      }
    }
    
    // Recherche par mots-clés
    for (const keyword of keywords.slice(0, 2)) { // Limiter à 2 mots-clés pour éviter les quotas
      try {
        const keywordUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;
        const keywordResponse = await fetch(keywordUrl);
        const keywordData = await keywordResponse.json();
        
        if (keywordData.status === 'OK' && keywordData.results) {
          allPlaces.push(...keywordData.results);
        }
      } catch (error) {
        console.error(`Erreur recherche par mot-clé ${keyword}:`, error);
      }
    }
    
    // Dédupliquer par place_id
    const uniquePlaces = allPlaces.filter((place, index, self) => 
      index === self.findIndex(p => p.place_id === place.place_id)
    );
    
    // Calculer les distances et trier
    const placesWithDistance = uniquePlaces.map(place => {
      const placeLat = place.geometry.location.lat;
      const placeLng = place.geometry.location.lng;
      const distance = calculateDistance(lat, lng, placeLat, placeLng);
      
      return {
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.vicinity || place.formatted_address,
        geometry: {
          location: {
            lat: placeLat,
            lng: placeLng
          }
        },
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        price_level: place.price_level,
        types: place.types,
        opening_hours: place.opening_hours,
        distance: distance
      };
    });
    
    // Trier par distance puis par note
    placesWithDistance.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return (b.rating || 0) - (a.rating || 0);
    });
    
    return new Response(
      JSON.stringify({ 
        results: placesWithDistance.slice(0, 20), // Limiter à 20 résultats
        status: 'OK' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erreur API Google Places:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Fonction pour calculer la distance haversine
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}