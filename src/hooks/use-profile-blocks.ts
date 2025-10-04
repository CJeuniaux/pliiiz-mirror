import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProfileBlocks } from '@/lib/profile-common';

export async function selectProfileBlocks(userId: string, sb = supabase): Promise<ProfileBlocks> {
  const currentUser = await sb.auth.getUser();
  console.info('[selectProfileBlocks]', { 
    userId, 
    requestingUser: currentUser.data.user?.id,
    isOwnProfile: currentUser.data.user?.id === userId 
  });

  const { data, error } = await sb
    .from('preferences')
    .select('likes, dislikes, allergies, current_wants, sizes')
    .eq('user_id', userId)
    .maybeSingle();
    
  // Also get occasion preferences from profiles table
  const { data: profileData } = await sb
    .from('profiles')
    .select('occasion_prefs')
    .eq('user_id', userId)
    .maybeSingle();
    
  if (error) {
    console.error('[selectProfileBlocks] Error fetching preferences:', error);
    throw error;
  }
  
  console.info('[selectProfileBlocks] Preferences data:', data);
  
  return {
    likes: data?.likes || [],
    dislikes: data?.dislikes || [],
    allergies: data?.allergies || [],
    wants: data?.current_wants || [],
    sizes: data?.sizes || {},
    tastesByEvent: profileData?.occasion_prefs || {}
  };
}

export function useProfileBlocks(userId?: string) {
  const [blocks, setBlocks] = useState<ProfileBlocks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setBlocks(null);
      setLoading(false);
      return;
    }

    selectProfileBlocks(userId, supabase)
      .then(setBlocks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return { blocks, loading, error };
}