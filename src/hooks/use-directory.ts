import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface DirectoryProfile {
  user_id: string;
  name: string;
  regift: boolean;
  avatar_url?: string;
  updated_at: string;
}

export function useDirectory() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<DirectoryProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDirectory();
    } else {
      setProfiles([]);
      setLoading(false);
    }
  }, [user]);

  const fetchDirectory = async () => {
    if (!user) return;

    try {
      // Call the security definer function to get directory profiles
      const { data, error } = await supabase
        .rpc('get_directory_profiles')
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching directory:', error);
        return;
      }

      // Transform data to match DirectoryProfile interface
      const transformedData = (data || []).map(profile => ({
        user_id: profile.user_id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utilisateur',
        regift: profile.regift || false,
        avatar_url: profile.avatar_url,
        updated_at: profile.updated_at
      }));

      setProfiles(transformedData);
    } catch (error) {
      console.error('Error fetching directory:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    profiles,
    loading,
    refetch: fetchDirectory
  };
}