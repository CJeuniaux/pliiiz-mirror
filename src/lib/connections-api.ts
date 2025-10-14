import { supabase } from '@/integrations/supabase/client';
import { executeSupabaseOperation } from './supabase-helpers';

/**
 * Accepte une demande de connexion
 * Le trigger DB créera automatiquement les contacts bidirectionnels
 */
export async function acceptConnection(requestId: string) {
  return executeSupabaseOperation(
    async () => {
      const result = await supabase
        .from('requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('status', 'pending') // Évite de ré-accepter une demande déjà traitée
        .select()
        .single();
      return result;
    },
    {
      successMessage: 'Connexion acceptée',
      errorMessage: 'Échec de l\'acceptation'
    }
  );
}

/**
 * Refuse une demande de connexion
 */
export async function rejectConnection(requestId: string) {
  return executeSupabaseOperation(
    async () => {
      const result = await supabase
        .from('requests')
        .update({ status: 'refused' })
        .eq('id', requestId)
        .eq('status', 'pending') // Évite de ré-refuser une demande déjà traitée
        .select()
        .single();
      return result;
    },
    {
      successMessage: 'Demande refusée',
      errorMessage: 'Échec du refus'
    }
  );
}

/**
 * Crée une nouvelle demande de connexion
 */
export async function createConnectionRequest(
  fromUserId: string,
  toUserId: string,
  message?: string,
  eventId?: string
) {
  return executeSupabaseOperation(
    async () => {
      const result = await supabase
        .from('requests')
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          message,
          event_id: eventId,
          status: 'pending'
        })
        .select()
        .single();
      return result;
    },
    {
      successMessage: 'Demande envoyée',
      errorMessage: 'Échec de l\'envoi de la demande'
    }
  );
}

/**
 * Récupère les demandes reçues pour un utilisateur
 */
export async function getReceivedRequests(userId: string) {
  return executeSupabaseOperation(
    async () => {
      const result = await supabase
        .from('requests')
        .select('*')
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false });
      return result;
    },
    {
      errorMessage: 'Erreur lors du chargement des demandes reçues',
      showToast: false // Ne pas afficher de toast pour les lectures
    }
  );
}

/**
 * Récupère les demandes envoyées par un utilisateur
 */
export async function getSentRequests(userId: string) {
  return executeSupabaseOperation(
    async () => {
      const result = await supabase
        .from('requests')
        .select('*')
        .eq('from_user_id', userId)
        .order('created_at', { ascending: false });
      return result;
    },
    {
      errorMessage: 'Erreur lors du chargement des demandes envoyées',
      showToast: false
    }
  );
}
