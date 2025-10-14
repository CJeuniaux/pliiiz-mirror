import { resolveOsmTypeFromGiftIdea } from './gift-categories';

export type Poi = { id:string; name:string; lat:number; lng:number; address?:string; distanceM?:number; tags?:Record<string,string> };

/* ---------- Aliases : idées → type OSM (clé) ---------- */
export const TYPE_ALIASES: Record<string, string> = {
  // Gourmand
  "chocolat": "chocolatier", "chocolats": "chocolatier", "pralines": "chocolatier",
  "truffes": "chocolatier", "confiserie": "chocolatier", "bonbons": "chocolatier",
  "macaron": "patisserie", "macarons": "patisserie", "gâteaux": "patisserie", "gateaux": "patisserie",
  "pâtisserie": "patisserie", "patisserie": "patisserie", "boulangerie": "patisserie",
  "fromage": "fromager", "fromages": "fromager", "cheese": "fromager",
  "charcuterie": "delicatessen", "épicerie fine": "delicatessen", "epicerie fine": "delicatessen",
  "thé": "the-cafe", "thes": "the-cafe", "théière": "the-cafe", "cafés": "the-cafe", "café": "the-cafe",
  "cafe": "the-cafe", "torréfacteur": "the-cafe", "coffee": "the-cafe",
  "miel": "delicatessen", "épices": "delicatessen", "huile d'olive": "delicatessen",
  "vin": "caviste", "champagne": "caviste", "spiritueux": "caviste", "bière": "caviste", "biere": "caviste",
  "rhum": "caviste", "whisky": "caviste", "gin": "caviste", "vodka": "caviste", "alcool": "caviste",
  "oenologie": "caviste", "œnologie": "caviste", "dégustation": "caviste", "sommelier": "caviste",
  "atelier vin": "caviste", "atelier oenologie": "caviste", "atelier œnologie": "caviste",
  "glace": "glacier", "glaces": "glacier", "ice cream": "glacier",

  // Bien-être / beauté
  "bougie": "bougies", "bougies": "bougies", "diffuseur": "bougies",
  "parfum": "parfumerie", "parfumerie": "parfumerie", "cosmétiques": "cosmetiques", "skincare": "cosmetiques",
  "spa": "spa", "massage": "spa", "bien-être": "spa", "bienetre": "spa",
  "coiffure": "coiffure", "barber": "coiffure",

  // Maison / déco
  "plante": "fleuriste", "plantes": "fleuriste", "fleurs": "fleuriste", "bouquet": "fleuriste",
  "déco": "deco", "deco": "deco", "maison": "deco", "luminaire": "deco", "affiche": "deco",
  "céramique": "deco", "ceramique": "deco", "vase": "deco", "photocadre": "deco",

  // Mode / accessoires
  "vêtements": "mode", "vetements": "mode", "boutique": "mode",
  "chaussures": "chaussures", "sneakers": "chaussures",
  "sacs": "maroquinerie", "maroquinerie": "maroquinerie", "cuir": "maroquinerie",
  "bijou": "bijoux", "bijoux": "bijoux", "bague": "bijoux", "collier": "bijoux", "bracelet": "bijoux",
  "boucles d'oreilles": "bijoux", "or": "bijoux", "argent": "bijoux", "alliance": "bijoux",
  "montre": "bijoux", "montres": "bijoux", "watch": "bijoux", "casio": "bijoux", "seiko": "bijoux",
  "omega": "bijoux", "rolex": "bijoux", "swatch": "bijoux", "fossil": "bijoux",
  "lunettes": "optique", "solaire": "optique",

  // Culture, jeux & loisirs créatifs
  "livre": "librairie", "livres": "librairie", "bd": "librairie",
  "vinyle": "musique", "disques": "musique", "musique": "musique", "instruments": "instruments",
  "jeu de société": "jeux", "jeux": "jeux", "boardgame": "jeux", "puzzle": "jeux",
  "jeux vidéo": "jeux-video", "jeu video": "jeux-video",
  "beaux-arts": "beaux-arts", "art": "beaux-arts", "loisirs créatifs": "beaux-arts", "loisirs creatifs": "beaux-arts",
  "mercerie": "mercerie", "tissu": "tissus", "tissus": "tissus", "couture": "tissus",
  "papeterie": "papeterie", "stylo": "papeterie", "calligraphie": "papeterie",
  "photo": "photo", "impression photo": "photo",

  // Tech & sport
  "high-tech": "hitech", "tech": "hitech", "electronique": "hitech",
  "téléphone": "hitech", "smartphone": "hitech", "hifi": "hifi",
  "sport": "sport", "sports": "sport", "outdoor": "outdoor",
  "vélo": "velo", "velo": "velo",

  // Enfants & animaux
  "jouets enfants": "jouets", "jouets": "jouets", "enfant": "jouets",
  "bébé": "bebe", "bebe": "bebe", "puériculture": "bebe",
  "animal": "animalerie", "animaux": "animalerie", "chien": "animalerie", "chat": "animalerie",

  // "Fourre-tout" cadeau
  "cadeau": "cadeau", "concept store": "concept", "concept": "concept", "grand magasin": "grand-magasin",

  // Restaurants
  "restaurant": "restaurant", "resto": "restaurant", "japonais": "restaurant"
};

