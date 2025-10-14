import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';
import { 
  acceptConnection as acceptConnectionApi, 
  rejectConnection as rejectConnectionApi,
  createConnectionRequest as createConnectionRequestApi,
  getReceivedRequests,
  getSentRequests
} from '@/lib/connections-api';

export interface AccessRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'refused';
  message?: string;
  event_id?: string;
  created_at: string;
  requester_name?: string;
  requester_avatar?: string;
  owner_name?: string;
  owner_avatar?: string;
}

export function useContactManagement() {
  const { user } = useAuth();
  const [receivedRequests, setReceivedRequests] = useState<AccessRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Récupérer les demandes reçues
      const { data: received, error: receivedError } = await supabase
        .from('requests')
        .select('*')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) {
        console.error('Error fetching received requests:', receivedError);
      } else if (received) {
        const userIds = received.map(req => req.from_user_id);
        const profilePromises = userIds.map(async (userId) => {
          const { data, error } = await supabase
            .rpc('get_public_profile_secure', { profile_user_id: userId })
            .single();
          return error ? null : data;
        });
        const profiles = (await Promise.all(profilePromises)).filter(Boolean);
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const formattedReceived = received.map(req => {
          const profile = profileMap.get(req.from_user_id);
          const fullName = profile?.display_name || '';
          return {
            ...req,
            requester_name: fullName || 'Utilisateur',
            requester_avatar: profile?.avatar_url
          } as AccessRequest;
        });
        setReceivedRequests(formattedReceived);
      }

      // Récupérer les demandes envoyées
      const { data: sent, error: sentError } = await supabase
        .from('requests')
        .select('*')
        .eq('from_user_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) {
        console.error('Error fetching sent requests:', sentError);
      } else if (sent) {
        const userIds = sent.map(req => req.to_user_id);
        const profilePromises = userIds.map(async (userId) => {
          const { data, error } = await supabase
            .rpc('get_public_profile_secure', { profile_user_id: userId })
            .single();
          return error ? null : data;
        });
        const profiles = (await Promise.all(profilePromises)).filter(Boolean);
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const formattedSent = sent.map(req => {
          const profile = profileMap.get(req.to_user_id);
          const fullName = profile?.display_name || '';
          return {
            ...req,
            owner_name: fullName || 'Utilisateur',
            owner_avatar: profile?.avatar_url
          } as AccessRequest;
        });
        setSentRequests(formattedSent);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    if (!user) {
      toast.error('Utilisateur non authentifié');
      return { error: 'User not authenticated' };
    }

    try {
      console.log('✅ Accepting request:', requestId, 'for user:', user.id);
      
      await acceptConnectionApi(requestId);
      
      console.log('✅ Request accepted. DB trigger will create contacts automatically');
      
      // Rafraîchir les demandes
      await fetchRequests();
      
      return { success: true };
    } catch (error: any) {
      console.error('[acceptRequest] Error:', error);
      // Le toast est déjà affiché par acceptConnectionApi
      return { error };
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!user) {
      toast.error('Utilisateur non authentifié');
      return { error: 'User not authenticated' };
    }

    try {
      await rejectConnectionApi(requestId);
      
      // Rafraîchir les demandes
      await fetchRequests();
      
      return { success: true };
    } catch (error: any) {
      console.error('[rejectRequest] Error:', error);
      // Le toast est déjà affiché par rejectConnectionApi
      return { error };
    }
  };

  const createRequest = async (toUserId: string, message?: string, eventId?: string) => {
    if (!user) {
      toast.error('Utilisateur non authentifié');
      return { error: 'User not authenticated' };
    }

    try {
      await createConnectionRequestApi(user.id, toUserId, message, eventId);
      
      // Rafraîchir les demandes
      await fetchRequests();
      
      return { success: true };
    } catch (error: any) {
      console.error('[createRequest] Error:', error);
      // Le toast est déjà affiché par createConnectionRequestApi
      return { error };
    }
  };

  return {
    receivedRequests,
    sentRequests,
    loading,
    acceptRequest,
    rejectRequest,
    createRequest,
    refetch: fetchRequests
  };
}
