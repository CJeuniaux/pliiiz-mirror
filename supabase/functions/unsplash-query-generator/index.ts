import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Dictionnaire de mapping pour enrichir les termes
const GIFT_ENRICHMENT_MAP: Record<string, string[]> = {
  // Boissons & Alimentation
  'thé': ['tea', 'cup'],
  'café': ['coffee', 'cup'],
  'chocolat': ['chocolate'],
  'vin': ['wine', 'bottle'],
  'miel': ['honey', 'jar'],
  'fromage': ['cheese'],
  
  // Objets maison
  'tasse': ['mug', 'cup'],
  'bougie': ['candle'],
  'vase': ['vase', 'flowers'],
  'plaid': ['blanket'],
  'coussin': ['pillow'],
  'lampe': ['lamp'],
  
  // Mode & Accessoires
  'écharpe': ['scarf'],
  'bijoux': ['jewelry'],
  'montre': ['watch'],
  'sac': ['bag'],
  'chapeau': ['hat'],
  
  // Bien-être & Beauté
  'savon': ['soap'],
  'parfum': ['perfume'],
  'crème': ['cream'],
  'huile': ['oil'],
  
  // Plantes & Jardinage
  'plante': ['plant'],
  'fleurs': ['flowers'],
  'succulent': ['succulent'],
  'herbes': ['herbs'],
  
  // Livres & Culture
  'livre': ['book'],
  'carnet': ['notebook'],
  'art': ['artwork'],
  
  // Sport & Loisirs
  'yoga': ['yoga mat'],
  'vélo': ['bicycle'],
  'randonnée': ['hiking gear'],
  
  // Cuisine
  'ustensile': ['kitchen utensil'],
  'épices': ['spices'],
  'tablier': ['apron'],
  
  // Technologie
  'casque': ['headphones'],
  'enceinte': ['speaker'],
  'tablette': ['tablet'],
  'chargeur': ['charger'],
  
  // Jeux et Divertissement
  'puzzle': ['puzzle'],
  'jeu': ['board game'],
  'cartes': ['playing cards'],
  
  // Décoration
  'cadre': ['picture frame'],
  'miroir': ['mirror'],
  'horloge': ['clock'],
  'statue': ['figurine'],
  
  // Textiles
  'serviette': ['towel'],
  'drap': ['bedsheet'],
  'rideau': ['curtain']
}

// Catégories pour ajouter du contexte
const CATEGORY_CONTEXTS: Record<string, string> = {
  'food': 'gourmet artisan premium',
  'home': 'lifestyle home decor modern',
  'fashion': 'style elegant fashion',
  'beauty': 'luxury wellness natural',
  'tech': 'modern sleek innovative',
  'books': 'intellectual creative artistic',
  'plants': 'natural green eco',
  'sports': 'active healthy lifestyle'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { giftIdea, language = 'fr' } = await req.json()

    if (!giftIdea || typeof giftIdea !== 'string') {
      return new Response(
        JSON.stringify({ error: 'giftIdea is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const enrichedQuery = generateUnsplashQuery(giftIdea.toLowerCase().trim())

    return new Response(
      JSON.stringify({
        original: giftIdea,
        query: enrichedQuery,
        tips: {
          keywords_count: enrichedQuery.split(' ').filter(w => !w.startsWith('-')).length,
          exclusions_count: enrichedQuery.split(' ').filter(w => w.startsWith('-')).length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in unsplash-query-generator:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateUnsplashQuery(giftIdea: string): string {
  // Nettoie l'entrée
  const cleanInput = giftIdea
    .replace(/[^\w\sàâäéèêëïîôöùûüÿç-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Mots-clés de base - priorité aux termes spécifiques
  const baseKeywords: string[] = []
  
  // Enrichissement basé sur le dictionnaire - plus précis
  for (const [frenchTerm, englishTerms] of Object.entries(GIFT_ENRICHMENT_MAP)) {
    if (cleanInput.includes(frenchTerm)) {
      baseKeywords.push(...englishTerms)
      break // Prend seulement le premier match pour éviter la dilution
    }
  }

  // Si pas de correspondance directe, utilise les mots originaux
  if (baseKeywords.length === 0) {
    const words = cleanInput.split(' ').filter(w => w.length > 2)
    baseKeywords.push(...words.slice(0, 2)) // Max 2 mots originaux
  }

  // Construction de la requête finale - plus simple et directe
  const keywords = [
    ...baseKeywords.slice(0, 3), // Max 3 mots principaux
    'product', // Contexte produit
    'isolated', // Fond neutre
    'clean' // Image claire
  ]

  // Exclusions pour éviter les rendus inadaptés
  const exclusions = [
    '-cartoon',
    '-illustration', 
    '-drawing',
    '-sketch',
    '-text',
    '-logo'
  ]

  // Dédoublonnage et construction finale
  const uniqueKeywords = [...new Set(keywords)]
    .filter(k => k.length > 1)
    .slice(0, 6) // Max 6 mots-clés

  return [...uniqueKeywords, ...exclusions].join(' ')
}