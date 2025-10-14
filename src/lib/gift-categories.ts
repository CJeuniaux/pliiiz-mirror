/**
 * Comprehensive gift category taxonomy with OSM mapping
 * Version 2 - Enhanced with entities, styles, negatives
 */

export interface GiftTag {
  name: string;
  slug: string;
  keywords: string[];
  entities?: string[];
  styles?: string[];
  negatives?: string[];
  occasions?: string[];
  osmType: string; // Type OSM à utiliser pour Overpass
}

export interface GiftCategory {
  category: string;
  slug?: string;
  tags: GiftTag[];
}

export const GIFT_CATEGORIES: GiftCategory[] = [
  {
    category: "Mode & Accessoires",
    slug: "mode-accessoires",
    tags: [
      { 
        name: "Prêt-à-porter", 
        slug: "pret-a-porter", 
        keywords: ["vetements", "chemise", "pantalon", "robe", "jupe", "pull", "manteau", "look", "collection", "tailleur", "veston", "blouse", "t-shirt"],
        entities: ["tailles", "coupe", "coton", "lin", "laine", "cachemire", "soie"],
        styles: ["casual", "chic", "minimal", "business", "boheme", "classique", "oversize"],
        negatives: ["deguisement", "cosplay", "uniforme"],
        occasions: ["anniversaire", "rentree", "diner", "entretien", "Noel"],
        osmType: "clothes"
      },
      {
        name: "Streetwear",
        slug: "streetwear",
        keywords: ["hoodie", "sweat", "jogger", "logo", "cap", "snapback", "skate", "urbain", "drop", "collab"],
        entities: ["coton epais", "fleece", "serigraphie"],
        styles: ["oversize", "loose", "vintage", "graphic"],
        negatives: ["tenue de travail", "costume"],
        occasions: ["cadeau ado", "rentree", "anniversaire"],
        osmType: "clothes"
      },
      { 
        name: "Chaussures & Sneakers", 
        slug: "chaussures-sneakers", 
        keywords: ["sneakers", "baskets", "bottines", "derbies", "sandales", "talons", "running"],
        entities: ["cuir", "nubuck", "mesh", "semelle", "pointure"],
        styles: ["sport", "ville", "retro", "technique"],
        negatives: ["patins", "crampons pro"],
        occasions: ["anniversaire", "fete des peres/meres", "rentree"],
        osmType: "shoes"
      },
      { 
        name: "Bijoux & Montres", 
        slug: "bijoux-montres", 
        keywords: ["collier", "bracelet", "bague", "boucles", "pendentif", "montre", "joaillerie"],
        entities: ["or", "argent", "plaque", "acier", "cuir", "diamant", "pierre fine", "quartz", "automatique"],
        styles: ["delicat", "statement", "minimal", "vintage"],
        negatives: ["piercing medical", "bijou fantaisie enfant basique"],
        occasions: ["Saint-Valentin", "anniversaire", "Noel", "mariage"],
        osmType: "jewelry"
      },
      { 
        name: "Maroquinerie", 
        slug: "maroquinerie", 
        keywords: ["sac", "portefeuille", "ceinture", "porte-cartes", "besace", "cabas", "bandouliere"],
        entities: ["cuir pleine fleur", "tannage vegetal", "suede", "grainé", "zip YKK"],
        styles: ["classique", "premium", "minimal", "artisanal"],
        negatives: ["bagagerie rigide", "housse ordinateur"],
        occasions: ["diplome", "nouveau job", "anniversaire"],
        osmType: "bag"
      }
    ]
  },
  {
    category: "Beauté & Bien-être",
    slug: "beaute-bien-etre",
    tags: [
      { 
        name: "Skincare & Soins visage", 
        slug: "skincare", 
        keywords: ["serum", "creme", "hydratant", "nettoyant", "tonique", "exfoliant", "masque", "SPF"],
        entities: ["acide hyaluronique", "niacinamide", "retinol", "AHA/BHA", "ceramides"],
        styles: ["clean", "dermo", "natural", "vegan"],
        negatives: ["medicament", "prescription"],
        occasions: ["autosoins", "coffret cadeau", "calendrier de l'avent"],
        osmType: "cosmetics"
      },
      { 
        name: "Maquillage", 
        slug: "maquillage", 
        keywords: ["fond de teint", "mascara", "rouge a levres", "palette", "eyeliner", "blush", "highlighter"],
        entities: ["teinte", "couvrance", "fini mat", "glow"],
        styles: ["nude", "glam", "pro"],
        negatives: ["greasepaint", "SFX"],
        occasions: ["anniversaire", "fetes", "soiree"],
        osmType: "cosmetics"
      },
      { 
        name: "Parfums", 
        slug: "parfums", 
        keywords: ["eau de parfum", "eau de toilette", "fragrance", "notes", "sillage"],
        entities: ["floral", "boise", "ambre", "hesperide", "musc", "vanille"],
        styles: ["signature", "niche", "classique"],
        negatives: ["desodorisant maison"],
        occasions: ["Saint-Valentin", "fete des meres/peres", "Noel"],
        osmType: "perfumery"
      },
      {
        name: "Capillaire",
        slug: "capillaire",
        keywords: ["shampooing", "apres-shampooing", "masque", "huile cheveux", "coiffant"],
        entities: ["keratine", "proteine", "silicone-free", "sulfate-free"],
        styles: ["reparateur", "volume", "lissant", "boucles"],
        negatives: ["teinture pro en salon"],
        occasions: ["coffret soins", "routine"],
        osmType: "hairdresser"
      },
      { 
        name: "Spa & Relax", 
        slug: "spa-relax", 
        keywords: ["massage", "huiles", "bain", "sel", "gommage", "bougie", "hammam"],
        entities: ["lavande", "eucalyptus", "ylang-ylang"],
        styles: ["relax", "aromatherapie", "cocooning"],
        negatives: ["dispositifs medicaux"],
        occasions: ["autosoins", "cadeau detente"],
        osmType: "spa"
      }
    ]
  },
  {
    category: "Maison & Déco",
    slug: "maison-deco",
    tags: [
      { 
        name: "Décoration intérieure", 
        slug: "decoration-interieure", 
        keywords: ["vase", "bougie", "cadre", "affiche", "miroir", "objet design", "plaid", "coussin"],
        entities: ["ceramique", "verre souffle", "bois", "laiton"],
        styles: ["scandinave", "minimal", "boheme", "industriel"],
        negatives: ["materiaux de construction"],
        occasions: ["pendaison de cremaillere", "Noel"],
        osmType: "interior_decoration"
      },
      { 
        name: "Art de la table", 
        slug: "art-de-la-table", 
        keywords: ["assiettes", "verres", "couverts", "carafe", "set", "serviettes"],
        entities: ["porcelaine", "gres", "cristal", "inox"],
        styles: ["decontracte", "gastronomique", "artisanal"],
        negatives: ["equipement pro"],
        occasions: ["diner", "mariage", "fetes"],
        osmType: "houseware"
      },
      { 
        name: "Ameublement", 
        slug: "ameublement", 
        keywords: ["fauteuil", "canape", "table", "etagere", "console", "tabouret"],
        entities: ["bois massif", "placage", "metal", "tissu"],
        styles: ["mid-century", "contemporain", "rustique"],
        negatives: ["cuisines integrees"],
        occasions: ["emmenagement", "cadeau premium"],
        osmType: "furniture"
      },
      { 
        name: "Linge de maison", 
        slug: "linge-de-maison", 
        keywords: ["draps", "housse", "couette", "serviettes", "peignoir"],
        entities: ["coton", "lin", "percale", "satin"],
        styles: ["premium", "hotel", "cosy"],
        negatives: ["consommables pro"],
        occasions: ["liste de naissance", "cremaillere"],
        osmType: "houseware"
      },
      { 
        name: "Plantes & Fleurs", 
        slug: "plantes-fleurs", 
        keywords: ["plante", "bouquet", "terrarium", "sechees", "cache-pot"],
        entities: ["monstera", "ficus", "eucalyptus", "roses"],
        styles: ["botanique", "minimal", "naturel"],
        negatives: ["materiel agricole"],
        occasions: ["remerciements", "anniversaire"],
        osmType: "florist"
      }
    ]
  },
  {
    category: "Gastronomie & Boissons",
    slug: "gastronomie-boissons",
    tags: [
      { 
        name: "Épicerie fine", 
        slug: "epicerie-fine", 
        keywords: ["truffe", "huile d'olive", "vinaigre", "condiments", "tapenade", "terrine"],
        entities: ["IGP", "AOP", "bio"],
        styles: ["gourmet", "terroir", "mediterraneen"],
        negatives: ["grossiste", "ingredients bruts non premium"],
        occasions: ["diner", "remerciement", "coffret"],
        osmType: "deli"
      },
      { 
        name: "Chocolats & Confiseries", 
        slug: "chocolats-confiseries", 
        keywords: ["praline", "ganache", "tablettes", "bonbons", "nougat", "calissons"],
        entities: ["cacao %", "origine", "bean-to-bar"],
        styles: ["artisan", "luxe", "decouverte"],
        negatives: ["confiserie foraine"],
        occasions: ["Paques", "Noel", "Saint-Valentin"],
        osmType: "chocolate"
      },
      { 
        name: "Vins & Spiritueux", 
        slug: "vins-spiritueux", 
        keywords: ["vin", "champagne", "whisky", "gin", "rhum", "degustation", "cave", "oenologie", "œnologie", "sommelier", "atelier vin", "atelier oenologie", "atelier œnologie"],
        entities: ["millesime", "cepage", "AOC", "barrique"],
        styles: ["nature", "biodynamie", "single malt"],
        negatives: ["alcool de pharmacie"],
        occasions: ["diner", "fete", "remerciement"],
        osmType: "caviste"
      },
      { 
        name: "Café & Thé", 
        slug: "cafe-the", 
        keywords: ["espresso", "grains", "filtre", "torrefaction", "the", "infusion", "matcha"],
        entities: ["arabica", "robusta", "LTT", "single origin"],
        styles: ["specialite", "slow coffee", "ceremonie"],
        negatives: ["capsules generiques"],
        occasions: ["bureau", "coffret decouverte"],
        osmType: "coffee"
      },
      { 
        name: "Ustensiles & Cuisine", 
        slug: "ustensiles-cuisine", 
        keywords: ["couteaux", "poele", "casserole", "planche", "gadget", "thermometre"],
        entities: ["acier", "fonte", "ceramique", "antiadhesif"],
        styles: ["pro", "home chef", "minimal"],
        negatives: ["electromenager lourd"],
        occasions: ["cremaillere", "mariage"],
        osmType: "houseware"
      }
    ]
  },
  {
    category: "High-tech & Gaming",
    slug: "hightech-gaming",
    tags: [
      { 
        name: "Smartphones & Accessoires", 
        slug: "smartphones-accessoires", 
        keywords: ["coque", "chargeur", "cable", "powerbank", "verre trempe", "magsafe"],
        entities: ["iPhone", "Android", "USB-C", "Qi"],
        styles: ["rugged", "slim", "transparent"],
        negatives: ["forfaits", "deblocage SIM"],
        occasions: ["rentree", "anniversaire"],
        osmType: "mobile_phone"
      },
      { 
        name: "Audio & Casques", 
        slug: "audio-casques", 
        keywords: ["ecouteurs", "casque", "bluetooth", "ANC", "barre de son", "DAC"],
        entities: ["LDAC", "aptX", "Hi-Res", "ANC"],
        styles: ["nomade", "hifi", "gaming"],
        negatives: ["sono pro de scene"],
        occasions: ["Noel", "fete des peres/meres"],
        osmType: "electronics"
      },
      { 
        name: "Photo & Vidéo", 
        slug: "photo-video", 
        keywords: ["appareil", "objectif", "trepied", "light", "gimbal", "vlogging"],
        entities: ["APS-C", "plein format", "35mm", "50mm"],
        styles: ["creatif", "pro", "voyage"],
        negatives: ["location materiel"],
        occasions: ["projet perso", "cadeau passion"],
        osmType: "electronics"
      },
      { 
        name: "Gaming & Consoles", 
        slug: "gaming-consoles", 
        keywords: ["console", "jeux video", "manette", "PC gaming", "retro", "e-sport"],
        entities: ["Switch", "PlayStation", "Xbox", "Steam"],
        styles: ["co-op", "solo", "party game"],
        negatives: ["pari", "lootbox argent reel"],
        occasions: ["anniversaire", "Noel"],
        osmType: "video_games"
      },
      { 
        name: "Objets connectés", 
        slug: "objets-connectes", 
        keywords: ["montre connectee", "domotique", "ampoule", "capteur", "assistant vocal"],
        entities: ["Matter", "HomeKit", "Alexa", "Google Home"],
        styles: ["smart home", "quantified self"],
        negatives: ["videosurveillance pro"],
        occasions: ["emmenagement", "techno-lover"],
        osmType: "electronics"
      }
    ]
  },
  {
    category: "Sport & Outdoor",
    slug: "sport-outdoor",
    tags: [
      { 
        name: "Running & Training", 
        slug: "running-training", 
        keywords: ["running", "fitness", "yoga", "leggings", "halteres", "tapis", "equipement", "equipement sportif"],
        entities: ["drop", "amorti", "dryfit"],
        styles: ["performance", "home gym"],
        negatives: ["dopage", "coaching medical"],
        occasions: ["resolutions", "rentree"],
        osmType: "sport"
      },
      { 
        name: "Randonnée & Camping", 
        slug: "randonnee-camping", 
        keywords: ["sac a dos", "tente", "duvet", "rechaud", "trek"],
        entities: ["gore-tex", "dwr", "R-value"],
        styles: ["ultralight", "bushcraft", "famille"],
        negatives: ["chasse"],
        occasions: ["roadtrip", "vacances"],
        osmType: "outdoor"
      },
      { 
        name: "Cyclisme", 
        slug: "cyclisme", 
        keywords: ["velo", "VTT", "route", "casque", "maillot", "home trainer"],
        entities: ["carbone", "tubeless", "wattmetre"],
        styles: ["commuter", "performance"],
        negatives: ["motos"],
        occasions: ["defi", "commuting"],
        osmType: "bicycle"
      },
      { 
        name: "Sports de glisse", 
        slug: "sports-de-glisse", 
        keywords: ["ski", "snowboard", "surf", "roller", "gants", "masque"],
        entities: ["camber", "rocker", "wax"],
        styles: ["freeride", "freestyle"],
        negatives: ["bateaux moteur"],
        occasions: ["hiver", "vacances"],
        osmType: "sport"
      },
      { 
        name: "Natation & Plage", 
        slug: "natation-plage", 
        keywords: ["maillot", "bonnet", "lunettes", "serviette", "sandales"],
        entities: ["chlorine-proof", "UV"],
        styles: ["sport", "resort"],
        negatives: ["peche"],
        occasions: ["ete", "voyage"],
        osmType: "sport"
      }
    ]
  }
];

