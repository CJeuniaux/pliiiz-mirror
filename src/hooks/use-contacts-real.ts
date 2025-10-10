import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

// Updated Contact type matching new contacts schema/view
export interface Contact {
  owner_id: string;
  user_id: string; // contact user id
  display_name: string;
  avatar_url?: string;
  alias?: string;
  created_at: string;
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  const fetchContacts = async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Use secure function to fetch contacts for the current user
      const { data, error } = await supabase.rpc('get_user_contacts', { user_uuid: user.id });
      if (error) throw error;

      const mapped: Contact[] = (data || []).map((row: any) => ({
        owner_id: row.owner_id,
        user_id: row.user_id,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        alias: row.alias,
        created_at: row.created_at,
      }));
      setContacts(mapped);
    } catch (err) {
      console.error('use-contacts: fetch error', err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user?.id]);

  return { contacts, loading, refetch: fetchContacts };
}
