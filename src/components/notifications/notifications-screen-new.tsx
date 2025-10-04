import React, { useState } from "react";
import { PageHeaderMain } from "@/components/ui/page-header-main";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, User, CheckCircle } from "lucide-react";

const allNotifications = [
  {
    id: "1",
    type: "preferences" as const,
    title: "Thomas a mis à jour ses préférences",
    message: "Nouvelles idées cadeaux ajoutées pour son anniversaire",
    avatar: null, // Avatar should come from actor_avatar_url in real notifications
    time: "Il y a 2h",
    isRead: false
  },
  {
    id: "2", 
    type: "access_request" as const,
    title: "Nouvelle demande d'accès",
    message: "Marie souhaite consulter vos préférences pour votre anniversaire",
    avatar: null, // Avatar should come from actor_avatar_url in real notifications
    time: "Il y a 4h",
    isRead: false
  },
  {
    id: "3",
    type: "access_granted" as const,
    title: "Accès accordé",
    message: "Alex peut maintenant voir vos préférences pour le dîner",
    avatar: null, // Avatar should come from actor_avatar_url in real notifications
    time: "Hier",
    isRead: true
  },
  {
    id: "4",
    type: "preferences" as const,
    title: "Zoé a partagé ses allergies",
    message: "Informations mises à jour pour la crémaillère",
    avatar: null, // Avatar should come from actor_avatar_url in real notifications
    time: "Il y a 2 jours",
    isRead: true
  }
];

export function NotificationsScreen() {
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set(["3", "4"]));
  
  const markAsRead = (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
  };
  
  const markAsUnread = (id: string) => {
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };
  
  const notifications = allNotifications.map(notif => ({
    ...notif,
    isRead: readNotifications.has(notif.id)
  }));
  
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotificationsList = notifications.filter(n => n.isRead);
  const unreadCount = unreadNotifications.length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeaderMain />
      
      <div className="p-4 space-y-4 overflow-y-auto pb-20" style={{ height: 'calc(100vh - 88px - 64px)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Notifications ({unreadCount})</h1>
          <Badge variant="secondary">
            {unreadCount} non lues
          </Badge>
        </div>

        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unread">À lire ({unreadCount})</TabsTrigger>
            <TabsTrigger value="read">Lus ({readNotificationsList.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unread" className="space-y-3 mt-4">
            {unreadNotifications.map((notification) => (
              <Card key={notification.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={notification.avatar} />
                      <AvatarFallback>
                        {notification.type === 'preferences' && <User className="h-4 w-4" />}
                        {notification.type === 'access_request' && <Bell className="h-4 w-4" />}
                        {notification.type === 'access_granted' && <CheckCircle className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-sm">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {notification.time}
                        </span>
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        {notification.type === 'access_request' && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-primary hover:bg-primary/90"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Accepter
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Refuser
                            </Button>
                          </>
                        )}
                        {notification.type === 'preferences' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Voir les changements
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {unreadNotifications.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Toutes les notifications sont lues !</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="read" className="space-y-3 mt-4">
            {readNotificationsList.map((notification) => (
              <Card key={notification.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={notification.avatar} />
                      <AvatarFallback>
                        {notification.type === 'preferences' && <User className="h-4 w-4" />}
                        {notification.type === 'access_request' && <Bell className="h-4 w-4" />}
                        {notification.type === 'access_granted' && <CheckCircle className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-sm">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {notification.time}
                          </span>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => markAsUnread(notification.id)}
                            className="text-xs"
                          >
                            Marquer non lu
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {readNotificationsList.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune notification lue</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}