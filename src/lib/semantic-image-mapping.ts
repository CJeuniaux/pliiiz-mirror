/**
 * Enhanced semantic mapping for gift ideas using comprehensive French lexicon
 * Maps user intent to structured search terms, categories, and visual anchors
 */

export interface SemanticMapping {
  category: string;
  subcategory?: string;
  brand?: string;
  productType: string;
  colors?: string[];
  context: string[];
  keywords: string[];
  excludeKeywords: string[];
  anchors: string[];
  unsplashQueries: string[];
  confidence: number; // 0-1 confidence in mapping
}

export interface SemanticEntry {
  category: string;
  synonyms: string[];
  positive: string[];
  negative: string[];
  anchors: string[];
  unsplash: string[];
}

// Comprehensive semantic database from French gift lexicon
const SEMANTIC_DATABASE: Record<string, SemanticEntry> = {
  "œnologie": {
    "category": "vin",
    "synonyms": ["atelier œnologie","dégustation de vin","initiation vin","oenology","cours de vin"],
    "positive": ["wine tasting","sommelier","verres à vin","bouteilles","carafe","barrique","vignoble","rouge/blanc/rosé"],
    "negative": ["bureau","open space","fleur rose","flower","beer","cocktail bar"],
    "anchors": ["table de dégustation","carafe à décanter","notes d'arômes","grappes de raisin"],
    "unsplash": ["wine tasting sommelier", "wine glasses decanter vineyard"]
  },
  "vin": {
    "category": "vin",
    "synonyms": ["bouteille de vin","cave à vin","vignoble","oenologie"],
    "positive": ["bottle of wine","vineyard","sommelier","decanter","wine cellar"],
    "negative": ["beer","whisky","flower"],
    "anchors": ["bouteille étiquetée","verre ballon","carafe"],
    "unsplash": ["red wine bottle studio", "vineyard sunset"]
  },
  "atelier œnologie": {
    "category": "vin",
    "synonyms": ["workshop vin","cours d'œnologie","dégustation guidée"],
    "positive": ["group wine tasting","sommelier teaching","flight of wines"],
    "negative": ["office","desk","seminar corporate"],
    "anchors": ["plateau de verres numérotés","animateur sommelier"],
    "unsplash": ["wine tasting workshop group"]
  },
  "bière artisanale": {
    "category": "bière",
    "synonyms": ["craft beer","brasserie artisanale","kit brassage"],
    "positive": ["pint glass","brewery copper tanks","hops","barrel"],
    "negative": ["wine","cocktail umbrella"],
    "anchors": ["verre de bière mousse","fût","houblon"],
    "unsplash": ["craft beer brewery bar"]
  },
  "café de spécialité": {
    "category": "café",
    "synonyms": ["espresso","barista","cafetière","grains de café"],
    "positive": ["espresso machine","latte art","coffee beans","pour-over","aeropress"],
    "negative": ["tea ceremony","energy drink"],
    "anchors": ["machine expresso","moulin","tasse en céramique"],
    "unsplash": ["barista espresso machine", "coffee pour over"]
  },
  "thé": {
    "category": "thé",
    "synonyms": ["thé vert","thé noir","matcha","infusions"],
    "positive": ["teapot","tea leaves","matcha whisk","ceramic cup"],
    "negative": ["coffee beans","soda"],
    "anchors": ["théière","boîte à thé","fouet chasen"],
    "unsplash": ["tea ceremony teapot", "matcha preparation"]
  },
  "chocolat": {
    "category": "gourmandise",
    "synonyms": ["chocolats fins","tablette cacao","ganaches"],
    "positive": ["artisan chocolate","truffles","cocoa beans"],
    "negative": ["candy bright colors"],
    "anchors": ["boîte cadeau chocolat","tablettes empilées"],
    "unsplash": ["artisan chocolate box dark"]
  },
  "pâtisserie": {
    "category": "gourmandise",
    "synonyms": ["gâteaux","macarons","boulangerie"],
    "positive": ["pastry display","macarons","cake stand"],
    "negative": ["fast food","savory dish"],
    "anchors": ["vitrine pâtisserie","boîte à macarons"],
    "unsplash": ["macarons pastry shop pastel"]
  },
  "fromage": {
    "category": "épicerie fine",
    "synonyms": ["plateau de fromages","fromagerie","cheese board"],
    "positive": ["cheeseboard","wood board","grapes","knife"],
    "negative": ["sweet pastry","wine only"],
    "anchors": ["plateau bois","meule","couteau à fromage"],
    "unsplash": ["cheeseboard artisanal"]
  },
  "cours de cuisine": {
    "category": "expérience culinaire",
    "synonyms": ["atelier cuisine","chef workshop","cours pâtisserie"],
    "positive": ["cooking class","kitchen studio","aprons","ingredients"],
    "negative": ["restaurant full service","office"],
    "anchors": ["plan de travail","chef qui explique"],
    "unsplash": ["cooking class group kitchen"]
  },
  "spa": {
    "category": "bien-être",
    "synonyms": ["massage","détente","hammam","soins"],
    "positive": ["massage stones","towels","candle light","spa treatment"],
    "negative": ["gym hardcore","medical clinic"],
    "anchors": ["serviettes roulées","bougies"],
    "unsplash": ["spa massage therapy"]
  },
  "massage": {
    "category": "bien-être",
    "synonyms": ["soin massage","massage relaxant","massage duo"],
    "positive": ["massage therapist","massage table","calm light"],
    "negative": ["physiotherapy equipment"],
    "anchors": ["table de massage","huiles"],
    "unsplash": ["relaxing massage"]
  },
  "yoga": {
    "category": "fitness",
    "synonyms": ["cours yoga","tapis yoga","méditation"],
    "positive": ["yoga mat","studio","pose","calm light"],
    "negative": ["weightlifting"],
    "anchors": ["tapis posé","posture arbre"],
    "unsplash": ["yoga studio minimal"]
  },
  "vinyles": {
    "category": "musique",
    "synonyms": ["disques vinyle","LP","collection vinyles"],
    "positive": ["vinyl record","turntable","record sleeve"],
    "negative": ["cd jewel case","mp3 icon"],
    "anchors": ["platine","pochette carrée"],
    "unsplash": ["vinyl record turntable"]
  },
  "enceinte bluetooth": {
    "category": "audio",
    "synonyms": ["haut-parleur bluetooth","enceinte portable","speaker"],
    "positive": ["portable bluetooth speaker","outdoor","waterproof","controls"],
    "negative": ["flower rose","bouquet","headphones"],
    "anchors": ["grille textile","boutons lecture","USB-C"],
    "unsplash": ["portable bluetooth speaker outdoor"]
  },
  "enceinte jbl rose": {
    "category": "audio",
    "synonyms": ["JBL Go rose","JBL Flip pink","haut-parleur JBL rose"],
    "positive": ["JBL portable speaker pink color","bluetooth","compact","waterproof"],
    "negative": ["flower","rose flower","bouquet","headset"],
    "anchors": ["logo JBL","couleur rose","dragonne"],
    "unsplash": ["JBL portable speaker pink"]
  },
  "casque audio": {
    "category": "audio",
    "synonyms": ["casque bluetooth","over-ear","headphones"],
    "positive": ["over-ear headphones","studio","wireless"],
    "negative": ["speaker","earbuds only"],
    "anchors": ["arceau","coussinets"],
    "unsplash": ["over ear headphones black"]
  },
  "smartphone": {
    "category": "électronique",
    "synonyms": ["téléphone","iphone","android"],
    "positive": ["modern smartphone","bezel thin","OLED"],
    "negative": ["feature phone old","keyboard phone"],
    "anchors": ["écran edge-to-edge","caméra triple"],
    "unsplash": ["modern smartphone mockup"]
  },
  "appareil photo": {
    "category": "photo",
    "synonyms": ["camera","hybride","reflex"],
    "positive": ["mirrorless camera","lens","strap"],
    "negative": ["webcam"],
    "anchors": ["boîtier","objectif"],
    "unsplash": ["mirrorless camera closeup"]
  },
  "polaroid": {
    "category": "photo",
    "synonyms": ["instax","appareil instantané"],
    "positive": ["instant camera","printed photo","pastel"],
    "negative": ["dslr"],
    "anchors": ["sortie photo instantanée"],
    "unsplash": ["instant camera print"]
  },
  "carnet midori": {
    "category": "papeterie",
    "synonyms": ["Midori MD","Traveler's Notebook","carnet A5"],
    "positive": ["notebook minimal","cream paper","fountain pen"],
    "negative": ["school notebook spiral"],
    "anchors": ["couverture kraft","papier crème"],
    "unsplash": ["minimal notebook desk"]
  },
  "stylo plume": {
    "category": "papeterie",
    "synonyms": ["fountain pen","encre"],
    "positive": ["fountain pen nib","bottle ink","writing"],
    "negative": ["ballpoint"],
    "anchors": ["plume métallique","bouteille d'encre"],
    "unsplash": ["fountain pen ink bottle"]
  },
  "jeu de société": {
    "category": "loisirs",
    "synonyms": ["board game","jeux de plateau","party game"],
    "positive": ["board game pieces","table friends","dice","cards"],
    "negative": ["video game controller"],
    "anchors": ["pions","plateau","dés"],
    "unsplash": ["board game friends table"]
  },
  "lego": {
    "category": "loisirs",
    "synonyms": ["construction","set lego"],
    "positive": ["lego bricks closeup","build set"],
    "negative": ["wood blocks generic"],
    "anchors": ["briques colorées","minifigs"],
    "unsplash": ["lego bricks macro"]
  },
  "plante verte": {
    "category": "maison",
    "synonyms": ["monstera","pilea","plante d'intérieur"],
    "positive": ["houseplant","ceramic pot","bright interior"],
    "negative": ["garden outdoor only"],
    "anchors": ["pot en céramique","feuilles larges"],
    "unsplash": ["houseplant monstera pot"]
  },
  "bougie parfumée": {
    "category": "maison",
    "synonyms": ["candle","bougie naturelle","soja"],
    "positive": ["scented candle jar","soft light","label minimal"],
    "negative": ["birthday cake candles"],
    "anchors": ["bocal ambré","flamme douce"],
    "unsplash": ["scented candle jar"]
  },
  "diffuseur d'huiles essentielles": {
    "category": "maison",
    "synonyms": ["diffuseur arômes","aromathérapie"],
    "positive": ["essential oil diffuser","mist steam","wood base"],
    "negative": ["humidifier industrial"],
    "anchors": ["base bois","vapeur fine"],
    "unsplash": ["essential oil diffuser minimal"]
  },
  "bijoux": {
    "category": "mode",
    "synonyms": ["collier","bracelet","boucles d'oreilles","bague"],
    "positive": ["jewelry gold","studio","closeup"],
    "negative": ["costume crown"],
    "anchors": ["présentoire velours","écrin"],
    "unsplash": ["minimal jewelry gold studio"]
  },
  "écharpe": {
    "category": "mode",
    "synonyms": ["scarf","cache-nez","châle"],
    "positive": ["wool scarf","knit","texture"],
    "negative": ["blanket"],
    "anchors": ["plié sur table","porté cou"],
    "unsplash": ["wool scarf winter"]
  },
  "sac à dos": {
    "category": "mode",
    "synonyms": ["backpack","sac de ville"],
    "positive": ["leather or canvas backpack","zipper","straps"],
    "negative": ["suitcase trolley"],
    "anchors": ["sangles","poche frontale"],
    "unsplash": ["minimal backpack lifestyle"]
  },
  "randonnée": {
    "category": "outdoor",
    "synonyms": ["trekking","sac de rando","bâtons"],
    "positive": ["hiking trail","backpack","mountain","boots"],
    "negative": ["city street fashion only"],
    "anchors": ["sentier","sommets"],
    "unsplash": ["hiking trail mountain backpack"]
  },
  "camping": {
    "category": "outdoor",
    "synonyms": ["tente","lanterne","sac de couchage"],
    "positive": ["camp tent","campfire","lantern","stars"],
    "negative": ["rv motorhome luxury"],
    "anchors": ["tente igloo","feu de camp"],
    "unsplash": ["camping tent night"]
  },
  "vélo": {
    "category": "sport",
    "synonyms": ["cyclisme","bike","vtt","urbain"],
    "positive": ["bicycle","helmet","road or city"],
    "negative": ["motorbike"],
    "anchors": ["guidon","roues"],
    "unsplash": ["city bicycle minimal"]
  },
  "running": {
    "category": "sport",
    "synonyms": ["course à pied","jogging","chaussures running"],
    "positive": ["running shoes","track","runner"],
    "negative": ["soccer match"],
    "anchors": ["chaussures","piste"],
    "unsplash": ["running shoes track"]
  },
  "livre": {
    "category": "lecture",
    "synonyms": ["roman","essai","beau livre"],
    "positive": ["hardcover book","reading","bookshelf"],
    "negative": ["ebook icon only"],
    "anchors": ["pile de livres","marque-page"],
    "unsplash": ["hardcover book reading"]
  },
  "carte cadeau": {
    "category": "bon cadeau",
    "synonyms": ["gift card","e-carte","bon d'achat"],
    "positive": ["gift card mockup","ribbon","code"],
    "negative": ["bank card visa"],
    "anchors": ["enveloppe","ruban"],
    "unsplash": ["gift card voucher mockup"]
  },
  "montre connectée": {
    "category": "électronique",
    "synonyms": ["smartwatch","bracelet connecté"],
    "positive": ["smartwatch closeup","fitness metrics"],
    "negative": ["classic pocket watch"],
    "anchors": ["écran carré/round","bracelet silicone"],
    "unsplash": ["smartwatch wrist closeup"]
  },
  "kindle": {
    "category": "lecture",
    "synonyms": ["liseuse","ebook reader"],
    "positive": ["e-reader kindle","e-ink screen","reading"],
    "negative": ["tablet glossy"],
    "anchors": ["écran e-ink","coque"],
    "unsplash": ["kindle e-reader cozy"]
  },
  "mixologie": {
    "category": "cocktails",
    "synonyms": ["atelier cocktail","bar tools","shaker"],
    "positive": ["cocktail making","shaker","jigger","citrus peel"],
    "negative": ["beer pint"],
    "anchors": ["plan de bar","verres coupe"],
    "unsplash": ["cocktail making bartender"]
  },
  "whisky": {
    "category": "spiritueux",
    "synonyms": ["whiskey","bourbon","single malt"],
    "positive": ["whisky glass","bottle amber","ice sphere"],
    "negative": ["wine glass balloon"],
    "anchors": ["verre tumbler","bouteille ambrée"],
    "unsplash": ["whisky glass bottle dark"]
  },
  "gin": {
    "category": "spiritueux",
    "synonyms": ["gin tonic","distillerie"],
    "positive": ["gin bottle","tonic","botanicals","citrus"],
    "negative": ["beer"],
    "anchors": ["verre highball","romarin","baies de genièvre"],
    "unsplash": ["gin tonic botanicals"]
  },
  "couteau de chef": {
    "category": "cuisine",
    "synonyms": ["chef knife","santoku"],
    "positive": ["chef knife on board","steel","sharp"],
    "negative": ["multitool"],
    "anchors": ["planche bois","lame brillante"],
    "unsplash": ["chef knife board"]
  },
  "poêle en fonte": {
    "category": "cuisine",
    "synonyms": ["poêle fonte","cast iron skillet","le creuset"],
    "positive": ["cast iron skillet","kitchen","seasoned"],
    "negative": ["aluminium cheap"],
    "anchors": ["anse","surface noire"],
    "unsplash": ["cast iron skillet kitchen"]
  },
  "faitout": {
    "category": "cuisine",
    "synonyms": ["cocotte","dutch oven","le creuset"],
    "positive": ["dutch oven enamel","lid","steam"],
    "negative": ["pressure cooker modern"],
    "anchors": ["cocotte émaillée","poignées"],
    "unsplash": ["dutch oven enamel pot"]
  },
  "cartes cadeau expérience": {
    "category": "expérience",
    "synonyms": ["coffret cadeau","smartbox","wonderbox"],
    "positive": ["experience gift box","voucher","activity"],
    "negative": ["bank card"],
    "anchors": ["coffret","bons"],
    "unsplash": ["experience gift box"]
  },
  "concert": {
    "category": "événement",
    "synonyms": ["billet concert","live show"],
    "positive": ["concert stage","crowd","lights"],
    "negative": ["conference"],
    "anchors": ["scène","public"],
    "unsplash": ["concert crowd lights"]
  },
  "théâtre": {
    "category": "événement",
    "synonyms": ["pièce de théâtre","billet théâtre"],
    "positive": ["theater stage","red curtain","seats"],
    "negative": ["cinema screen"],
    "anchors": ["rideau rouge","projecteurs"],
    "unsplash": ["theater stage red curtains"]
  },
  "voyage city trip": {
    "category": "voyage",
    "synonyms": ["week-end","citytrip"],
    "positive": ["city skyline","suitcase","couple walking"],
    "negative": ["camping wild"],
    "anchors": ["valise cabine","ruelles"],
    "unsplash": ["city trip weekend suitcase"]
  },
  "valise": {
    "category": "voyage",
    "synonyms": ["bagage","suitcase","carry-on"],
    "positive": ["hardshell suitcase","airport","handle"],
    "negative": ["backpack"],
    "anchors": ["roulettes","coque rigide"],
    "unsplash": ["carry on suitcase minimal"]
  }
};

