import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface MyContact {
  owner_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  birthday?: string | null;
  city?: string | null;
  wishlist: string[];
  regift_enabled: boolean;
  wishlist_top3?: string[];
}

export function useMyContacts() {
  const [contacts, setContacts] = useState<MyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchContacts = async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch all accepted requests where user is either sender or receiver
      const { data: acceptedRequests, error: requestsError } = await supabase
        .from('requests')
        .select('id, from_user_id, to_user_id, status, created_at, message')
        .eq('status', 'accepted')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

      if (requestsError) {
        console.error('Error fetching accepted requests:', requestsError);
        setError('requests');
        setContacts([]);
        setLoading(false);
        return;
      }

      // Extract unique contact user IDs (the "other" user in each request)
      const contactUserIds = (acceptedRequests || []).map(req => 
        req.from_user_id === user.id ? req.to_user_id : req.from_user_id
      ).filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

      if (contactUserIds.length === 0) {
        setContacts([]);
        setLoading(false);
        return;
      }

      // Fetch profile data for these contact users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name, avatar_url, regift_enabled, birthday, city')
        .in('user_id', contactUserIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setError('profiles');
      }

      // Fetch preferences data
      const { data: prefs, error: prefsError } = await supabase
        .from('preferences')
        .select('user_id, current_wants, likes, dislikes, allergies')
        .in('user_id', contactUserIds);

      if (prefsError) {
        console.error('Error fetching preferences:', prefsError);
        setError('preferences');
      }

      // Create contact objects
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const prefMap = new Map((prefs || []).map((p: any) => [p.user_id, p]));
      
      const contactsList = contactUserIds.map(userId => {
        const profile = profileMap.get(userId);
        const preferences = prefMap.get(userId);
        
        return {
          owner_id: user.id,
          user_id: userId,
          display_name: profile?.display_name || 
                       `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 
                       'Contact',
          avatar_url: profile?.avatar_url,
          regift_enabled: profile?.regift_enabled || false,
          birthday: profile?.birthday || null,
          city: profile?.city || null,
          wishlist: preferences?.current_wants || preferences?.likes || [],
          wishlist_top3: (preferences?.current_wants || preferences?.likes || []).slice(0, 3),
        };
      });

      // Sort by display_name ascending (case-insensitive)
      contactsList.sort((a, b) => a.display_name.toLocaleLowerCase().localeCompare(b.display_name.toLocaleLowerCase()));

      setContacts(contactsList);
    } catch (error) {
      console.error('Error fetching accepted contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  return {
    contacts,
    loading,
    error,
    refetch: fetchContacts
  };
}