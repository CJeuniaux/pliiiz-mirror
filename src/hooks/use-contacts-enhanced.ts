import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

interface Contact {
  id: string;
  owner_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  alias?: string;
  created_at: string;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchContacts = async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Use the new security definer function
      const { data, error } = await supabase
        .rpc('get_user_contacts', { user_uuid: user.id });

      if (error) {
        console.error('Error fetching contacts:', error);
        setContacts([]);
      } else {
        const mappedContacts = (data || []).map((item: any) => ({
          id: item.user_id, // Use user_id as id for consistency
          owner_id: item.owner_id,
          user_id: item.user_id,
          display_name: item.display_name,
          avatar_url: item.avatar_url,
          alias: item.alias,
          created_at: item.created_at
        }));
        setContacts(mappedContacts);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
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
    refetch: fetchContacts
  };
}