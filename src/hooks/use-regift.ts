import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Regift {
  id: string;
  gift_id: string;
  from_user_id: string;
  to_contact_id: string;
  status: 'suggested' | 'accepted' | 'declined';
  reason?: string;
  visibility: 'private' | 'friends';
  created_at: string;
  updated_at: string;
  gifts?: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    image_url?: string;
  };
  contacts?: {
    id: string;
    contact_user_id: string;
    alias?: string;
  };
}

export function useRegift() {
  const [loading, setLoading] = useState(false);
  const [regifts, setRegifts] = useState<Regift[]>([]);

  const createRegift = async (
    giftId: string, 
    toContactId: string, 
    reason?: string, 
    visibility: 'private' | 'friends' = 'private'
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('regift-api', {
        body: {
          toContactId,
          reason,
          visibility
        },
        method: 'POST'
      });

      if (error) {
        console.error('Regift creation error:', error);
        toast.error('Impossible de créer la proposition de re-gift');
        return { error };
      }

      if (data.error) {
        toast.error(data.error);
        return { error: data.error };
      }

      toast.success('Proposition de re-gift envoyée !');
      return { data: data.regift };

    } catch (error) {
      console.error('Regift creation exception:', error);
      toast.error('Erreur lors de l\'envoi de la proposition');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const fetchRegifts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('regift-api/regifts', {
        method: 'GET'
      });

      if (error) {
        console.error('Regifts fetch error:', error);
        toast.error('Impossible de récupérer les re-gifts');
        return { error };
      }

      if (data.error) {
        toast.error(data.error);
        return { error: data.error };
      }

      setRegifts(data.regifts || []);
      return { data: data.regifts };

    } catch (error) {
      console.error('Regifts fetch exception:', error);
      toast.error('Erreur lors de la récupération des re-gifts');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateRegiftStatus = async (regiftId: string, status: 'accepted' | 'declined') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('regifts')
        .update({ status })
        .eq('id', regiftId);

      if (error) {
        console.error('Regift status update error:', error);
        toast.error('Impossible de mettre à jour le statut');
        return { error };
      }

      toast.success(status === 'accepted' ? 'Re-gift accepté !' : 'Re-gift décliné');
      
      // Rafraîchir la liste
      await fetchRegifts();
      
      return { success: true };

    } catch (error) {
      console.error('Regift status update exception:', error);
      toast.error('Erreur lors de la mise à jour');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    createRegift,
    fetchRegifts,
    updateRegiftStatus,
    regifts,
    loading
  };
}