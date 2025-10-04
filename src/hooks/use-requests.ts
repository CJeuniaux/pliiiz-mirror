import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

export interface AccessRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  event_id?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export function useRequests() {
  const { user } = useAuth();
  const [sentRequests, setSentRequests] = useState<AccessRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequests();
    } else {
      setSentRequests([]);
      setReceivedRequests([]);
      setLoading(false);
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      console.log('[useRequests] Fetching requests for user:', user.id);
      
      // Requêtes envoyées
      const { data: sent, error: sentError } = await supabase
        .from('requests')
        .select('*')
        .eq('from_user_id', user.id)
        .order('created_at', { ascending: false });

      // Requêtes reçues
      const { data: received, error: receivedError } = await supabase
        .from('requests')
        .select('*')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('[useRequests] Sent requests:', sent);
      console.log('[useRequests] Received requests:', received);
      console.log('[useRequests] Errors:', { sentError, receivedError });

      if (sentError || receivedError) {
        console.error('Error fetching requests:', sentError || receivedError);
        return;
      }

      setSentRequests((sent || []) as AccessRequest[]);
      setReceivedRequests((received || []) as AccessRequest[]);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (toUserId: string, message?: string, eventId?: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('requests')
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          message,
          event_id: eventId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        toast.error('Erreur lors de l\'envoi');
        return { error };
      }

      setSentRequests(prev => [data as AccessRequest, ...prev]);
      toast.success('Demande envoyée');
      return { data };
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
      return { error };
    }
  };

  const updateRequestStatus = async (requestId: string, status: 'accepted' | 'declined') => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', requestId)
        .eq('to_user_id', user.id)
        .select()
        .single();

      if (error) {
        toast.error('Erreur lors de la mise à jour');
        return { error };
      }

      // Update local state
      setReceivedRequests(prev => 
        prev.map(req => req.id === requestId ? data as AccessRequest : req)
      );
      
      // If accepted, refresh requests after trigger creates contacts
      if (status === 'accepted') {
        setTimeout(() => {
          fetchRequests(); // Refetch to get fresh data after trigger
        }, 500);
      }
      
      const message = status === 'accepted' ? 'Demande acceptée' : 'Demande refusée';
      toast.success(message);
      return { data };
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      return { error };
    }
  };

  return {
    sentRequests,
    receivedRequests,
    loading,
    createRequest,
    updateRequestStatus,
    refetch: fetchRequests
  };
}