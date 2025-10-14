import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Banlist globale pour exclure les magasins génériques
const GLOBAL_BANLIST = [
  'Action', 'Namur Bazar', 'Bazar', 'Bazaar', 'Hema', 'Zeeman', 'Flying Tiger', 
  'Stokomani', 'Gifi', 'Carrefour', 'Aldi', 'Lidl', 'Colruyt', 'Intermarché', 
  'Spar', 'Proxy', 'Leclerc', 'Cora', 'Match', 'Casino'
].map(name => name.toLowerCase());

// Profils de recherche par type
const SEARCH_PROFILES = {
  'restaurant-japonais': {
    overpassQuery: 'amenity=restaurant and cuisine~"japanese|sushi|ramen|izakaya"',
    tokens: ['japonais', 'sushi', 'ramen', 'izakaya', 'teppanyaki', 'yakitori'],
    radius: 1500,
    maxRadius: 3000,
    strictness: 'fort'
  },
  'caviste-spiritueux': {
    overpassQuery: '(shop=alcohol or shop=wine or shop=beverage)',
    nameFilter: 'rhum|rum|cave|whisky|spirits|spiritueux|cognac|armagnac',
    tokens: ['rhum', 'rum', 'cave', 'whisky', 'spiritueux', 'cognac', 'armagnac'],
    radius: 3000,
    maxRadius: 5000,
    strictness: 'fort'
  },
  'chaussures': {
    overpassQuery: 'shop=shoes',
    nameFilter: 'bott(e|es)|chaussure|boots|sneakers',
    tokens: ['bottes', 'chaussures', 'boots', 'sneakers', 'bottines'],
    radius: 2500,
    maxRadius: 4000,
    strictness: 'moyen'
  },
  'librairie': {
    overpassQuery: 'shop=books',
    nameFilter: 'beaux-arts|BD|manga|dessin|art|livre',
    tokens: ['livre', 'beaux-arts', 'bd', 'manga', 'dessin', 'art'],
    radius: 2500,
    maxRadius: 4000,
    strictness: 'moyen'
  },
  'parfumerie': {
    overpassQuery: 'shop=perfumery or shop=cosmetics',
    nameFilter: 'parfum|cosmétique|beauté',
    tokens: ['parfum', 'cosmétique', 'beauté', 'fragrance'],
    radius: 2000,
    maxRadius: 3500,
    strictness: 'fort'
  },
  'bougies-deco': {
    overpassQuery: 'shop=candles or shop=interior_decoration or shop=gift',
    nameFilter: 'bougie|décoration|déco|gift|cadeau',
    tokens: ['bougie', 'décoration', 'déco', 'gift', 'cadeau'],
    radius: 2000,
    maxRadius: 3500,
    strictness: 'moyen'
  },
  'restaurant': {
    overpassQuery: 'amenity=restaurant',
    radius: 1500,
    maxRadius: 2500,
    strictness: 'souple'
  },
  'default': {
    overpassQuery: 'shop',
    radius: 1000,
    maxRadius: 2000,
    strictness: 'souple'
  }
};

