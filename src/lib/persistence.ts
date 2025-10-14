// src/lib/persistence.ts
import { supabase } from '@/integrations/supabase/client';
import { requireSession } from './supabase-helpers';
import { patchPreferencesDeep } from './preferences-api';

export type PreferencesPatch = {
  likes: string[];
  avoid: string[];
  allergies: string[];
  gift_ideas: string[];
  brands: string[];
  sizes: Record<string, string>;
};

export async function getUserId(): Promise<string> {
  // Utiliser requireSession pour vérifier la session
  const session = await requireSession();
  return session.user.id;
}

export async function ensureProfileByUserId(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function saveGlobalPreferences(patch: PreferencesPatch) {
  const userId = await getUserId();
  await ensureProfileByUserId(userId);

  // Utiliser la nouvelle fonction patchPreferencesDeep avec gestion d'erreurs
  await patchPreferencesDeep(userId, patch);

  console.log('✅ saveGlobalPreferences OK', { userId, patch });
}

export type ProfileUpdate = {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  city?: string | null;
  country?: string | null;
  birthday?: string | null; // ISO date
  
  avatar_url?: string | null;
  avatar_url_public?: string | null;
  regift_enabled?: boolean | null;
  regift_note?: string | null;
};

export async function saveProfile(update: ProfileUpdate) {
  const userId = await getUserId();
  await ensureProfileByUserId(userId);

  // Clean empty strings to null
  const cleanedUpdate: Record<string, any> = {};
  for (const [key, value] of Object.entries(update)) {
    if (value === '') {
      cleanedUpdate[key] = null;
    } else {
      cleanedUpdate[key] = value;
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update(cleanedUpdate)
    .eq('user_id', userId); // CRUCIAL: filtrer par user_id
    
  if (error) {
    console.error('[saveProfile] Error:', error);
    throw new Error(`Échec de la mise à jour du profil: ${error.message}`);
  }

  console.log('✅ saveProfile OK', { userId, update: cleanedUpdate });
}

// dans src/lib/persistence.ts
export async function debugLogUserId(label = 'debug') {
  const { data, error } = await supabase.auth.getUser();
  if (error) console.error('[auth] error', error);
  const id = data?.user?.id ?? null;
  console.log(`[${label}] userId =`, id);
  return id;
}

