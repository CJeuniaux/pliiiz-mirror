const LIB_BASE = 'https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/library/';

// slug -> filename in /library/
const CANONICAL_FILES: Record<string, string> = {
  'chocolat-noir':            'chocolat-noir.webp',          // dark chocolate
  'citron':                   'citron.webp',                 // lemon (ingredient)
  'jeux-de-societe':          'jeux-de-societe.webp',        // board games
  'livres-de-cuisine':        'livres-de-cuisine.webp',      // cookbooks
  'livres-sur-les-voyages':   'livres-sur-les-voyages.webp', // travel books
  'peinture':                 'peinture.webp',               // painting / art supplies
  'plantes-d-interieur':      'plantes-d-interieur.webp',    // houseplants
  'vinyles':                  'vinyles.webp',                // vinyl records
};

function normalizeLabel(s: string) {
  return (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')                    // strip accents
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')                // drop apostrophes
    .replace(/[^a-z0-9\s-]/g, ' ')       // keep alnum/space/hyphen
    .replace(/\s+/g, ' ')                // collapse spaces
    .replace(/\s/g, '-');                // spaces -> hyphen
}

// normalized label -> canonical slug
const ALIASES: Record<string, string> = {
  // chocolat noir
  'chocolat-noir': 'chocolat-noir',
  'chocolat-noir-70': 'chocolat-noir',
  // jeux de société
  'jeux-de-societe': 'jeux-de-societe',
  'jeu-de-societe': 'jeux-de-societe',
  'les-jeux-de-societe': 'jeux-de-societe',
  // livres de cuisine
  'livres-de-cuisine': 'livres-de-cuisine',
  'livre-de-cuisine': 'livres-de-cuisine',
  'livres-de-recettes': 'livres-de-cuisine',
  // voyages
  'livres-sur-les-voyages': 'livres-sur-les-voyages',
  'livres-voyages': 'livres-sur-les-voyages',
  'guides-de-voyage': 'livres-sur-les-voyages',
  // peinture
  'peinture': 'peinture',
  'peintures': 'peinture',
  // plantes d'intérieur
  'plantes-d-interieur': 'plantes-d-interieur',
  'plante-d-interieur': 'plantes-d-interieur',
  // vinyles
  'vinyles': 'vinyles',
  'vinyle': 'vinyles',
  'disques-vinyles': 'vinyles',
  // citron
  'citron': 'citron',
  'citron-jaune': 'citron',
};

// category icons (optional)
const CAT_ICON: Record<string, string> = {
  tea: '/img/icons/tea.jpg',
  chocolate: '/img/icons/chocolate.jpg',
  books: '/img/icons/books.jpg',
  plants: '/img/icons/plants.jpg',
  games: '/img/icons/games.jpg',
  music: '/img/icons/music.jpg',
  art: '/img/icons/art.jpg',
  food: '/img/icons/food.jpg'
};

export function resolveThumbUrl(item: { label: string; canonical?: { categoryId?: string } } | string, categoryId?: string): string {
  // Handle both old (string) and new (object) API
  const label = typeof item === 'string' ? item : item?.label;
  const cat = typeof item === 'string' ? categoryId : item?.canonical?.categoryId;
  
  const norm = normalizeLabel(label);
  const slug = ALIASES[norm] || (CANONICAL_FILES[norm] ? norm : undefined);

  if (slug) return LIB_BASE + CANONICAL_FILES[slug];

  // IMPORTANT: do NOT fuzzy-match unknown labels.
  // If we don't have an explicit mapping, use category icon or placeholder.
  const catLower = cat?.toLowerCase?.();
  if (catLower && CAT_ICON[catLower]) return CAT_ICON[catLower];

  return '/img/placeholder.png';
}

export function mapsSearchUrlFromLabel(
  label: string,
  city?: string,
  coords?: { lat: number; lng: number }
): string {
  const base = 'https://www.google.com/maps/search/?api=1&query=';
  const q = coords
    ? `${label} @ ${coords.lat},${coords.lng}`
    : city
      ? `${label} near ${city}`
      : label;
  return `${base}${encodeURIComponent(q)}&utm_source=pliiiz&utm_medium=offer&utm_campaign=item`;
}

export const CTA_LABEL = 'TROUVER';