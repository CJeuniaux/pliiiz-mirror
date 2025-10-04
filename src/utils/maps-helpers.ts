/**
 * Generate a Google Maps search URL for an item with location context
 */
export function mapsSearchUrlFromLabel(
  label: string, 
  city?: string, 
  lat?: number, 
  lng?: number
): string {
  const base = 'https://www.google.com/maps/search/?api=1&query=';
  
  // Build query with best available location context
  const q = lat && lng
    ? `${label} @ ${lat},${lng}`
    : city
      ? `${label} near ${city}`
      : label;
  
  // Add UTM tracking parameters
  const url = `${base}${encodeURIComponent(q)}&utm_source=pliiiz&utm_medium=offer&utm_campaign=item`;
  
  return url;
}

/**
 * Open Google Maps search for an item in a new tab
 */
export function openMapsSearch(
  label: string,
  city?: string,
  lat?: number,
  lng?: number
): void {
  const url = mapsSearchUrlFromLabel(label, city, lat, lng);
  window.open(url, '_blank', 'noopener,noreferrer');
}