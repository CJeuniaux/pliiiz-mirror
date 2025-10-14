// src/lib/maps-launcher.ts
export type MapsTarget = {
  query?: string;          // "fleuriste près de 75011" OU "Sephora Châtelet"
  lat?: number;            // si vous avez une coordonnée
  lng?: number;
};

const enc = encodeURIComponent;
const qOrCoord = ({query, lat, lng}: MapsTarget) =>
  query?.trim() || (typeof lat === "number" && typeof lng === "number" ? `${lat},${lng}` : "");

export function buildMapsLinks(t: MapsTarget) {
  const q = qOrCoord(t);
  const googleWeb  = `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
  const googleAlt  = `https://maps.app.goo.gl/?q=${enc(q)}`;                // souvent moins bloqué
  const googleApp  = `comgooglemaps://?q=${enc(q)}`;                         // app native
  const appleMaps  = `maps://?q=${enc(q)}`;                                  // iOS
  const waze       = `waze://?q=${enc(q)}&navigate=yes`;
  const osm        = `https://www.openstreetmap.org/search?query=${enc(q)}`;
  const embed      = `https://www.google.com/maps?q=${enc(q)}&output=embed`; // iframe-safe
  return { googleWeb, googleAlt, googleApp, appleMaps, waze, osm, embed };
}

/** Ouvre un nouvel onglet si possible, sinon renvoie null (pour déclencher le fallback) */
export function openMapsNewTab(t: MapsTarget): Window | null {
  const { googleAlt, googleWeb } = buildMapsLinks(t);
  // 1) lien court Google (souvent passe)
  let w = window.open(googleAlt, "_blank", "noopener");
  if (w) return w;
  // 2) variante standard
  w = window.open(googleWeb, "_blank", "noopener");
  return w || null;
}