import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Import taxonomy data inline (comprehensive mapping)
interface GiftTag {
  name: string;
  slug: string;
  keywords: string[];
  entities?: string[];
  styles?: string[];
  negatives?: string[];
  occasions?: string[];
}

interface GiftCategory {
  category: string;
  slug?: string;
  tags: GiftTag[];
}

// Taxonomie complète importée depuis gift-categories.ts
const GIFT_TAXONOMY: GiftCategory[] = [
  {
    category: "Mode & Accessoires",
    tags: [
      { 
        name: "Prêt-à-porter", 
        slug: "pret-a-porter", 
        keywords: ["clothes", "shirt", "pants", "dress", "sweater", "coat"],
        entities: ["cotton", "linen", "wool", "cashmere", "silk"],
        styles: ["casual", "chic", "minimal", "business"],
        negatives: ["costume", "uniform"]
      },
      {
        name: "Streetwear",
        slug: "streetwear",
        keywords: ["hoodie", "sweat", "jogger", "sneakers", "cap"],
        entities: ["cotton", "fleece"],
        styles: ["oversize", "loose", "vintage", "graphic"],
        negatives: ["formal", "business"]
      },
      { 
        name: "Chaussures & Sneakers", 
        slug: "chaussures-sneakers", 
        keywords: ["sneakers", "shoes", "boots", "sandals"],
        entities: ["leather", "nubuck", "mesh", "sole"],
        styles: ["sport", "urban", "retro"],
        negatives: ["ice skates", "professional cleats"]
      },
      { 
        name: "Bijoux & Montres", 
        slug: "bijoux-montres", 
        keywords: ["necklace", "bracelet", "ring", "earrings", "watch", "jewelry"],
        entities: ["gold", "silver", "steel", "leather", "diamond", "quartz"],
        styles: ["delicate", "statement", "minimal", "vintage"],
        negatives: ["medical piercing", "cheap costume jewelry"]
      },
      { 
        name: "Maroquinerie", 
        slug: "maroquinerie", 
        keywords: ["bag", "wallet", "belt", "leather goods"],
        entities: ["full grain leather", "vegetable tanned", "suede"],
        styles: ["classic", "premium", "minimal", "artisan"],
        negatives: ["laptop case", "hard luggage"]
      }
    ]
  },
  {
    category: "Beauté & Bien-être",
    tags: [
      { 
        name: "Skincare", 
        slug: "skincare", 
        keywords: ["serum", "cream", "moisturizer", "cleanser", "toner", "mask", "SPF"],
        entities: ["hyaluronic acid", "niacinamide", "retinol", "ceramides"],
        styles: ["clean", "natural", "vegan"],
        negatives: ["medication", "prescription"]
      },
      { 
        name: "Maquillage", 
        slug: "maquillage", 
        keywords: ["foundation", "mascara", "lipstick", "palette", "eyeliner", "blush"],
        entities: ["shade", "coverage", "matte", "glow"],
        styles: ["nude", "glam", "professional"],
        negatives: ["theatrical makeup", "SFX"]
      },
      { 
        name: "Parfums", 
        slug: "parfums", 
        keywords: ["perfume", "eau de toilette", "fragrance"],
        entities: ["floral", "woody", "amber", "citrus", "musk", "vanilla"],
        styles: ["signature", "niche", "classic"],
        negatives: ["air freshener"]
      }
    ]
  },
  {
    category: "Maison & Déco",
    tags: [
      { 
        name: "Décoration intérieure", 
        slug: "decoration-interieure", 
        keywords: ["vase", "candle", "frame", "poster", "mirror", "cushion", "blanket"],
        entities: ["ceramic", "glass", "wood", "brass"],
        styles: ["scandinavian", "minimal", "bohemian", "industrial"],
        negatives: ["construction materials"]
      },
      { 
        name: "Art de la table", 
        slug: "art-de-la-table", 
        keywords: ["plates", "glasses", "cutlery", "carafe", "napkins"],
        entities: ["porcelain", "stoneware", "crystal", "stainless steel"],
        styles: ["casual", "gastronomic", "artisan"],
        negatives: ["professional catering equipment"]
      }
    ]
  },
  {
    category: "Gastronomie",
    tags: [
      { 
        name: "Épicerie fine", 
        slug: "epicerie-fine", 
        keywords: ["truffle", "olive oil", "vinegar", "condiments", "terrine"],
        entities: ["organic", "PDO", "IGP"],
        styles: ["gourmet", "terroir", "mediterranean"],
        negatives: ["bulk wholesale", "raw ingredients"]
      },
      { 
        name: "Chocolats & Confiseries", 
        slug: "chocolats-confiseries", 
        keywords: ["praline", "ganache", "chocolate bar", "candy", "nougat"],
        entities: ["cacao percentage", "bean-to-bar"],
        styles: ["artisan", "luxury", "discovery"],
        negatives: ["fairground candy"]
      },
      { 
        name: "Vins & Spiritueux", 
        slug: "vins-spiritueux", 
        keywords: ["wine", "champagne", "whisky", "gin", "rum"],
        entities: ["vintage", "grape variety", "oak barrel"],
        styles: ["natural", "biodynamic", "single malt"],
        negatives: ["pharmaceutical alcohol"]
      },
      { 
        name: "Café & Thé", 
        slug: "cafe-the", 
        keywords: ["espresso", "coffee beans", "filter", "tea", "matcha"],
        entities: ["arabica", "robusta", "single origin"],
        styles: ["specialty", "slow coffee", "ceremony"],
        negatives: ["generic capsules"]
      }
    ]
  }
];