/**
 * Extract color information from text
 */
function extractColors(text: string): string[] {
  const colorMap: Record<string, string[]> = {
    'rouge': ['red', 'rouge'],
    'red': ['red', 'rouge'],
    'bleu': ['blue', 'bleu'],
    'blue': ['blue', 'bleu'], 
    'noir': ['black', 'noir'],
    'black': ['black', 'noir'],
    'blanc': ['white', 'blanc'],
    'white': ['white', 'blanc'],
    'rose': ['pink', 'rose'],
    'pink': ['pink', 'rose'],
    'vert': ['green', 'vert'],
    'green': ['green', 'vert'],
    'jaune': ['yellow', 'jaune'],
    'yellow': ['yellow', 'jaune'],
    'orange': ['orange'],
    'violet': ['purple', 'violet'],
    'purple': ['purple', 'violet'],
    'gris': ['gray', 'grey', 'gris'],
    'gray': ['gray', 'grey', 'gris'],
    'grey': ['gray', 'grey', 'gris'],
    'argent': ['silver', 'argent'],
    'silver': ['silver', 'argent'],
    'or': ['gold', 'or'],
    'gold': ['gold', 'or'],
    'bronze': ['bronze'],
    'marron': ['brown', 'marron'],
    'brown': ['brown', 'marron']
  };

  const colors: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const [key, values] of Object.entries(colorMap)) {
    if (lowerText.includes(key)) {
      colors.push(...values);
    }
  }
  
  return [...new Set(colors)]; // Remove duplicates
}

