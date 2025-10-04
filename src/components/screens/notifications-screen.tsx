import { useState } from "react";
import { HeroHeader } from "@/components/ui/hero-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, Clock, Eye, Mail } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface NotificationsScreenProps {
  onBack: () => void;
}

export function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const { 
    unreadNotifications, 
    readNotifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    getNotificationText 
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState("unread");

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const NotificationCard = ({ notification, isUnread }: { notification: any; isUnread: boolean }) => (
    <Card 
      key={notification.id} 
      className={`overflow-hidden cursor-pointer transition-colors ${
        isUnread ? 'bg-blue-50 border-blue-200' : 'bg-background'
      }`}
      onClick={() => isUnread && handleNotificationClick(notification.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar enrichi de l'acteur */}
          <EnhancedAvatar
            userId={notification.actor_user_id}
            avatarUrl={notification.actor_avatar}
            name={notification.actor_name || 'Un utilisateur'}
            size="sm"
            className="shrink-0"
          />
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className={`text-sm ${isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {getNotificationText(notification)}
                </p>
              </div>
              {isUnread && (
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { 
                addSuffix: true,
                locale: fr 
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ isUnread }: { isUnread: boolean }) => (
    <div className="text-center py-12 space-y-4">
      <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
        <Bell className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-medium text-muted-foreground">
          {isUnread ? 'Aucune notification non lue' : 'Aucune notification lue'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isUnread 
            ? 'Toutes vos notifications sont à jour !' 
            : 'Les notifications que vous avez lues apparaîtront ici'
          }
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <HeroHeader 
        title="Notifications" 
        subtitle="Restez informé des dernières activités"
      />
      
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        ) : (
          <>
            {/* Header with unread count and mark all button */}
            {unreadCount > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
                </p>
                <Button 
                  onClick={markAllAsRead} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  Tout marquer comme lu
                </Button>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unread" className="relative">
                  Non lues
                  {unreadCount > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="read">
                  Lues
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({readNotifications.length})
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="unread" className="space-y-3 mt-4">
                {unreadNotifications.length > 0 ? (
                  unreadNotifications.map((notification) => (
                    <NotificationCard 
                      key={notification.id} 
                      notification={notification} 
                      isUnread={true} 
                    />
                  ))
                ) : (
                  <EmptyState isUnread={true} />
                )}
              </TabsContent>

              <TabsContent value="read" className="space-y-3 mt-4">
                {readNotifications.length > 0 ? (
                  readNotifications.map((notification) => (
                    <NotificationCard 
                      key={notification.id} 
                      notification={notification} 
                      isUnread={false} 
                    />
                  ))
                ) : (
                  <EmptyState isUnread={false} />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}