function findBestTagMatch(giftIdea: string): { tag: GiftTag; category: string; score: number } | null {
  const normalized = giftIdea.toLowerCase().trim();
  let bestMatch: { tag: GiftTag; category: string; score: number } | null = null;

  for (const cat of GIFT_TAXONOMY) {
    for (const tag of cat.tags) {
      let score = 0;

      // Check name match
      if (normalized.includes(tag.name.toLowerCase())) score += 100;
      if (normalized.includes(tag.slug)) score += 80;

      // Check keywords
      for (const keyword of tag.keywords) {
        if (normalized.includes(keyword.toLowerCase())) score += 10;
      }

      // Check entities
      if (tag.entities) {
        for (const entity of tag.entities) {
          if (normalized.includes(entity.toLowerCase())) score += 8;
        }
      }

      // Check styles
      if (tag.styles) {
        for (const style of tag.styles) {
          if (normalized.includes(style.toLowerCase())) score += 5;
        }
      }

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { tag, category: cat.category, score };
      }
    }
  }

  return bestMatch;
}

function buildUnsplashQueryFromTaxonomy(giftIdea: string, tag: GiftTag): string {
  const queryParts: string[] = [];

  // Use top keywords
  queryParts.push(...tag.keywords.slice(0, 2));
  queryParts.push('product', 'isolated');

  // Add material/entity if relevant
  if (tag.entities && tag.entities.length > 0) {
    queryParts.push(tag.entities[0]);
  }

  // Exclusions
  const exclusions = ['-cartoon', '-illustration', '-drawing', '-text', '-logo'];

  // Add tag-specific exclusions
  if (tag.negatives && tag.negatives.length > 0) {
    exclusions.push(...tag.negatives.slice(0, 2).map(n => `-${n}`));
  }

  const uniqueParts = [...new Set(queryParts)].slice(0, 5);
  return [...uniqueParts, ...exclusions].join(' ');
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

    // Try to find matching tag
    const match = findBestTagMatch(giftIdea);

    let enrichedQuery: string;
    let confidence: number;
    let matchedCategory: string | undefined;

    if (match && match.score >= 10) {
      // Use taxonomy-based query
      enrichedQuery = buildUnsplashQueryFromTaxonomy(giftIdea, match.tag);
      confidence = Math.min(match.score / 100, 1.0);
      matchedCategory = match.category;
    } else {
      // Fallback to basic query
      enrichedQuery = `${giftIdea} product isolated -cartoon -illustration -drawing -text -logo`;
      confidence = 0.3;
    }

    return new Response(
      JSON.stringify({
        original: giftIdea,
        query: enrichedQuery,
        confidence,
        matchedCategory,
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