// Fonction d'interprétation NLP légère
function interpretQuery(query: string): { typeKey: string; tokens: string[]; strictness: string } {
  const lowerQuery = query.toLowerCase();
  
  // Restaurant japonais
  if (lowerQuery.includes('resto') && lowerQuery.includes('japonais') || 
      lowerQuery.includes('sushi') || lowerQuery.includes('ramen')) {
    return {
      typeKey: 'restaurant-japonais',
      tokens: ['japonais', 'sushi', 'ramen'],
      strictness: 'fort'
    };
  }
  
  // Spiritueux/Rhum
  if (lowerQuery.includes('rhum') || lowerQuery.includes('whisky') || 
      lowerQuery.includes('spiritueux') || lowerQuery.includes('cave')) {
    return {
      typeKey: 'caviste-spiritueux',
      tokens: ['rhum', 'whisky', 'spiritueux', 'cave'],
      strictness: 'fort'
    };
  }
  
  // Chaussures/Bottes
  if (lowerQuery.includes('botte') || lowerQuery.includes('chaussure') || 
      lowerQuery.includes('boot') || lowerQuery.includes('sneaker')) {
    return {
      typeKey: 'chaussures',
      tokens: ['bottes', 'chaussures', 'boots'],
      strictness: 'moyen'
    };
  }
  
  // Parfum
  if (lowerQuery.includes('parfum') || lowerQuery.includes('cosmétique')) {
    return {
      typeKey: 'parfumerie',
      tokens: ['parfum', 'cosmétique'],
      strictness: 'fort'
    };
  }
  
  // Bougies
  if (lowerQuery.includes('bougie') || lowerQuery.includes('décoration')) {
    return {
      typeKey: 'bougies-deco',
      tokens: ['bougie', 'décoration'],
      strictness: 'moyen'
    };
  }
  
  // Livres
  if (lowerQuery.includes('livre') || lowerQuery.includes('manga') || 
      lowerQuery.includes('bd') || lowerQuery.includes('dessin')) {
    return {
      typeKey: 'librairie',
      tokens: ['livre', 'manga', 'bd'],
      strictness: 'moyen'
    };
  }
  
  // Restaurant générique
  if (lowerQuery.includes('restaurant') || lowerQuery.includes('resto')) {
    return {
      typeKey: 'restaurant',
      tokens: ['restaurant'],
      strictness: 'souple'
    };
  }
  
  // Défaut
  return {
    typeKey: 'default',
    tokens: query.split(' ').filter(word => word.length > 2),
    strictness: 'souple'
  };
}

// Fonction de scoring
function scoreResult(poi: any, tokens: string[], distance: number): number {
  let score = 0;
  const name = (poi.tags?.name || '').toLowerCase();
  const brand = (poi.tags?.brand || '').toLowerCase();
  const cuisine = (poi.tags?.cuisine || '').toLowerCase();
  const shop = (poi.tags?.shop || '').toLowerCase();
  
  // +3 si tag spécialisé correspond
  if (poi.tags?.cuisine) {
    for (const token of tokens) {
      if (cuisine.includes(token)) {
        score += 3;
        break;
      }
    }
  }
  
  // +2 par token trouvé dans name/brand
  for (const token of tokens) {
    if (name.includes(token) || brand.includes(token)) {
      score += 2;
    }
  }
  
  // -3 si nom dans la banlist
  for (const banned of GLOBAL_BANLIST) {
    if (name.includes(banned)) {
      score -= 3;
      break;
    }
  }
  
  // -2 si shop générique pour requête spécifique
  const genericShops = ['variety_store', 'department_store', 'supermarket', 'convenience'];
  if (genericShops.includes(shop)) {
    score -= 2;
  }
  
  // Pénalisation distance (douce)
  score -= distance / 500;
  
  return score;
}

// Construction de la requête Overpass
function buildOverpassQuery(lat: number, lon: number, profile: any, radius: number, relaxed = false): string {
  let query = profile.overpassQuery;
  
  if (!relaxed && profile.nameFilter) {
    query += ` and name~"${profile.nameFilter}"`;
  }
  
  return `
    [out:json][timeout:25];
    (
      node[${query}](around:${radius},${lat},${lon});
      way[${query}](around:${radius},${lat},${lon});
      relation[${query}](around:${radius},${lat},${lon});
    );
    out center meta;
  `;
}

