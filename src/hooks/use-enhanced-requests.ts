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
    city?: string;
    birthday?: string;
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
      
      // Realtime: écouter les changements sur requests et contacts
      const requestsChannel = supabase
        .channel('requests-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'requests'
        }, (payload) => {
          console.log('[Realtime] Request changed:', payload);
          fetchRequests();
        })
        .subscribe();
        
      const contactsChannel = supabase
        .channel('contacts-realtime')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'contacts'
        }, (payload) => {
          console.log('[Realtime] Contact created:', payload);
          toast.success('Nouveau contact ajouté ! 🎉');
          fetchRequests();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(requestsChannel);
        supabase.removeChannel(contactsChannel);
      };
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
      
      // Charger toutes les demandes de l'utilisateur via une fonction sécurisée
      const { data: allData, error: reqError } = await supabase
        .rpc('get_my_requests_enhanced');

      if (reqError) {
        console.error('[useEnhancedRequests] Error:', reqError);
        toast.error('Erreur lors du chargement des demandes');
        return;
      }

      const rows = allData || [];

      // Séparer envoyées/reçues ET filtrer uniquement les demandes pending
      const sentRows = rows.filter((r: any) => 
        r.from_user_id === user.id && r.status === 'pending'
      );
      const receivedRows = rows.filter((r: any) => 
        r.to_user_id === user.id && r.status === 'pending'
      );

      // Transformer demandes envoyées avec profils
      const transformedSent = sentRows.map((r: any) => ({
        id: r.id,
        from_user_id: r.from_user_id,
        to_user_id: r.to_user_id,
        event_id: r.event_id || undefined,
        message: r.message || undefined,
        status: r.status,
        created_at: r.created_at,
        other_user: {
          id: r.other_user_id,
          name: `${r.other_first_name || ''} ${r.other_last_name || ''}`.trim() || 'Utilisateur',
          avatar_url: r.other_avatar_url,
          city: r.other_city,
          birthday: r.other_birthday
        }
      })) as EnhancedAccessRequest[];

      // Transformer demandes reçues avec profils
      const transformedReceived = receivedRows.map((r: any) => ({
        id: r.id,
        from_user_id: r.from_user_id,
        to_user_id: r.to_user_id,
        event_id: r.event_id || undefined,
        message: r.message || undefined,
        status: r.status,
        created_at: r.created_at,
        other_user: {
          id: r.other_user_id,
          name: `${r.other_first_name || ''} ${r.other_last_name || ''}`.trim() || 'Utilisateur',
          avatar_url: r.other_avatar_url,
          city: r.other_city,
          birthday: r.other_birthday
        }
      })) as EnhancedAccessRequest[];

      setSentRequests(transformedSent);
      setReceivedRequests(transformedReceived);
      
      console.log('[useEnhancedRequests] Loaded:', {
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
      const request = receivedRequests.find(r => r.id === requestId);
      if (!request) {
        toast.error('Demande introuvable');
        return { error: 'Request not found' };
      }

      if (status === 'accepted') {
        // ⚡ RPC V2 : accepte + renvoie pending/contacts en un seul appel
        const { data: syncData, error: syncError } = await supabase.rpc('accept_and_sync_v2', {
          p_from_user_id: request.from_user_id
        });
        
        if (syncError) {
          toast.error(`Échec : ${syncError.message || 'Erreur lors de l\'acceptation'}`);
          return { error: syncError };
        }

        const res = (syncData as any) ?? { ok: true, pending: [], contacts: [] };

        // ✅ REMPLACER directement l'état par la vérité DB (déjà filtrée pending par la RPC)
        const rawPending = Array.isArray(res.pending) ? res.pending : [];
        
        const transformedPending = rawPending.map((r: any) => ({
          id: r.id,
          from_user_id: r.from_user_id,
          to_user_id: r.to_user_id,
          status: r.status as 'pending' | 'accepted' | 'declined' | 'cancelled',
          message: r.message,
          event_id: r.event_id,
          created_at: r.created_at,
          other_user: {
            id: r.from_user_id,
            name: 'Utilisateur',
            avatar_url: null
          }
        })) as EnhancedAccessRequest[];

        // Séparer reçues vs envoyées (pas de filtre sur status, déjà fait côté DB)
        setReceivedRequests(transformedPending.filter(r => r.to_user_id === user.id));
        setSentRequests(transformedPending.filter(r => r.from_user_id === user.id));
        
        toast.success('Connexion acceptée ✅');
        window.dispatchEvent(new CustomEvent('contact-accepted'));
        
        return { success: true };
      } else {
        // Refus via RPC
        const { error } = await supabase.rpc('reject_connection', { 
          p_request_id: requestId 
        });

        if (error) {
          toast.error(`Échec : ${error.message || 'Erreur lors du refus'}`);
          return { error };
        }
        
        toast.success('Demande refusée');
        // Retirer uniquement de l'état local (DB déjà mise à jour)
        setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
        
        return { success: true };
      }
    } catch (error: any) {
      const msg = error?.message ?? 'Erreur inconnue';
      toast.error(`Échec : ${msg}`);
      await fetchRequests();
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