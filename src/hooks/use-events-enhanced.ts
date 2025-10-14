import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

export interface Event {
  id: string;
  owner_id: string;
  title: string;
  event_date: string;
  location_text?: string;
  lat?: number;
  lng?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface EventInvite {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  event?: Event;
}

export function useEvents() {
  const { user } = useAuth();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [invitedEvents, setInvitedEvents] = useState<EventInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEvents();
    } else {
      setMyEvents([]);
      setInvitedEvents([]);
      setLoading(false);
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      // Fetch my events
      const { data: myEventsData, error: myEventsError } = await supabase
        .from('events')
        .select('*')
        .eq('owner_id', user.id)
        .order('event_date', { ascending: true });

      // Fetch invited events
      const { data: invitedEventsData, error: invitedError } = await supabase
        .from('event_invites')
        .select(`
          *,
          event:events(*)
        `)
        .eq('user_id', user.id)
        .neq('status', 'declined')
        .order('created_at', { ascending: false });

      if (myEventsError) {
        console.error('Error fetching my events:', myEventsError);
        return;
      }

      if (invitedError) {
        console.error('Error fetching invited events:', invitedError);
        return;
      }

      setMyEvents(myEventsData || []);
      setInvitedEvents((invitedEventsData || []) as EventInvite[]);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) {
        toast.error('Erreur lors de la création');
        return { error };
      }

      // Invalidate cache and refetch
      await fetchEvents();
      toast.success('Événement créé');
      return { data };
    } catch (error) {
      toast.error('Erreur lors de la création');
      return { error };
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (error) {
        toast.error('Erreur lors de la mise à jour');
        return { error };
      }

      // Invalidate cache and refetch
      await fetchEvents();
      toast.success('Événement mis à jour');
      return { data };
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      return { error };
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) {
        toast.error('Erreur lors de la suppression');
        return { error };
      }

      // Invalidate cache and refetch
      await fetchEvents();
      toast.success('Événement supprimé');
      return { success: true };
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      return { error };
    }
  };

  const updateInviteStatus = async (inviteId: string, status: 'accepted' | 'declined') => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('event_invites')
        .update({ status })
        .eq('id', inviteId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        toast.error('Erreur lors de la mise à jour');
        return { error };
      }

      // Invalidate cache and refetch
      await fetchEvents();
      const message = status === 'accepted' ? 'Invitation acceptée' : 'Invitation refusée';
      toast.success(message);
      return { data };
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      return { error };
    }
  };

  return {
    myEvents,
    invitedEvents,
    events: myEvents, // Backward compatibility
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    updateInviteStatus,
    refetch: fetchEvents
  };
}