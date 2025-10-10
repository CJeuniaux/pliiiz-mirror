export type UserLocation = { lat: number; lng: number; label?: string; countryCode?: string };

const LS_KEY = "pliiiz:userLocation";
const enc = encodeURIComponent;

export function getSavedLocation(): UserLocation | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveLocation(loc: UserLocation) {
  try { 
    localStorage.setItem(LS_KEY, JSON.stringify(loc)); 
  } catch {}
  // Optionnel : push vers l'API profil si dispo
  fetch("/api/me/location", { 
    method:"POST", 
    headers:{"Content-Type":"application/json"}, 
    body: JSON.stringify(loc) 
  }).catch(()=>{});
}

export async function fetchProfileLocation(): Promise<UserLocation | null> {
  try {
    const r = await fetch("/api/me");
    if (!r.ok) return null;
    const me = await r.json();
    if (me?.location?.lat && me?.location?.lng) {
      return { 
        lat: me.location.lat, 
        lng: me.location.lng, 
        label: me.location.label, 
        countryCode: me.location.countryCode 
      };
    }
  } catch {}
  return null;
}

export async function geocodeLabel(q: string, countryHint?: string, locale = "fr"): Promise<UserLocation | null> {
  if (!q?.trim()) return null;
  const params = new URLSearchParams({
    format: "jsonv2",
    q,
    limit: "1",
    "accept-language": locale
  });
  if (countryHint) params.set("countrycodes", countryHint.toLowerCase());
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" }});
    if (!r.ok) return null;
    const d = await r.json();
    if (!d?.[0]) return null;
    return {
      lat: parseFloat(d[0].lat),
      lng: parseFloat(d[0].lon),
      label: d[0].display_name
    };
  } catch {
    return null;
  }
}

export async function geolocGPS(timeoutMs = 10000): Promise<UserLocation | null> {
  if (!("geolocation" in navigator)) {
    console.log('[geolocGPS] Geolocation not supported');
    return null;
  }
  
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const location = { 
          lat: pos.coords.latitude, 
          lng: pos.coords.longitude, 
          label: "Ma position" 
        };
        console.log('[geolocGPS] Position obtained:', location);
        console.log('geo:', location.lat, location.lng); // Debug log as requested
        resolve(location);
      },
      (error) => {
        console.error('[geolocGPS] Geolocation error:', error.message);
        console.log('[geolocGPS] Error code:', error.code);
        resolve(null);
      },
      { 
        enableHighAccuracy: true, 
        timeout: timeoutMs, 
        maximumAge: 5000 
      }
    );
  });
}

export async function geolocIP(): Promise<UserLocation | null> {
  try {
    const r = await fetch("https://ipapi.co/json/");
    if (!r.ok) return null;
    const j = await r.json();
    if (!j?.latitude || !j?.longitude) return null;
    return { 
      lat: j.latitude, 
      lng: j.longitude, 
      label: `${j.city}, ${j.country_name}`, 
      countryCode: j.country_code 
    };
  } catch {
    return null;
  }
}

/** Résout la position utilisateur, en priorisant : URL > sauvegardé (profil/LS) > GPS > IP > null */
import { supabase } from "@/integrations/supabase/client";

// 🔒 Récupère uniquement la zone encodée par l'utilisateur (profil). AUCUN fallback GPS/IP.
export async function getProfileZoneLabelStrict(): Promise<string | undefined> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { console.debug('[getProfileZoneLabelStrict] no user'); return undefined; }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('city, country')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) console.warn('[getProfileZoneLabelStrict] select error', error);
    if (!profile) { console.debug('[getProfileZoneLabelStrict] no profile'); return undefined; }

    const city = profile.city;
    const country = profile.country;

    const parts = [city, country].filter(Boolean);
    if (!parts.length) { console.debug('[getProfileZoneLabelStrict] no parts from profile'); return undefined; }

    const label = parts.join(", ").replace(/\s+/g, " ").trim();
    if (/^ma position/i.test(label)) return undefined; // évite un ancien stockage "Ma position"
    console.debug('[getProfileZoneLabelStrict] label', label);
    return label;
  } catch (e) { console.error('[getProfileZoneLabelStrict] exception', e); return undefined; }
}

export async function getUserDefaultZoneLabelPreferProfile(): Promise<string | undefined> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;

    const { data: profile } = await supabase
      .from('profiles')
      .select('city, country')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      const parts = [
        profile.city, 
        profile.country
      ].filter(Boolean);
      if (parts.length) return parts.join(", ");
    }
  } catch (error) {
    console.log('Error fetching user profile for zone:', error);
  }
  // NE PAS prendre "Ma position" sauvée : on retourne vide → l'UI garde la zone profil vide si absente
  return undefined;
}

export async function getUserDefaultZoneLabel(): Promise<string | undefined> {
  try {
    const r = await fetch("/api/me", { headers: { "Accept": "application/json" } });
    if (!r.ok) return getSavedLocation()?.label || undefined;
    const me = await r.json();
    // on privilégie les champs de profil saisis à l'inscription
    const parts = [
      me?.city || me?.address?.city,
      me?.postalCode || me?.address?.postalCode,
      me?.country || me?.address?.country
    ].filter(Boolean);
    if (parts.length) return parts.join(", ");
    return getSavedLocation()?.label || undefined;
  } catch {
    return getSavedLocation()?.label || undefined;
  }
}

/** Résout la position utilisateur, en priorisant : URL > sauvegardé (profil/LS) > GPS > IP > null */
export async function resolveUserCenter(opts: {
  urlLat?: number; urlLng?: number; near?: string;
}): Promise<UserLocation | null> {
  const { urlLat, urlLng, near } = opts;

  // 1) URL lat/lng
  if (typeof urlLat === "number" && typeof urlLng === "number") {
    const loc = { lat: urlLat, lng: urlLng, label: "Point choisi" };
    saveLocation(loc); 
    return loc;
  }

  // 2) near → géocode (avec hint pays si déjà connu)
  if (near?.trim()) {
    const saved = getSavedLocation() || await fetchProfileLocation();
    const hint = saved?.countryCode; // ex. "BE"
    const geo = await geocodeLabel(near, hint);
    if (geo) { 
      saveLocation(geo); 
      return geo; 
    }
  }

  // 3) position sauvegardée (LS > profil)
  const saved = getSavedLocation() || await fetchProfileLocation();
  if (saved) return saved;

  // 4) GPS (avec consentement)
  const gps = await geolocGPS();
  if (gps) { 
    saveLocation(gps); 
    return gps; 
  }

  // 5) IP approx
  const ip = await geolocIP();
  if (ip) { 
    saveLocation(ip); 
    return ip; 
  }

  // échec → null (on affichera l'UI "Définir ma zone")
  return null;
}