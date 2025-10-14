import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SignupV2Request {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
  city?: string;
  country?: string;
  birthday?: string;
}

export interface SignupV2Response {
  user_id: string;
  first_name: string;
  email: string;
  needs_confirmation: boolean;
}

export interface SavePreferencesV2Request {
  global_preferences?: {
    likes?: string[];
    avoid?: string[];
    giftIdeas?: string[];
    sizes?: {
      top?: string;
      bottom?: string;
      shoes?: string;
      ring?: string;
      other?: string;
    };
    allergies?: string[];
  };
  
  occasion_prefs?: {
    brunch?: {
      likes?: string[];
      allergies?: string[];
      avoid?: string[];
      gift_ideas?: string[];
    };
    cremaillere?: {
      likes?: string[];
      allergies?: string[];
      avoid?: string[];
      gift_ideas?: string[];
    };
    anniversaire?: {
      likes?: string[];
      allergies?: string[];
      avoid?: string[];
      gift_ideas?: string[];
    };
    diner_amis?: {
      likes?: string[];
      allergies?: string[];
      avoid?: string[];
      gift_ideas?: string[];
    };
  };
}

export interface UnsplashGiftImageRequest {
  idea_text: string;
  category?: string;
  occasion?: string;
  per_page?: number;
}

export interface UnsplashGiftImageResponse {
  cached: boolean;
  image: {
    id: string;
    url: string;
    url_small?: string;
    author: string;
    author_url?: string;
    unsplash_url?: string;
    description?: string;
    source: string;
  } | null;
  query_used?: string;
  total_results?: number;
  relevance_score?: number;
  message?: string;
  suggestion?: string;
}

// Hook pour la nouvelle API d'inscription V2
export function useSignupV2() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = async (data: SignupV2Request): Promise<SignupV2Response | null> => {
    setLoading(true);
    setError(null);

    try {
      // Générer une clé d'idempotence unique
      const idempotencyKey = `signup_${data.email}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('[SignupV2] Starting signup for:', data.email);

      const { data: response, error: fnError } = await supabase.functions.invoke('auth-signup-v2', {
        body: data,
        headers: {
          'idempotency-key': idempotencyKey
        }
      });

      if (fnError) {
        console.error('[SignupV2] Function error:', fnError);
        throw new Error(fnError.message || 'Signup failed');
      }

      if (response.error) {
        console.error('[SignupV2] Response error:', response);
        setError(response.error);
        
        if (response.code === 'EMAIL_ALREADY_EXISTS') {
          toast.error('Cette adresse email est déjà utilisée');
        } else {
          toast.error(response.error);
        }
        return null;
      }

      console.log('[SignupV2] Success:', response);
      
      if (response.needs_confirmation) {
        toast.success('Compte créé ! Vérifiez votre email pour confirmer votre compte.');
      } else {
        toast.success('Compte créé avec succès !');
      }

      return response as SignupV2Response;

    } catch (error: any) {
      console.error('[SignupV2] Error:', error);
      const errorMessage = error.message || 'Erreur lors de la création du compte';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { signUp, loading, error };
}

// Hook pour la nouvelle API de sauvegarde des préférences V2 - utilise RPC
export function useSavePreferencesV2() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePreferences = async (preferences: SavePreferencesV2Request): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      console.log('[SavePrefsV2] Starting save preferences via RPC for user:', user.user.id);

      // Build updates payload for profiles table (new system)
      const updates = {
        global_preferences: {
          likes: preferences.global_preferences?.likes || [],
          avoid: preferences.global_preferences?.avoid || [],
          giftIdeas: preferences.global_preferences?.giftIdeas || [],
          sizes: preferences.global_preferences?.sizes || {},
          allergies: preferences.global_preferences?.allergies || []
        },
        occasion_prefs: preferences.occasion_prefs || {}
      };

      const { error: rpcError } = await supabase.rpc('safe_upsert_profile' as any, {
        p_user_id: user.user.id,
        p_updates: updates
      });

      if (rpcError) {
        console.error('[SavePrefsV2] RPC error:', rpcError);
        throw new Error(rpcError.message);
      }

      console.log('[SavePrefsV2] Success via RPC');
      toast.success('Préférences sauvegardées avec succès !');
      return true;

    } catch (error: any) {
      console.error('[SavePrefsV2] Error:', error);
      const errorMessage = error.message || 'Erreur lors de la sauvegarde';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { savePreferences, loading, error };
}

// Hook pour récupérer des images d'idées cadeaux via Unsplash
export function useUnsplashGiftImages() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getGiftImage = async (request: UnsplashGiftImageRequest): Promise<UnsplashGiftImageResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('[UnsplashGiftImages] Fetching image for:', request.idea_text);

      const { data: response, error: fnError } = await supabase.functions.invoke('unsplash-gift-ideas', {
        body: request
      });

      if (fnError) {
        console.error('[UnsplashGiftImages] Function error:', fnError);
        throw new Error(fnError.message || 'Failed to fetch gift image');
      }

      if (response.error) {
        console.error('[UnsplashGiftImages] Response error:', response);
        setError(response.error);
        return null;
      }

      console.log('[UnsplashGiftImages] Success:', response.cached ? 'from cache' : 'from API');
      return response as UnsplashGiftImageResponse;

    } catch (error: any) {
      console.error('[UnsplashGiftImages] Error:', error);
      const errorMessage = error.message || 'Erreur lors de la récupération de l\'image';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { getGiftImage, loading, error };
}