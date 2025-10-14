import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PreferenceItem {
  label: string;
  level?: number;
  freeText?: boolean;
}

export interface GlobalPreferences {
  likes?: PreferenceItem[];
  giftIdeas?: PreferenceItem[];
  avoid?: string[];
  allergies?: string[];
  sizes?: Record<string, string>;
  brands?: string[];
}

export interface OccasionPreferences {
  [slug: string]: {
    likes?: PreferenceItem[];
    giftIdeas?: PreferenceItem[];
    avoid?: string[];
    allergies?: string[];
  };
}

export interface PublicMediaItem {
  id: string;
  kind: 'gift_idea' | 'profile_gallery';
  path: string;
  url: string;
  w: number | null;
  h: number | null;
  created_at: string;
}

export interface PublicProfileEnhanced {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  avatar_url_public?: string;
  bio?: string;
  birthday?: string;
  city?: string;
  country?: string;
  wishlist: string[];
  food_prefs: string[];
  style_prefs: string[];
  dislikes: string[];
  allergies: string[];
  regift_enabled: boolean;
  regift_note?: string;
  global_preferences: GlobalPreferences;
  occasion_prefs: OccasionPreferences;
  media?: PublicMediaItem[];
  updated_at: string;
}


export function usePublicProfileEnhanced(userId: string) {
  const [profile, setProfile] = useState<PublicProfileEnhanced | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchPublicProfile();
    }
  }, [userId]);

  const fetchPublicProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // 1) Tenter la vue consolidée v2
      const { data: sourceData, error: sourceError } = await supabase
        .from('v_public_profile_source')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!sourceError && sourceData) {
        // Construction du payload v2 via la fonction SQL
        const { data, error } = await supabase.rpc('build_public_payload_v2', {
          source_row: sourceData as any
        });

        if (!error && data) {
          // Le payload v2 est déjà structuré, on adapte pour l'interface existante
          const payload = data as any;
          const norm = (v: any): string[] => Array.isArray(v) ? v.map((x) => String(x)) : [];
          
          // Fonction pour normaliser les préférences avec fallback level = 2
          const normalizePreferenceItems = (items: any[]): PreferenceItem[] => {
            if (!Array.isArray(items)) return [];
            return items.map(item => {
              if (typeof item === 'string') {
                return { label: item, level: 2, freeText: true } as PreferenceItem;
              } else if (typeof item === 'object' && item !== null) {
                return { ...(item as any), level: (item as any).level ?? 2 } as PreferenceItem;
              }
              return { label: String(item), level: 2, freeText: true } as PreferenceItem;
            });
          };

          // Adaptation du payload v2 vers l'interface legacy
          const globalPrefs: GlobalPreferences = {
            likes: normalizePreferenceItems(payload.likes || []),
            giftIdeas: normalizePreferenceItems(payload.gift_ideas || []),
            avoid: norm(payload.avoid || []),
            allergies: norm([]), // Les allergies sont maintenant dans les occasions
            sizes: payload.sizes || {},
            brands: norm(payload.brands || [])
          };

          // Adaptation des occasions v2 vers l'interface legacy
          const occasionPrefs: OccasionPreferences = {};
          if (payload.occasions && typeof payload.occasions === 'object') {
            Object.keys(payload.occasions).forEach(slug => {
              const occasion = payload.occasions[slug];
              if (occasion && typeof occasion === 'object') {
                occasionPrefs[slug] = {
                  likes: normalizePreferenceItems(occasion.likes || []),
                  giftIdeas: normalizePreferenceItems(occasion.gift_ideas || []),
                  avoid: norm(occasion.avoid || []),
                  allergies: norm(occasion.allergies || [])
                };
              }
            });
          }

          // Essayer de récupérer avatar_url depuis profiles si pas dans v2
          let avatarUrl: string | undefined = undefined;
          let avatarUrlPublic: string | undefined = undefined;
          
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('user_id', payload.user_id)
              .single();
            avatarUrl = profileData?.avatar_url || undefined;
            
            // Generate displayable avatar URL
            if (avatarUrl) {
              const { data: avatarData } = await supabase.functions.invoke('public-profile-avatar', {
                body: { avatar_url: avatarUrl }
              });
              avatarUrlPublic = avatarData?.avatar_url_public || undefined;
            }
          } catch (e) {
            console.warn('[usePublicProfileEnhanced] Could not fetch avatar_url from profiles:', e);
          }

          const normalized: PublicProfileEnhanced = {
            user_id: payload.user_id,
            display_name: payload.name || 'Utilisateur',
            avatar_url: avatarUrl, // Récupéré depuis profiles
            avatar_url_public: avatarUrlPublic, // URL affichable
            bio: undefined, // Non disponible dans v2
            birthday: undefined, // Non disponible dans v2 
            city: payload.city || undefined,
            country: undefined, // Non disponible dans v2
            wishlist: norm(payload.likes || []), // Mapping likes -> wishlist
            food_prefs: norm(payload.likes || []), // Mapping likes -> food_prefs
            style_prefs: norm(payload.likes || []), // Mapping likes -> style_prefs
            dislikes: norm(payload.avoid || []), // Mapping avoid -> dislikes
            allergies: norm([]), // Allergies maintenant dans occasions
            regift_enabled: !!payload.regift,
            regift_note: undefined, // Non disponible dans v2
            global_preferences: globalPrefs,
            occasion_prefs: occasionPrefs,
            media: payload.media || [],
            updated_at: payload.updated_at,
          };
          setProfile(normalized);
          return;
        }
      }

      // 2) Fallback sécurisé: RPC get_public_profile_secure (inclut avatar_url)
      const { data: secureRows, error: secureError } = await supabase.rpc('get_public_profile_secure', {
        profile_user_id: userId
      });

      if (secureError || !secureRows || secureRows.length === 0) {
        console.error('Error fetching secure public profile:', secureError);
        setError(secureError?.message || 'Profil non partagé ou indisponible');
        setProfile(null);
        return;
      }

      const row = secureRows[0] as any;
      
      // Generate displayable avatar URL for secure fallback
      let avatarUrlPublic: string | undefined = undefined;
      if (row.avatar_url) {
        try {
          const { data: avatarData } = await supabase.functions.invoke('public-profile-avatar', {
            body: { avatar_url: row.avatar_url }
          });
          avatarUrlPublic = avatarData?.avatar_url_public || undefined;
        } catch (e) {
          console.warn('[usePublicProfileEnhanced] Could not generate avatar_url_public:', e);
        }
      }
      
      const norm = (v: any): string[] => Array.isArray(v) ? v.map((x) => String(x)) : [];
      const normalizePreferenceItems = (items: any[]): PreferenceItem[] => {
        if (!Array.isArray(items)) return [];
        return items.map(item => {
          if (typeof item === 'string') return { label: item, level: 2, freeText: true } as PreferenceItem;
          if (typeof item === 'object' && item !== null) return { ...(item as any), level: (item as any).level ?? 2 } as PreferenceItem;
          return { label: String(item), level: 2, freeText: true } as PreferenceItem;
        });
      };

      const gp = (row.global_preferences || {}) as any;
      const globalPrefs: GlobalPreferences = {
        likes: normalizePreferenceItems(gp.likes || []),
        giftIdeas: normalizePreferenceItems(gp.giftIdeas || gp.gift_ideas || []),
        avoid: norm(gp.avoid || row.dislikes || []),
        allergies: norm(gp.allergies || row.allergies || []),
        sizes: gp.sizes || {},
        brands: norm(gp.brands || [])
      };

      const occasionPrefs: OccasionPreferences = (row.occasion_prefs || {}) as any;

      const normalized: PublicProfileEnhanced = {
        user_id: row.user_id,
        display_name: row.display_name || 'Utilisateur',
        avatar_url: row.avatar_url || undefined,
        avatar_url_public: avatarUrlPublic,
        bio: undefined, // Bio not available in current schema
        birthday: row.birthday || undefined,
        city: row.city || undefined,
        country: row.country || undefined,
        wishlist: norm(row.wishlist || []),
        food_prefs: norm(row.food_prefs || []),
        style_prefs: norm(row.style_prefs || []),
        dislikes: norm(row.dislikes || []),
        allergies: norm(row.allergies || []),
        regift_enabled: !!row.regift_enabled,
        regift_note: undefined, // Regift note not available in current schema
        global_preferences: globalPrefs,
        occasion_prefs: occasionPrefs,
        media: [], // Fallback pour compatibilité
        updated_at: row.updated_at,
      };
      setProfile(normalized);
    } catch (error) {
      console.error('Error fetching public profile:', error);
      setError('Erreur lors du chargement du profil');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    refetch: fetchPublicProfile
  };
}