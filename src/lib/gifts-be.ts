import giftMap from "@/data/gift_keyword_map.fr.json";

export type MapEntry = {
  subcategory?: string;
  main_category: string;
  stores: string[];
};

type GiftMap = Record<string, MapEntry>;

// Suppression des accents et diacritiques
const removeAccents = (s: string): string => 
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "");

// Normalisation FR : minuscules, sans accents, ponctuation → espaces, espaces multiples → simple
export const normalizeFR = (s: string): string =>
  removeAccents(s.toLowerCase())
    .replace(/[.,;:!?'"()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Distance de Levenshtein pour la recherche fuzzy
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  
  return dp[m][n];
}

// Fallbacks par catégorie principale
const CATEGORY_FALLBACKS: Record<string, string[]> = {
  "Gastronomie & boissons": ["Prik&Tik", "Rob The Gourmets' Market", "Mig's World Wines", "Delitraiteur"],
  "Sport & plein air": ["Decathlon", "A.S.Adventure", "Runners' Lab", "Bike Republic"],
  "Maison & décoration": ["Maisons du Monde", "Casa", "Zara Home", "Dille & Kamille"],
  "Beauté & bien-être": ["ICI PARIS XL", "Di", "Rituals", "The Body Shop"],
  "Culture & divertissement": ["fnac", "Club", "Standaard Boekhandel", "Archiduc"],
  "High-tech & gadgets": ["MediaMarkt", "Coolblue", "fnac", "Apple Store"],
  "Enfants & famille": ["Kiabi Kids", "JBC", "Maxi Toys", "Dreambaby"],
  "Loisirs créatifs & DIY": ["Hubo", "Brico", "Rougier & Plé", "Action"],
  "Voyages & expériences": ["Tiqets", "Bongo", "Smartbox", "Fnac Spectacles"],
  "Animaux": ["Tom&Co", "Maxi Zoo", "Aveve", "Jumper"]
};

export type ResolveResult = {
  found: boolean;
  keyword: string;
  matchedKey?: string;
  subcategory?: string;
  main_category: string;
  stores: string[];
  confidence: "exact" | "alias" | "fuzzy" | "fallback";
};

/**
 * Résout un mot-clé de cadeau vers une catégorie et des magasins
 * @param input - Le mot-clé à résoudre (ex: "chocolat", "rhum arrangé")
 * @returns Résultat avec catégorie, sous-catégorie, magasins et niveau de confiance
 */
export function resolveBE(input: string): ResolveResult {
  const map = giftMap as GiftMap;
  const key = normalizeFR(input);
  
  if (!key) {
    return {
      found: false,
      keyword: key,
      main_category: "Culture & divertissement",
      stores: CATEGORY_FALLBACKS["Culture & divertissement"],
      confidence: "fallback"
    };
  }

  // 1. Recherche exacte
  if (map[key]) {
    const entry = map[key];
    return {
      found: true,
      keyword: key,
      matchedKey: key,
      ...entry,
      confidence: "exact"
    };
  }

  // 2. Recherche fuzzy (distance ≤ 2)
  let best: { k: string; d: number } | null = null;
  for (const k of Object.keys(map)) {
    const d = levenshtein(key, k);
    if (d <= 2 && (!best || d < best.d)) {
      best = { k, d };
    }
  }
  
  if (best) {
    const entry = map[best.k];
    return {
      found: true,
      keyword: key,
      matchedKey: best.k,
      ...entry,
      confidence: "fuzzy"
    };
  }

  // 3. Fallback heuristique basé sur des mots-clés
  const k = ` ${key} `;
  
  const getFallback = (category: string): ResolveResult => ({
    found: false,
    keyword: key,
    main_category: category,
    stores: CATEGORY_FALLBACKS[category],
    confidence: "fallback"
  });

  if (/\b(rhum|whisk|gin|bier|vin|champagne|verre|carafe|cocktail|cafe|the|choco|praline)\b/.test(k)) {
    return getFallback("Gastronomie & boissons");
  }
  if (/\b(yoga|velo|running|randon|fitness|sport|tente|couchage|camp)\b/.test(k)) {
    return getFallback("Sport & plein air");
  }
  if (/\b(bougie|vase|cadre|plaid|coussin|lampe|vaisselle|plante|terrarium|deco|miroir)\b/.test(k)) {
    return getFallback("Maison & décoration");
  }
  if (/\b(parfum|creme|maquillage|serum|massage|spa|rituals)\b/.test(k)) {
    return getFallback("Beauté & bien-être");
  }
  if (/\b(livre|roman|bd|manga|vinyle|jeu de societe|puzzle|musique|concert)\b/.test(k)) {
    return getFallback("Culture & divertissement");
  }
  if (/\b(casque|ecouteur|enceinte|montre connect|batterie|chargeur|polaroid|appareil|ordinateur|pc)\b/.test(k)) {
    return getFallback("High-tech & gadgets");
  }
  if (/\b(peluche|lego|poussette|jouet|doudou|babyphone)\b/.test(k)) {
    return getFallback("Enfants & famille");
  }
  if (/\b(peinture|tricot|crochet|origami|scrap|outil|perceuse|macrame)\b/.test(k)) {
    return getFallback("Loisirs créatifs & DIY");
  }
  if (/\b(billet|theatre|restaurant|sejour|week end|bongo|wonderbox)\b/.test(k)) {
    return getFallback("Voyages & expériences");
  }
  if (/\b(chat|chien|laisse|croquettes|arbre a chat|litiere)\b/.test(k)) {
    return getFallback("Animaux");
  }

  // Fallback par défaut
  return getFallback("Culture & divertissement");
}

/**
 * Résout et retourne les magasins (limité à 6)
 * @param keyword - Le mot-clé de cadeau
 * @returns Liste de max 6 magasins
 */
export function getStoresForGift(keyword: string): string[] {
  const result = resolveBE(keyword);
  return result.stores.slice(0, 6);
}