// Fonction principale de recherche
async function searchNearbyStores(lat: number, lon: number, query: string) {
  console.log(`🔍 Recherche pour: "${query}" à (${lat}, ${lon})`);
  
  const interpretation = interpretQuery(query);
  console.log(`📊 Interprétation:`, interpretation);
  
  const profile = SEARCH_PROFILES[interpretation.typeKey] || SEARCH_PROFILES.default;
  let radius = profile.radius;
  let results: any[] = [];
  let relaxedFiltersUsed = false;
  
  // Tentative avec rayon initial
  while (results.length < 3 && radius <= profile.maxRadius) {
    console.log(`🔍 Recherche avec rayon ${radius}m`);
    
    const overpassQuery = buildOverpassQuery(lat, lon, profile, radius, relaxedFiltersUsed);
    
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: overpassQuery
      });
      
      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📍 Trouvé ${data.elements?.length || 0} éléments bruts`);
      
      if (data.elements && data.elements.length > 0) {
        // Calcul du score pour chaque résultat
        const scored = data.elements.map((element: any) => {
          const elementLat = element.lat || element.center?.lat;
          const elementLon = element.lon || element.center?.lon;
          
          if (!elementLat || !elementLon) return null;
          
          const distance = Math.sqrt(
            Math.pow((elementLat - lat) * 111000, 2) + 
            Math.pow((elementLon - lon) * 111000 * Math.cos(lat * Math.PI / 180), 2)
          );
          
          const score = scoreResult(element, interpretation.tokens, distance);
          
          return {
            ...element,
            distance,
            score,
            lat: elementLat,
            lon: elementLon
          };
        }).filter(Boolean);
        
        // Tri par score décroissant
        results = scored.sort((a, b) => b.score - a.score);
        console.log(`📊 Après scoring: ${results.length} résultats`);
        
        if (results.length >= 3) break;
      }
      
      // Si pas assez de résultats, élargir le rayon
      if (results.length < 3) {
        if (radius < profile.maxRadius) {
          radius = Math.min(radius * 1.5, profile.maxRadius);
        } else if (!relaxedFiltersUsed && profile.nameFilter) {
          // Relâcher les contraintes name
          relaxedFiltersUsed = true;
          radius = profile.radius;
          console.log(`🔓 Relâchement des filtres de nom`);
        } else {
          break;
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur Overpass:', error);
      break;
    }
  }
  
  // Dédoublonnage par nom et position approximative
  const deduplicated = results.filter((result, index, arr) => {
    const name = result.tags?.name || '';
    const key = `${name}@${Math.round(result.lat * 1000)},${Math.round(result.lon * 1000)}`;
    return arr.findIndex(r => {
      const rName = r.tags?.name || '';
      const rKey = `${rName}@${Math.round(r.lat * 1000)},${Math.round(r.lon * 1000)}`;
      return rKey === key;
    }) === index;
  });
  
  // Limiter à 20 résultats max
  const finalResults = deduplicated.slice(0, 20).map(result => ({
    id: `osm_${result.type}_${result.id}`,
    name: result.tags?.name || 'Commerce sans nom',
    address: result.tags?.addr?.full || 
             `${result.tags?.['addr:street'] || ''} ${result.tags?.['addr:housenumber'] || ''}`.trim() ||
             result.tags?.vicinity || 
             'Adresse non disponible',
    lat: result.lat,
    lng: result.lon,
    rating: 4.0, // Valeur par défaut OSM
    regift_compatible: false,
    osm_id: result.id,
    osm_type: result.type,
    categories: [result.tags?.shop || result.tags?.amenity || 'commerce'],
    url: null,
    score: result.score,
    distance: Math.round(result.distance),
    tags: result.tags,
    // Badge de précision si tokens trouvés
    precision_match: result.score > 1
  }));
  
  console.log(`✅ Résultats finaux: ${finalResults.length}`);
  
  return {
    partners: finalResults, // Pour compatibilité avec l'interface existante
    query: interpretation,
    debug: {
      typeKey: interpretation.typeKey,
      tokens: interpretation.tokens,
      radius: radius,
      resultsCount: finalResults.length,
      relaxedFiltersUsed
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Support ancien format (lat, lng, giftType) et nouveau (lat, lon, query)
    const body = await req.json();
    const lat = body.lat || body.latitude;
    const lon = body.lng || body.lon || body.longitude;
    const query = body.query || body.giftType || body.q;
    
    if (!lat || !lon || !query) {
      return new Response(
        JSON.stringify({ error: 'Paramètres lat, lon et query requis' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const result = await searchNearbyStores(lat, lon, query);
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('❌ Erreur dans search-nearby-stores:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de la recherche',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});