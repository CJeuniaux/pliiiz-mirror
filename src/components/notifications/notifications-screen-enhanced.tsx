import React, { useState, useEffect } from "react";
import { IntegratedHeader } from "@/components/ui/integrated-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActorAvatar } from "@/components/ui/actor-avatar";
import { Heart, MessageCircle, Check, X, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BirthdayNotification } from "@/components/notifications/birthday-notification";
import { useNotifications } from "@/hooks/use-notifications";

interface NotificationsScreenProps {
  onMarkAllRead?: () => void;
  onViewProfile?: (contactId: string) => void;
  onViewRequest?: (requestId: string) => void;
}

interface NotificationData {
  id: string;
  type: string;
  message: string;
  created_at: string;
  read_at?: string | null;
  actor_user_id?: string | null;
  actor_name?: string | null;
  actor_avatar_url?: string | null;
  payload?: any;
}

export function NotificationsScreenEnhanced({
  onMarkAllRead,
  onViewProfile,
  onViewRequest
}: NotificationsScreenProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead: markAll, 
    markAsRead: markOne,
    refetch
  } = useNotifications();

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);


  const handleMarkAllRead = async () => {
    if (!user) return;

    try {
      setMarkingAllRead(true);
      // Utilise le hook pour marquer côté serveur et diffuser l'événement global
      await markAll();

      toast.success("Toutes les notifications marquées comme lues");
      if (onMarkAllRead) onMarkAllRead();

    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markOne(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleAcceptRequest = async (notificationId: string) => {
    // TODO: Implémenter l'acceptation de demande
    toast.success("Demande d'accès acceptée");
  };

  const handleRejectRequest = async (notificationId: string) => {
    // TODO: Implémenter le rejet de demande  
    toast.success("Demande d'accès refusée");
  };

  const handleViewProfile = (notification: NotificationData) => {
    if (notification.actor_user_id && onViewProfile) {
      onViewProfile(notification.actor_user_id);
    }
    
    // Marquer comme lu
    if (!notification.read_at) {
      handleMarkAsRead(notification.id);
    }
  };

  const formatNotificationMessage = (notification: NotificationData) => {
    const actorName = notification.actor_name || 'Un utilisateur';
    
    switch (notification.type) {
      case 'preferences_updated':
        return `${actorName} a mis à jour ses préférences`;
      case 'contact_accepted':
        return `${actorName} a accepté votre demande de contact`;
      case 'contact_request':
        return `${actorName} souhaite vous ajouter à ses contacts`;
      case 'birthday_upcoming':
        const payload = notification.payload as any;
        const contactName = payload?.contact_name || 'Votre contact';
        const daysUntil = payload?.days_until || 21;
        return `🎂 Anniversaire de ${contactName} dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`;
      default:
        return notification.message || 'Nouvelle notification';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'maintenant';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'preferences_updated':
        return <Heart className="h-4 w-4 text-primary flex-shrink-0 ml-2" />;
      case 'contact_accepted':
      case 'contact_request':
        return <MessageCircle className="h-4 w-4 text-primary flex-shrink-0 ml-2" />;
      default:
        return <MessageCircle className="h-4 w-4 text-primary flex-shrink-0 ml-2" />;
    }
  };

  if (loading) {
    return (
      <div className="page">
        <main className="main">
          <IntegratedHeader />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <main className="main">
        <IntegratedHeader />
        
        <h2 className="text-xl font-semibold mb-4">
          Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
        </h2>
        
        <div className="space-y-4 overflow-y-auto pb-20" style={{
          height: 'calc(100vh - 68px - 64px)'
        }}>
        {unreadCount > 0 && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Tout marquer lu
            </Button>
          </div>
        )}

        <div className="pliiz-list">
          {notifications.map(notification => (
            <Card 
              key={notification.id} 
              className={`pliiz-card hover:shadow-lg transition-all ${
                !notification.read_at ? 'border-2' : ''
              }`}
            >
              <div className="flex items-stretch gap-4">
                <ActorAvatar 
                  actorName={notification.actor_name}
                  actorAvatarUrl={notification.actor_avatar_url}
                  size="xl"
                  className="self-stretch"
                />
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-sm truncate-2 flex-1 pr-2">
                        {formatNotificationMessage(notification)}
                      </h3>
                      <span className="text-xs opacity-70 whitespace-nowrap">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    
                  <div className="flex items-center justify-between">
                    <div className="flex-1" />
                  </div>
                    
                    <div className="flex gap-2 justify-end">
                      {notification.type === 'contact_request' ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={() => handleAcceptRequest(notification.id)} 
                            className="flex-1"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accepter
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => handleRejectRequest(notification.id)} 
                            className="flex-1"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Refuser
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => handleMarkAsRead(notification.id)} 
                          disabled={!!notification.read_at}
                        >
                          OK
                        </Button>
                      )}
                    </div>
                  </div>
              </div>
            </Card>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="pliiz-card text-center py-12">
            <div className="w-24 h-24 mx-auto bg-white/20 rounded-lg flex items-center justify-center mb-4">
              <Heart className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-medium">Aucune notification</h3>
              <p className="text-sm opacity-80 mt-1">
                Vous serez notifié des nouvelles activités
              </p>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}