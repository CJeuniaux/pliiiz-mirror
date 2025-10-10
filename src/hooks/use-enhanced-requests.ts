import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

export interface EnhancedAccessRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  event_id?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  other_user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export function useEnhancedRequests() {
  const { user } = useAuth();
  const [sentRequests, setSentRequests] = useState<EnhancedAccessRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<EnhancedAccessRequest[]>([]);
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
      console.log('[useEnhancedRequests] Fetching requests for user:', user.id);
      
      // Charger les demandes via fonctions sécurisées (RLS friendly) en parallèle
      const [sentRes, receivedRes] = await Promise.all([
        supabase.rpc('get_user_sent_requests', { user_uuid: user.id }),
        supabase.rpc('get_user_received_requests', { user_uuid: user.id })
      ]);

      if (sentRes.error || receivedRes.error) {
        console.error('[useEnhancedRequests] Error fetching via RPC:', sentRes.error || receivedRes.error);
        toast.error('Erreur lors du chargement des demandes');
        return;
      }

      const sentData = sentRes.data || [];
      const receivedData = receivedRes.data || [];

      // Transformer les données RPC en EnhancedAccessRequest
      const transformedSent = sentData.map((req: any) => ({
        id: req.id,
        from_user_id: req.from_user_id,
        to_user_id: req.to_user_id,
        event_id: req.event_id || undefined,
        message: req.message || undefined,
        status: req.status,
        created_at: req.created_at,
        other_user: {
          id: req.to_user_id,
          name: (req.to_user_name || 'Utilisateur').trim(),
          avatar_url: req.to_user_avatar || null
        }
      })) as EnhancedAccessRequest[];

      const transformedReceived = receivedData.map((req: any) => ({
        id: req.id,
        from_user_id: req.from_user_id,
        to_user_id: req.to_user_id,
        event_id: req.event_id || undefined,
        message: req.message || undefined,
        status: req.status,
        created_at: req.created_at,
        other_user: {
          id: req.from_user_id,
          name: (req.from_user_name || 'Utilisateur').trim(),
          avatar_url: req.from_user_avatar || null
        }
      })) as EnhancedAccessRequest[];

      setSentRequests(transformedSent);
      setReceivedRequests(transformedReceived);
      
      console.log('[useEnhancedRequests] Loaded requests via RPC:', {
        sent: transformedSent.length,
        received: transformedReceived.length
      });
      
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (toUserId: string, message?: string, eventId?: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // Check if request already exists to prevent duplicates (any status except declined)
      const { data: existingRequest } = await supabase
        .from('requests')
        .select('id, status')
        .eq('from_user_id', user.id)
        .eq('to_user_id', toUserId)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast.error('Une demande est déjà en cours pour cet utilisateur');
        } else if (existingRequest.status === 'accepted') {
          toast.error('Vous êtes déjà en contact avec cet utilisateur');
        }
        return { error: 'Duplicate request' };
      }

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

      // Optimistic update - add to sent requests immediately
      const newRequest: EnhancedAccessRequest = {
        id: data.id,
        from_user_id: data.from_user_id,
        to_user_id: data.to_user_id,
        event_id: data.event_id,
        message: data.message,
        status: data.status as 'pending' | 'accepted' | 'declined' | 'cancelled',
        created_at: data.created_at,
        other_user: {
          id: toUserId,
          name: 'Utilisateur',
          avatar_url: null
        }
      };
      
      setSentRequests(prev => [newRequest, ...prev]);
      
      // Refetch to get complete data after a short delay
      setTimeout(fetchRequests, 500);
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
      const { error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', requestId)
        .eq('to_user_id', user.id);

      if (error) {
        toast.error('Erreur lors de la mise à jour');
        return { error };
      }

      // Optimistic update
      setReceivedRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, status } : req)
      );
      
      // If accepted, refresh requests after trigger creates contacts
      if (status === 'accepted') {
        setTimeout(() => {
          fetchRequests();
        }, 500);
      }
      
      const message = status === 'accepted' ? 'Demande acceptée' : 'Demande refusée';
      toast.success(message);
      return { success: true };
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      return { error };
    }
  };

  const cancelRequest = async (requestId: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // For now, we'll use 'declined' status instead of 'cancelled' since enum creation failed
      const { error } = await supabase
        .from('requests')
        .update({ status: 'declined' })
        .eq('id', requestId)
        .eq('from_user_id', user.id);

      if (error) {
        toast.error('Erreur lors de l\'annulation');
        return { error };
      }

      // Optimistic update - mark as cancelled in the UI
      setSentRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, status: 'cancelled' } : req)
      );
      
      toast.success('Demande annulée');
      return { success: true };
    } catch (error) {
      toast.error('Erreur lors de l\'annulation');
      return { error };
    }
  };

  return {
    sentRequests,
    receivedRequests,
    loading,
    createRequest,
    updateRequestStatus,
    cancelRequest,
    refetch: fetchRequests
  };
}