import { supabase } from '@/integrations/supabase/client';
import { executeSupabaseOperation } from './supabase-helpers';

/**
 * Accepte une demande de connexion via RPC v2 sécurisé
 * Utilise accept_and_sync_v2 qui ne touche jamais pair_key si GENERATED
 */
export async function acceptConnectionRPC(fromUserId: string) {
  return executeSupabaseOperation(
    async () => {
      const result = await supabase.rpc('accept_and_sync_v2', {
        p_from_user_id: fromUserId
      });
      return result;
    },
    {
      successMessage: 'Connexion acceptée',
      errorMessage: 'Échec de l\'acceptation'
    }
  );
}

/**
 * Refuse une demande de connexion via RPC sécurisé
 */
export async function rejectConnectionRPC(requestId: string) {
  return executeSupabaseOperation(
    async () => {
      const result = await supabase.rpc('reject_connection_request', {
        p_request_id: requestId
      });
      return result;
    },
    {
      successMessage: 'Demande refusée',
      errorMessage: 'Échec du refus'
    }
  );
}