/* ---------- Filtres Overpass par type ---------- */
// Chaque entrée est une ou plusieurs requêtes (node/way/relation) à fusionner.
export const TYPE_FILTERS: Record<string, string[]> = {
  // Gourmand
  chocolatier: ['["shop"="chocolate"]','["shop"="confectionery"]'],
  patisserie:  ['["shop"="pastry"]','["shop"="bakery"]'],
  fromager:    ['["shop"="cheese"]'],
  delicatessen:['["shop"="delicatessen"]','["shop"="farm"]','["shop"="deli"]'],
  "the-cafe":  ['["shop"="tea"]','["shop"="coffee"]','["amenity"="cafe"]'],
  caviste:     ['["shop"="wine"]','["shop"="alcohol"]','["shop"="beer"]'],
  glacier:     ['["amenity"="ice_cream"]'],

  // Bien-être / beauté
  bougies:     ['["shop"="candles"]','["craft"="candles"]'],
  parfumerie:  ['["shop"="perfumery"]'],
  cosmetiques: ['["shop"="cosmetics"]','["shop"="beauty"]'],
  spa:         ['["leisure"="spa"]','["shop"="beauty"]["beauty"~"spa|massage",i]'],
  coiffure:    ['["shop"="hairdresser"]','["shop"="barber"]'],

  // Maison / déco
  fleuriste:   ['["shop"="florist"]','["shop"="garden_centre"]'],
  deco:        ['["shop"="interior_decoration"]','["shop"="houseware"]','["shop"="furniture"]','["shop"="lighting"]','["shop"="art"]'],

  // Mode / accessoires
  mode:        ['["shop"="clothes"]','["shop"="boutique"]','["shop"="fashion"]'],
  chaussures:  ['["shop"="shoes"]'],
  maroquinerie:['["shop"="bag"]','["shop"="leather"]'],
  bijoux:      ['["shop"="jewelry"]','["shop"="watches"]','["craft"="watchmaker"]'],
  optique:     ['["shop"="optician"]'],

  // Culture & jeux
  librairie:   ['["shop"="books"]'],
  musique:     ['["shop"="music"]'],
  instruments: ['["shop"="musical_instrument"]'],
  jeux:        ['["shop"="games"]','["shop"="toys"]'],
  "jeux-video":['["shop"="video_games"]'],
  "beaux-arts":['["shop"="art"]','["shop"="craft"]','["shop"="paint"]'],
  mercerie:    ['["shop"="haberdashery"]'],
  tissus:      ['["shop"="fabric"]','["shop"="sewing"]'],
  papeterie:   ['["shop"="stationery"]','["shop"="office_supplies"]'],
  photo:       ['["shop"="photo"]','["shop"="copyshop"]'],

  // Tech & sport
  hitech:      ['["shop"="electronics"]','["shop"="computer"]','["shop"="mobile_phone"]','["shop"="appliance"]'],
  hifi:        ['["shop"="hifi"]','["shop"="electronics"]["hifi"~".",i]'],
  sport:       ['["shop"="sports"]'],
  outdoor:     ['["shop"="outdoor"]'],
  velo:        ['["shop"="bicycle"]'],

  // Enfants & animaux
  jouets:      ['["shop"="toys"]'],
  bebe:        ['["shop"="baby_goods"]'],
  animalerie:  ['["shop"="pet"]'],

  // "Fourre-tout" cadeau & grands magasins
  cadeau:      ['["shop"="gift"]','["shop"="variety_store"]'],
  concept:     ['["shop"="gift"]','["shop"="interior_decoration"]','["shop"="design"]'],
  "grand-magasin": ['["shop"="department_store"]'],

  // Restaurants
  restaurant:  ['["amenity"="restaurant"]']
};

const toKey = (t: string) => {
  const s = t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  return TYPE_ALIASES[s] || s;
};

/* ---------- Helper : texte → type ---------- */
const norm = (s:string)=> s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();