/**
 * Index de recherche par mots-clés pour résolution rapide
 */
export function buildKeywordIndex(): Map<string, string> {
  const index = new Map<string, string>();
  
  GIFT_CATEGORIES.forEach(cat => {
    cat.tags.forEach(tag => {
      // Indexer tous les mots-clés
      tag.keywords.forEach(kw => {
        const normalized = kw.toLowerCase().trim();
        index.set(normalized, tag.osmType);
      });
      
      // Indexer aussi les entités si présentes
      tag.entities?.forEach(entity => {
        const normalized = entity.toLowerCase().trim();
        if (!index.has(normalized)) {
          index.set(normalized, tag.osmType);
        }
      });
    });
  });
  
  return index;
}

/**
 * Résout le type OSM à partir d'une idée de cadeau
 */
export function resolveOsmTypeFromGiftIdea(idea: string): string | null {
  const normalized = idea.toLowerCase().trim();
  const index = buildKeywordIndex();
  
  // 1. Correspondance directe
  if (index.has(normalized)) {
    return index.get(normalized) || null;
  }
  
  // 2. Correspondance partielle (recherche de sous-chaînes)
  for (const [keyword, osmType] of index.entries()) {
    if (normalized.includes(keyword) || keyword.includes(normalized)) {
      return osmType;
    }
  }
  
  return null;
}
