// Public Profile v2 - Contrat exhaustif et normalisé
export interface PublicMediaItem {
  id: string;
  kind: 'gift_idea' | 'profile_gallery';
  path: string;
  url: string;
  w: number | null;
  h: number | null;
  created_at: string;
}

export interface PublicProfileV2 {
  user_id: string;
  name: string | null;
  regift: boolean;
  age: number | null;
  city: string | null;
  likes: string[];
  avoid: string[];
  gift_ideas: string[];
  sizes: {
    top: string | null;
    bottom: string | null;
    shoes: string | null;
    ring: string | null;
    other: string | null;
  };
  occasions: {
    brunch: OccasionPreferences;
    cremaillere: OccasionPreferences;
    anniversaire: OccasionPreferences;
    diner_amis: OccasionPreferences;
  };
  media: PublicMediaItem[];
  version: number;
  updated_at: string;
}

export interface OccasionPreferences {
  likes: string[];
  allergies: string[];
  avoid: string[];
  gift_ideas: string[];
}

// Types pour les sources de données
export interface ProfileSource {
  user_id: string;
  profile: {
    name?: string;
    regift?: boolean;
    age?: number;
    city?: string;
  };
  preferences: {
    likes?: string[];
    avoid?: string[];
    gift_ideas?: string[];
    sizes?: {
      top?: string;
      bottom?: string;
      shoes?: string;
      ring?: string;
      other?: string;
    };
  };
  occasions?: Record<'brunch' | 'cremaillere' | 'anniversaire' | 'diner_amis', {
    likes?: string[];
    allergies?: string[];
    avoid?: string[];
    gift_ideas?: string[];
  }>;
  version: number;
  updated_at: string;
}

// Mapping robuste en liste blanche
export function buildPublicPayload(src: ProfileSource): PublicProfileV2 {
  const occ = (key: 'brunch' | 'cremaillere' | 'anniversaire' | 'diner_amis'): OccasionPreferences => ({
    likes: src.occasions?.[key]?.likes ?? [],
    allergies: src.occasions?.[key]?.allergies ?? [],
    avoid: src.occasions?.[key]?.avoid ?? [],
    gift_ideas: src.occasions?.[key]?.gift_ideas ?? []
  });

  return {
    user_id: src.user_id,
    name: src.profile?.name ?? null,
    regift: Boolean(src.profile?.regift ?? false),
    age: src.profile?.age ?? null,
    city: src.profile?.city ?? null,
    likes: src.preferences?.likes ?? [],
    avoid: src.preferences?.avoid ?? [],
    gift_ideas: src.preferences?.gift_ideas ?? [],
    sizes: {
      top: src.preferences?.sizes?.top ?? null,
      bottom: src.preferences?.sizes?.bottom ?? null,
      shoes: src.preferences?.sizes?.shoes ?? null,
      ring: src.preferences?.sizes?.ring ?? null,
      other: src.preferences?.sizes?.other ?? null
    },
    occasions: {
      brunch: occ('brunch'),
      cremaillere: occ('cremaillere'),
      anniversaire: occ('anniversaire'),
      diner_amis: occ('diner_amis')
    },
    media: [], // Default empty array for legacy usage
    version: src.version,
    updated_at: src.updated_at
  };
}

// Utilitaires pour la normalisation des clés d'occasions
export const OCCASION_KEY_MAP: Record<string, string> = {
  'diner-entre-amis': 'diner_amis',
  'cremaillere': 'cremaillere',
  'anniversaires': 'anniversaire',
  'brunch': 'brunch'
};

export function normalizeOccasionKey(originalKey: string): string {
  return OCCASION_KEY_MAP[originalKey] || originalKey.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// Types pour la réconciliation
export interface ReconciliationResult {
  user_id: string;
  miss_name: boolean;
  miss_regift: boolean;
  miss_age: boolean;
  miss_city: boolean;
  miss_likes: boolean;
  miss_avoid: boolean;
  miss_gift_ideas: boolean;
  miss_sizes: boolean;
  miss_occ_brunch: boolean;
  miss_occ_cremaillere: boolean;
  miss_occ_anniversaire: boolean;
  miss_occ_diner_amis: boolean;
  miss_allergies_brunch: boolean;
  miss_allergies_cremaillere: boolean;
  miss_allergies_anniversaire: boolean;
  miss_allergies_diner_amis: boolean;
  diff_payload: boolean;
  missing_fields: string[];
}