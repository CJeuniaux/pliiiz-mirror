/**
 * Normalise l'affichage des valeurs en affichant "non renseigné" pour les valeurs vides
 */
export function prettyValue(v: unknown): string {
  if (v == null) return 'non renseigné';
  if (typeof v === 'string') return v.trim() === '' ? 'non renseigné' : v;
  if (Array.isArray(v)) return v.length ? v.map(String).join(', ') : 'non renseigné';
  if (typeof v === 'object') return Object.keys(v as object).length ? JSON.stringify(v) : 'non renseigné';
  return String(v);
}

/**
 * Formate spécifiquement les tableaux pour l'affichage avec des badges
 */
export function prettyArray(arr: unknown[] | null | undefined): string[] {
  if (!Array.isArray(arr) || arr.length === 0) {
    return ['non renseigné'];
  }
  return arr.map(item => String(item)).filter(Boolean);
}

/**
 * Sanitise les listes de préférences pour s'assurer qu'elles sont des tableaux de strings
 */
export function sanitizePrefList(v: any): string[] {
  if (Array.isArray(v)) return v.map(x => typeof x === 'string' ? x : x?.label ?? String(x)).filter(Boolean);
  if (v == null) return [];
  if (typeof v === 'object') return Object.values(v).map(x => String(x)).filter(Boolean);
  return String(v).trim() ? [String(v)] : [];
}

/**
 * Formate les objets de tailles pour l'affichage
 */
export function prettySizes(sizes: any): string[] {
  if (!sizes || typeof sizes !== 'object' || Object.keys(sizes).length === 0) {
    return ['non renseigné'];
  }
  
  const sizeLabels: string[] = [];
  
  if (sizes.top) sizeLabels.push(`Haut: ${sizes.top}`);
  if (sizes.bottom) sizeLabels.push(`Bas: ${sizes.bottom}`);
  if (sizes.shoes) sizeLabels.push(`Pointure: ${sizes.shoes}`);
  if (sizes.ring) sizeLabels.push(`Bague: ${sizes.ring}`);
  if (sizes.other) sizeLabels.push(`Autre: ${sizes.other}`);
  
  return sizeLabels.length > 0 ? sizeLabels : ['non renseigné'];
}