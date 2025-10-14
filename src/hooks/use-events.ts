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

export function useEvents() {
  const { user } = useAuth();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [invitedEvents, setInvitedEvents] = useState<Event[]>([]);
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
      // Fetch my own events
      const { data: myEventsData, error: myEventsError } = await supabase
        .from('events')
        .select('*')
        .eq('owner_id', user.id)
        .order('event_date', { ascending: true });

      // Fetch events I'm invited to
      const { data: invitedData, error: invitedError } = await supabase
        .from('event_invites')
        .select(`
          id,
          status,
          event:events(*)
        `)
        .eq('user_id', user.id)
        .neq('status', 'declined');

      if (myEventsError) {
        console.error('Error fetching my events:', myEventsError);
        return;
      }

      if (invitedError) {
        console.error('Error fetching invited events:', invitedError);
        return;
      }

      setMyEvents(myEventsData || []);
      setInvitedEvents((invitedData || []).map(invite => invite.event).filter(Boolean));
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

      await fetchEvents(); // Refetch to get updated state
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

      await fetchEvents(); // Refetch to get updated state
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

      await fetchEvents(); // Refetch to get updated state
      toast.success('Événement supprimé');
      return { success: true };
    } catch (error) {
      toast.error('Erreur lors de la suppression');
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
    refetch: fetchEvents
  };
}