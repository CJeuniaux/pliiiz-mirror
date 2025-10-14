/**
 * Utilities for robust avatar handling in public profiles
 */

export interface AvatarSource {
  avatar_url?: string | null;
  avatar_url_public?: string | null;
  avatarUrl?: string | null;
  photoUrl?: string | null;
  avatar?: { url?: string | null };
}

/**
 * Robustly pick the best available avatar URL from multiple possible sources
 */
export function pickAvatarUrl(source: AvatarSource): string | null {
  // Try different possible field names in order of preference
  const candidates = [
    source?.avatar_url_public,  // Public URL (preferred)
    source?.avatar_url,         // Standard URL
    source?.avatarUrl,          // Alternative naming
    source?.photoUrl,           // Social login
    source?.avatar?.url         // Nested object
  ];

  // Return first non-empty, non-null URL
  for (const url of candidates) {
    if (url && typeof url === 'string' && url.trim()) {
      return url.trim();
    }
  }

  return null;
}

/**
 * Generate initials from a display name
 */
export function generateInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'U';
  
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  
  return trimmed
    .split(/\s+/)           // Split by whitespace
    .slice(0, 2)            // Take first 2 words max
    .map(word => word.charAt(0)?.toUpperCase() || '') // First letter of each word
    .join('')              // Join together
    || 'U';               // Fallback to 'U' if empty
}

/**
 * Check if an avatar URL appears to be valid/displayable
 */
export function isValidAvatarUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const trimmed = url.trim();
  
  // Must be a proper URL
  try {
    new URL(trimmed);
  } catch {
    return false;
  }
  
  // Should contain common image indicators
  const lowerUrl = trimmed.toLowerCase();
  return (
    lowerUrl.includes('/storage/') ||     // Supabase storage
    lowerUrl.includes('avatar') ||        // Avatar in path
    lowerUrl.includes('.jpg') ||          // Image extensions
    lowerUrl.includes('.jpeg') ||
    lowerUrl.includes('.png') ||
    lowerUrl.includes('.webp') ||
    lowerUrl.includes('.gif')
  );
}