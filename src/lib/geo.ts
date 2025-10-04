export type Center = { lat:number; lng:number; label?:string };

const enc = encodeURIComponent;

async function geocodeNear(near: string, locale = "fr"): Promise<Center|null> {
  if (!near?.trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${enc(near)}&limit=1&accept-language=${enc(locale)}`;
  try {
    const r = await fetch(url, { headers: { "Accept":"application/json" } });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d?.[0]) return null;
    return { lat: +d[0].lat, lng: +d[0].lon, label: d[0].display_name };
  } catch {
    return null;
  }
}

async function geolocGPS(): Promise<Center|null> {
  if (!("geolocation" in navigator)) return null;
  return new Promise((res) => {
    navigator.geolocation.getCurrentPosition(
      pos => res({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Ma position" }),
      ()  => res(null),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });
}

async function geolocIP(): Promise<Center|null> {
  try {
    const r = await fetch("https://ipapi.co/json/");
    if (!r.ok) return null;
    const j = await r.json();
    if (!j?.latitude || !j?.longitude) return null;
    return { lat: j.latitude, lng: j.longitude, label: `${j.city}, ${j.country_name}` };
  } catch { 
    return null; 
  }
}

/** Priorité: lat/lng > near > GPS > IP > fallback param */
export async function resolveCenter({ lat, lng, near, fallback = { lat:48.8566, lng:2.3522 } }:
  { lat?:number; lng?:number; near?:string; fallback?:Center }): Promise<Center> {
  if (typeof lat === "number" && typeof lng === "number") return { lat, lng, label: "Point choisi" };
  const fromNear = await geocodeNear(near || "");
  if (fromNear) return fromNear;
  const fromGPS  = await geolocGPS();
  if (fromGPS) return fromGPS;
  const fromIP   = await geolocIP();
  if (fromIP) return fromIP;
  return fallback;
}