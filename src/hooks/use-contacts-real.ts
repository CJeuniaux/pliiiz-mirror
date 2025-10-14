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
      // Charger tous les contacts avec profils associés
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          contact_profile:profiles!contacts_contact_user_id_fkey(
            user_id, first_name, last_name, avatar_url, city, birthday
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Contact[] = (data || []).map((row: any) => ({
        owner_id: row.owner_id,
        user_id: row.contact_user_id,
        display_name: row.alias || 
          (row.contact_profile 
            ? `${row.contact_profile.first_name || ''} ${row.contact_profile.last_name || ''}`.trim()
            : 'Contact'),
        avatar_url: row.contact_profile?.avatar_url,
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
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    fetchContacts();
    
    // Realtime sur contacts
    const contactsChannel = supabase
      .channel('contacts-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'contacts',
        filter: `owner_id=eq.${user.id}`
      }, (payload) => {
        console.log('[Realtime contacts] Change detected:', payload);
        fetchContacts();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(contactsChannel);
    };
  }, [user?.id]);

  return { contacts, loading, refetch: fetchContacts };
}
