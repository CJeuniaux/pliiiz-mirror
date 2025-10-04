import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

export interface AccessRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'refused';
  message?: string;
  event_id?: string;
  created_at: string;
  // Données du demandeur (pour les demandes reçues)
  requester_name?: string;
  requester_avatar?: string;
  // Données du destinataire (pour les demandes envoyées)
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
        // Récupérer les profils des demandeurs
        const userIds = received.map(req => req.from_user_id);
        // Get multiple profiles via secure function - calling individually for each user
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
        // Récupérer les profils des destinataires
        const userIds = sent.map(req => req.to_user_id);
        // Get multiple profiles via secure function - calling individually for each user
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
    try {
      console.log('Accepting request:', requestId, 'for user:', user?.id);
      
      const { data, error } = await supabase
        .from('requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error accepting request:', error);
        toast.error(`Erreur lors de l'acceptation: ${error.message}`);
        return { error };
      }

      console.log('Request accepted successfully:', data);
      toast.success('Demande acceptée');
      fetchRequests(); // Recharger les données
      return { success: true };
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Erreur lors de l\'acceptation');
      return { error };
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'refused' })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting request:', error);
        toast.error('Erreur lors du refus');
        return { error };
      }

      toast.success('Demande refusée');
      fetchRequests(); // Recharger les données
      return { success: true };
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Erreur lors du refus');
      return { error };
    }
  };

  const createRequest = async (toUserId: string, message?: string, eventId?: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('requests')
        .insert({
          from_user_id: user.id,
          to_user_id: toUserId,
          message,
          event_id: eventId,
          status: 'pending'
        });

      if (error) {
        console.error('Error creating request:', error);
        toast.error('Erreur lors de l\'envoi de la demande');
        return { error };
      }

      toast.success('Demande envoyée');
      fetchRequests(); // Recharger les données
      return { success: true };
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
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