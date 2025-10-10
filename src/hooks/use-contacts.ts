import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

// Keep legacy Contact shape for compatibility with UI components
export interface Contact {
  id: string; // using contact user_id as id
  first_name: string;
  last_name?: string;
  relation?: string;
  notes?: string;
  created_at: string;
}

export function useContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContacts();
    } else {
      setContacts([]);
      setLoading(false);
    }
  }, [user?.id]);

  const fetchContacts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Use secure function to read contacts with profile info
      const { data, error } = await supabase.rpc('get_user_contacts', { user_uuid: user.id });
      if (error) throw error;

      const mapped: Contact[] = (data || []).map((row: any) => {
        const parts = (row.display_name || '').trim().split(' ');
        const first = parts.shift() || 'Contact';
        const last = parts.join(' ') || '';
        return {
          id: row.user_id,
          first_name: first,
          last_name: last || undefined,
          created_at: row.created_at,
          relation: undefined,
          notes: undefined,
        } as Contact;
      });

      setContacts(mapped);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  // Legacy mutations are disabled with new contacts flow (created automatically on request acceptance)
  const addContact = async () => {
    toast.info('Ajout manuel de contact désactivé (géré via demandes acceptées)');
    return undefined as any;
  };

  const updateContact = async () => {
    toast.info('Mise à jour de contact non disponible');
    return undefined as any;
  };

  const deleteContact = async () => {
    toast.info('Suppression de contact non disponible');
    return undefined as any;
  };

  return {
    contacts,
    loading,
    addContact,
    updateContact,
    deleteContact,
    refetch: fetchContacts,
  };
}
