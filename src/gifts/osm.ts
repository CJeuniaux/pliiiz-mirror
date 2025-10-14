import { CATEGORY_TO_OSM } from './category-to-osm';

export interface NearbyPlace {
  id: number;
  name: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  distance?: number;
}

// Cache simple en mémoire (15 min)
const cache = new Map<string, { data: NearbyPlace[]; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

function getCacheKey(lat: number, lon: number, category: string, radius: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)},${category},${radius}`;
}

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

export async function fetchNearbyPlaces(
  lat: number, 
  lon: number, 
  category: string, 
  radius = 50000
): Promise<NearbyPlace[]> {
  const cacheKey = getCacheKey(lat, lon, category, radius);
  const cached = cache.get(cacheKey);
  
  // Vérifier le cache
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const cfg = CATEGORY_TO_OSM[category] ?? CATEGORY_TO_OSM.default;
    const around = `around:${radius},${lat},${lon}`;
    
    const buildQuery = (k: string, v: string) => 
      `node[${k}=${v}](${around});way[${k}=${v}](${around});`;
    
    const shopQueries = (cfg.shop ?? []).map(v => buildQuery('shop', v));
    const amenityQueries = (cfg.amenity ?? []).map(v => buildQuery('amenity', v));
    
    const body = `
      [out:json][timeout:25];
      (
        ${[...shopQueries, ...amenityQueries].join('\n')}
      );
      out center 30;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: body,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    const places: NearbyPlace[] = (data.elements ?? [])
      .map((e: any) => ({
        id: e.id,
        name: e.tags?.name ?? 'Boutique',
        lat: e.lat ?? e.center?.lat,
        lon: e.lon ?? e.center?.lon,
        tags: e.tags ?? {}
      }))
      .filter((p: any) => p.lat && p.lon)
      .map((p: NearbyPlace) => ({
        ...p,
        distance: calculateDistance(lat, lon, p.lat, p.lon)
      }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      .slice(0, 30); // Limiter à 30 résultats

    // Mettre en cache
    cache.set(cacheKey, { data: places, timestamp: Date.now() });
    
    return places;
  } catch (error) {
    console.error('Erreur lors de la récupération des lieux:', error);
    return [];
  }
}