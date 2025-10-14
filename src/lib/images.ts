/**
 * Gestion optimisée des images via CDN Supabase
 * Transformations on-the-fly + cache-busting par hash de contenu
 */

export type ImageSize = 'avatar_s' | 'avatar_m' | 'card' | 'social' | 'original';

const TRANSFORMS: Record<ImageSize, string | null> = {
  avatar_s: 'width=64&height=64&resize=cover&format=webp',
  avatar_m: 'width=128&height=128&resize=cover&format=webp',
  card: 'width=512&height=512&resize=cover&format=webp',
  social: 'width=1200&height=630&resize=cover&format=webp',
  original: null, // pas de transformation
};

/**
 * Génère une URL d'image avec transformation CDN et cache-busting
 */
export function makeImageUrl(
  basePublicUrl: string,
  size: ImageSize,
  versionTag: string | number
): string {
  const transform = TRANSFORMS[size];
  
  if (!transform) {
    // Pas de transformation, juste cache-busting
    const joiner = basePublicUrl.includes('?') ? '&' : '?';
    return `${basePublicUrl}${joiner}v=${versionTag}`;
  }
  
  const joiner = basePublicUrl.includes('?') ? '&' : '?';
  return `${basePublicUrl}${joiner}${transform}&v=${versionTag}`;
}

export interface AvatarUrls {
  s: string;      // 64x64
  m: string;      // 128x128
  card: string;   // 512x512
  social: string; // 1200x630 (Open Graph)
  original: string;
  version: string;
  blurhash?: string;
  dominant?: string;
}

export interface ProfileWithAvatar {
  avatar_path?: string | null;
  avatar_url?: string | null;
  avatar_hash?: string | null;
  avatar_version?: number | null;
  avatar_blurhash?: string | null;
  avatar_dominant?: string | null;
}

/**
 * Construit toutes les URLs d'avatar avec transformations CDN
 */
export function buildAvatarUrls(
  profile: ProfileWithAvatar,
  baseBucketUrl: string = 'https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/avatars'
): AvatarUrls | null {
  // Extraire le path depuis avatar_url si avatar_path n'existe pas
  let avatarPath = profile?.avatar_path;
  
  if (!avatarPath && profile?.avatar_url) {
    const match = profile.avatar_url.match(/\/avatars\/(.+?)(?:\?|$)/);
    if (match) {
      avatarPath = match[1];
    }
  }
  
  if (!avatarPath) return null;

  // Version de cache-busting : hash préféré, sinon version incrémentale
  const version = profile.avatar_hash || String(profile.avatar_version ?? 0);
  const baseUrl = `${baseBucketUrl}/${avatarPath}`;

  return {
    s: makeImageUrl(baseUrl, 'avatar_s', version),
    m: makeImageUrl(baseUrl, 'avatar_m', version),
    card: makeImageUrl(baseUrl, 'card', version),
    social: makeImageUrl(baseUrl, 'social', version),
    original: makeImageUrl(baseUrl, 'original', version),
    version,
    blurhash: profile.avatar_blurhash ?? undefined,
    dominant: profile.avatar_dominant ?? undefined,
  };
}

/**
 * Extrait le path depuis une URL Supabase Storage
 */
export function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Match pattern: /storage/v1/object/public/{bucket}/{path}
  const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+?)(?:\?|$)/);
  return match ? match[1] : null;
}

/**
 * Génère une URL de placeholder en data URI à partir de la couleur dominante
 */
export function generatePlaceholderDataUrl(dominant: string = '#e5e7eb'): string {
  // SVG simple avec couleur de fond
  const svg = `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="${dominant}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
