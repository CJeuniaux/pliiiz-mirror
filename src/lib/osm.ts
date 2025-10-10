// src/lib/osm.ts
export type OSMTarget = { query?: string; lat?: number; lng?: number };

const enc = encodeURIComponent;

export async function geocode(query: string, locale = "fr"): Promise<{lat:number; lng:number; label:string} | null> {
  if (!query?.trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${enc(query)}&limit=1&accept-language=${enc(locale)}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || !data[0]) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
}

export function buildOsmEmbed(lat: number, lng: number, zoom = 15) {
  const d = 0.01 / Math.pow(2, (zoom - 12));
  const bbox = [lng - d, lat - d, lng + d, lat + d].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export function buildExternalLinks(t: OSMTarget) {
  const q = t.query?.trim() || (t.lat!=null && t.lng!=null ? `${t.lat},${t.lng}` : "");
  return {
    osm:  `https://www.openstreetmap.org/search?query=${enc(q)}`,
    apple:`https://maps.apple.com/?q=${enc(q)}`,
    waze: `https://waze.com/ul?q=${enc(q)}&navigate=yes`,
    gmaps:`https://maps.google.com/?q=${enc(q)}`,
  };
}

export function buildPoiExternalLinks(poi: {lat:number; lng:number; name?:string}){
  const {lat,lng,name} = poi;
  const label = enc(name || `${lat},${lng}`);
  return {
    osm:  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`,
    apple:`https://maps.apple.com/?q=${label}&ll=${lat},${lng}`,
    waze: `https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`,
    gmaps:`https://maps.google.com/?q=${label}&ll=${lat},${lng}&z=17`,
  };
}