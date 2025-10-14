import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export interface Notification {
  id: string;
  type: string;
  message: string;
  read_at: string | null;
  created_at: string;
  actor_user_id?: string;
  actor_name?: string | null;
  actor_avatar_url?: string | null;
  payload?: any;
}

// Global state management for notifications across all hook instances
class NotificationStore {
  private subscribers: Set<() => void> = new Set();
  private notifications: Notification[] = [];
  private unreadCount: number = 0;

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  setNotifications(notifications: Notification[]) {
    this.notifications = notifications;
    this.unreadCount = notifications.filter(n => !n.read_at).length;
    this.notify();
  }

  markAsRead(notificationId: string) {
    this.notifications = this.notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read_at: new Date().toISOString() }
        : notification
    );
    this.unreadCount = this.notifications.filter(n => !n.read_at).length;
    this.notify();
  }

  markAllAsRead() {
    this.notifications = this.notifications.map(notification => ({
      ...notification,
      read_at: notification.read_at || new Date().toISOString()
    }));
    this.unreadCount = 0;
    this.notify();
  }

  markAllAsUnread() {
    this.notifications = this.notifications.map(notification => ({
      ...notification,
      read_at: null
    }));
    this.unreadCount = this.notifications.length;
    this.notify();
  }

  getNotifications() {
    return this.notifications;
  }

  getUnreadCount() {
    return this.unreadCount;
  }

  private notify() {
    this.subscribers.forEach(callback => callback());
  }
}

const notificationStore = new NotificationStore();

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  // Sync with global store
  const syncWithStore = useCallback(() => {
    setNotifications(notificationStore.getNotifications());
    setUnreadCount(notificationStore.getUnreadCount());
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          message,
          read_at,
          created_at,
          actor_user_id,
          actor_name,
          actor_avatar_url,
          payload
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notifications = data || [];
      notificationStore.setNotifications(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistic update through store
      notificationStore.markAsRead(notificationId);

      // Update in database via RPC
      const { error } = await supabase.rpc('mark_notification_read', {
        notification_id: notificationId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update on error
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const currentNotifications = notificationStore.getNotifications();
      const unreadIds = currentNotifications
        .filter(n => !n.read_at)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      // Optimistic update through store
      notificationStore.markAllAsRead();

      // Update in database
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert optimistic update on error
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const markAllAsUnread = useCallback(async () => {
    if (!user) return;

    try {
      const currentNotifications = notificationStore.getNotifications();
      const readIds = currentNotifications
        .filter(n => n.read_at)
        .map(n => n.id);

      if (readIds.length === 0) return;

      // Optimistic update through store
      notificationStore.markAllAsUnread();

      // Update in database
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: null })
        .eq('user_id', user.id)
        .not('read_at', 'is', null);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as unread:', error);
      // Revert optimistic update on error
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const getNotificationText = useCallback((notification: Notification): string => {
    const { type, actor_name, message } = notification;
    const actorName = actor_name || 'Un utilisateur';
    
    switch (type) {
      case 'preferences_updated':
        return `${actorName} a mis à jour ses préférences`;
      case 'contact_accepted':
        return `${actorName} a accepté votre demande de contact`;
      case 'request_received':
        return `${actorName} souhaite consulter votre profil`;
      case 'birthday_upcoming':
        return message || 'Anniversaire à venir';
      default:
        return message || 'Nouvelle notification';
    }
  }, []);

  // Set up real-time subscription and store subscription
  useEffect(() => {
    if (!user) return;

    // Subscribe to store changes
    const unsubscribeStore = notificationStore.subscribe(syncWithStore);

    // Initial fetch
    fetchNotifications();

    // Set up real-time subscription
    const subscription = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification realtime update received:', payload);
          // Debounce rapid updates
          setTimeout(() => fetchNotifications(), 100);
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;

    // Refetch when page becomes visible (user returns to tab/app)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications();
      }
    };

    const handleFocus = () => {
      fetchNotifications();
    };

    // Periodic sync every 30 seconds to ensure consistency
    const syncInterval = setInterval(() => {
      if (!document.hidden) {
        fetchNotifications();
      }
    }, 30000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribeStore();
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id, fetchNotifications, syncWithStore]);

  const unreadNotifications = notifications.filter(n => !n.read_at);
  const readNotifications = notifications.filter(n => n.read_at);

  return {
    notifications,
    unreadNotifications,
    readNotifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    markAllAsUnread,
    getNotificationText,
    refetch: fetchNotifications
  };
}