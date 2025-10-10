import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface ContactWithPreviews {
  contact_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  city?: string;
  regift_enabled: boolean;
  birthday?: string;
  preview_urls: string[];
}

export function useContactsWithPreviews() {
  const [contacts, setContacts] = useState<ContactWithPreviews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchContactsWithPreviews = async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_contacts_with_previews');

      if (error) {
        console.error('Error fetching contacts with previews:', error);
        setError('Erreur lors du chargement des contacts');
        return;
      }

      setContacts(data || []);
    } catch (err) {
      console.error('Exception fetching contacts:', err);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactsWithPreviews();
  }, [user]);

  return {
    contacts,
    loading,
    error,
    refetch: fetchContactsWithPreviews
  };
}