/**
 * Calculate text similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - (matrix[str2.length][str1.length] / maxLength);
}

/**
 * Find best semantic match using exact and fuzzy matching
 */
function findSemanticMatch(giftIdea: string): { key: string; entry: SemanticEntry; confidence: number } | null {
  const normalizedIdea = giftIdea.toLowerCase().trim();
  
  // 1. Exact key match
  if (SEMANTIC_DATABASE[normalizedIdea]) {
    return { 
      key: normalizedIdea, 
      entry: SEMANTIC_DATABASE[normalizedIdea], 
      confidence: 1.0 
    };
  }
  
  // 2. Synonym match
  for (const [key, entry] of Object.entries(SEMANTIC_DATABASE)) {
    if (entry.synonyms.some(synonym => 
      normalizedIdea.includes(synonym.toLowerCase()) || 
      synonym.toLowerCase().includes(normalizedIdea)
    )) {
      return { key, entry, confidence: 0.9 };
    }
  }
  
  // 3. Fuzzy match on keys and synonyms
  let bestMatch: { key: string; entry: SemanticEntry; confidence: number } | null = null;
  
  for (const [key, entry] of Object.entries(SEMANTIC_DATABASE)) {
    // Check key similarity
    const keySimilarity = calculateSimilarity(normalizedIdea, key);
    if (keySimilarity > 0.7 && (!bestMatch || keySimilarity > bestMatch.confidence)) {
      bestMatch = { key, entry, confidence: keySimilarity * 0.8 };
    }
    
    // Check synonym similarity
    for (const synonym of entry.synonyms) {
      const synonymSimilarity = calculateSimilarity(normalizedIdea, synonym.toLowerCase());
      if (synonymSimilarity > 0.7 && (!bestMatch || synonymSimilarity > bestMatch.confidence)) {
        bestMatch = { key, entry, confidence: synonymSimilarity * 0.8 };
      }
    }
  }
  
  return bestMatch;
}

/**
 * Main semantic mapping function
 */
export function createSemanticMapping(giftIdea: string): SemanticMapping {
  const colors = extractColors(giftIdea);
  const match = findSemanticMatch(giftIdea);
  
  if (match) {
    const { entry, confidence } = match;
    
    return {
      category: entry.category,
      subcategory: undefined,
      brand: undefined,
      productType: entry.category,
      colors: colors.length > 0 ? colors : undefined,
      context: ['product', 'gift', 'premium'],
      keywords: [...entry.positive, giftIdea.toLowerCase()],
      excludeKeywords: entry.negative,
      anchors: entry.anchors,
      unsplashQueries: entry.unsplash,
      confidence: Math.max(confidence, colors.length > 0 ? confidence + 0.1 : confidence)
    };
  }
  
  // Fallback for unmatched items
  return {
    category: 'general',
    subcategory: undefined,
    brand: undefined,
    productType: 'product',
    colors: colors.length > 0 ? colors : undefined,
    context: ['product', 'gift'],
    keywords: [giftIdea.toLowerCase(), 'product', 'gift'],
    excludeKeywords: ['office', 'corporate', 'business'],
    anchors: [giftIdea],
    unsplashQueries: [giftIdea],
    confidence: 0.3
  };
}