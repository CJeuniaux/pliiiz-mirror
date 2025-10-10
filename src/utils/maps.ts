// utils/maps.ts
export function buildMapsSearchUrl(name?: string, opts?: { city?: string; country?: string }) {
  const base = (name ?? '').trim();
  const full = [base, opts?.city, opts?.country].filter(Boolean).join(' ').trim();
  const q = encodeURIComponent(full || 'cadeau');
  // format officiel Maps URLs
  return `https://www.google.com/maps/search/?api=1&query=${q}&hl=fr`;
}