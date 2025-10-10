import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface AcceptedContact {
  id: string;
  fullName: string;
  avatarUrl?: string;
  age?: number;
  city?: string;
}

export function useAcceptedContacts() {
  const [contacts, setContacts] = useState<AcceptedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAcceptedContacts = async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use security definer RPC to fetch all public/accepted profiles
      const { data, error: rpcError } = await supabase
        .rpc('get_public_profiles');

      if (rpcError) {
        console.error('Error fetching contacts via RPC:', rpcError);
        setError('Failed to load connections');
        setContacts([]);
        return;
      }

      // Filter out self and map to AcceptedContact
      const contactsList: AcceptedContact[] = (data || [])
        .filter((u: any) => u.user_id !== user.id)
        .map((u: any) => {
          // age is not directly returned; optional
          return {
            id: u.user_id,
            fullName: u.display_name,
            avatarUrl: u.avatar_url || undefined,
            age: undefined,
            city: undefined,
          };
        })
        .sort((a, b) => a.fullName.toLocaleLowerCase().localeCompare(b.fullName.toLocaleLowerCase()));

      setContacts(contactsList);

    } catch (err) {
      console.error('Error in fetchAcceptedContacts:', err);
      setError('Technical error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcceptedContacts();
  }, [user]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('accepted-contacts-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
        },
        (payload) => {
          if (payload.new.status === 'accepted') {
            fetchAcceptedContacts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    contacts,
    loading,
    error,
    refetch: fetchAcceptedContacts
  };
}