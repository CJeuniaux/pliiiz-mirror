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
      // Get my existing contacts first
      const { data: myContacts } = await supabase
        .from('contacts')
        .select('contact_user_id')
        .eq('owner_id', user.id);

      const contactIds = (myContacts || []).map(c => c.contact_user_id);

      // Call the security definer function to get directory profiles
      const { data, error } = await supabase
        .rpc('get_directory_profiles')
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching directory:', error);
        return;
      }

      // Transform data to match DirectoryProfile interface and filter out existing contacts and self (robust to id/user_id)
      const transformedData: DirectoryProfile[] = (data || [])
        .map((profile: any) => {
          const uid = profile.user_id || profile.id; // fallback if rpc returns id instead of user_id
          return {
            user_id: uid,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utilisateur',
            regift: profile.regift || profile.regift_enabled || false,
            avatar_url: profile.avatar_url,
            updated_at: profile.updated_at
          } as DirectoryProfile;
        })
        .filter((p) => !!p.user_id && p.user_id !== user.id && !contactIds.includes(p.user_id));

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