/** Tente d'inférer le type à partir d'une idée/envoi libre. */
export function resolveTypeFromIdea(input: string, fallback: string = "cadeau"): string {
  const x = norm(input);
  
  // Try comprehensive taxonomy first
  const taxonomyMatch = resolveOsmTypeFromGiftIdea(input);
  if (taxonomyMatch && TYPE_FILTERS[taxonomyMatch]) {
    console.log(`[resolveTypeFromIdea] Matched "${input}" -> "${taxonomyMatch}" via taxonomy`);
    return taxonomyMatch;
  }
  
  // Fallback to existing logic
  if (TYPE_FILTERS[x]) return x;
  // cherche par alias exact
  if (TYPE_ALIASES[x]) return TYPE_ALIASES[x];
  // cherche par inclusion (mots-clés) — rapide
  for (const key of Object.keys(TYPE_ALIASES)) {
    if (x.includes(key)) return TYPE_ALIASES[key];
  }
  // quelques heuristiques simples
  if (/fleur|plante|bouquet/.test(x)) return "fleuriste";
  if (/chocol|pralin|truff/.test(x)) return "chocolatier";
  if (/gateau|patis|macaron|boulanger/.test(x)) return "patisserie";
  if (/vin|cav|champagne|bi(e|è)re|whisk|spirit|rhum|gin|vodka|alcool|(o|œ)enolog|degustation|sommelier|atelier/.test(x)) return "caviste";
  if (/bougie|parfum|cosmet|soin|spa|massage/.test(x)) return "spa";
  if (/livre|bd|roman/.test(x)) return "librairie";
  if (/jeu.?s|puzzle|board/.test(x)) return "jeux";
  if (/vinyle|disque|musique/.test(x)) return "musique";
  if (/deco|maison|affiche|cadre|vase|luminaire/.test(x)) return "deco";
  if (/v(e|ê)tement|mode|boutique/.test(x)) return "mode";
  if (/bijou|collier|bracelet|bague|or|argent|alliance|joailler/.test(x)) return "bijoux";
  if (/montre|watch|casio|seiko|omega|rolex|swatch|fossil/.test(x)) return "bijoux";
  if (/papeterie|stylo|carnet|calligraph/.test(x)) return "papeterie";
  if (/photo|impress/.test(x)) return "photo";
  if (/hifi|audio|enceinte/.test(x)) return "hifi";
  if (/electronique|tech|smart|t(e|é)l(e|é)phone/.test(x)) return "hitech";
  if (/sport|outdoor|running|rando|fitness|training|equipement/.test(x)) return "sport";
  if (/v(e|é)lo|cycle/.test(x)) return "velo";
  if (/bebe|pu(e|é)ricul/.test(x)) return "bebe";
  if (/animal|chien|chat/.test(x)) return "animalerie";
  if (/restaurant|resto|japonais/.test(x)) return "restaurant";
  
  console.log(`[resolveTypeFromIdea] No match for "${input}", using fallback: "${fallback}"`);
  return fallback;
}

const OVERPASS = "https://overpass-api.de/api/interpreter";
const enc = encodeURIComponent;

const dist = (a:number,b:number,c:number,d:number) => {
  const R=6371000, toRad=(x:number)=>x*Math.PI/180;
  const dLat=toRad(c-a), dLon=toRad(d-b);
  const A=Math.sin(dLat/2)**2+Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(dLon/2)**2;
  return 2*R*Math.atan2(Math.sqrt(A),Math.sqrt(1-A));
};

export async function fetchPoisOverpass(
  type: string, lat: number, lng: number, radiusM = 3000, limit = 40, brand?: string
): Promise<Poi[]> {
  const key = toKey(type);
  const filters = TYPE_FILTERS[key] || TYPE_FILTERS["cadeau"];
  const brandFilter = brand ? `["name"~"${brand}",i]` : "";

  const query = `
    [out:json][timeout:25];
    (
      ${filters.map(f => `node${f}${brandFilter}(around:${radiusM},${lat},${lng});`).join("\n")}
      ${filters.map(f => `way${f}${brandFilter}(around:${radiusM},${lat},${lng});`).join("\n")}
      ${filters.map(f => `relation${f}${brandFilter}(around:${radiusM},${lat},${lng});`).join("\n")}
    );
    out center ${limit};
  `.trim();

  try {
    const r = await fetch(OVERPASS, { method:"POST", headers:{ "Content-Type":"application/x-www-form-urlencoded" }, body:`data=${enc(query)}` });
    if (!r.ok) return [];
    const json = await r.json();

    const items: Poi[] = (json.elements || []).map((el:any) => {
      const center = el.type === "node" ? { lat: el.lat, lon: el.lon } : el.center;
      const tags = el.tags || {};
      const address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean).join(" ");
      return {
        id: `${el.type}/${el.id}`,
        name: tags.name || tags.brand || "Commerce",
        lat: center?.lat, lng: center?.lon,
        address, tags
      };
    }).filter(p => p.lat && p.lng);

    // dédup + distance + tri
    const seen = new Set<string>();
    items.forEach(p => p.distanceM = dist(lat, lng, p.lat, p.lng));
    const uniq = items.filter(p => {
      const k = `${(p.name||"").toLowerCase()}@${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
      if (seen.has(k)) return false; seen.add(k); return true;
    }).sort((a,b)=> (a.distanceM! - b.distanceM!));

    return uniq.slice(0, limit);
  } catch (error) {
    console.error('Erreur Overpass:', error);
    return [];
  }
}