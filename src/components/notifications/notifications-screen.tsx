import React from "react";
import { PageHeaderMain } from "@/components/ui/page-header-main";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Check } from "lucide-react";

interface NotificationsScreenProps {
  onMarkAllRead?: () => void;
  onViewProfile?: (contactId: string) => void;
  onViewRequest?: (requestId: string) => void;
}

const notifications = [
  {
    id: "1",
    type: "preferences",
    title: "Thomas L. a mis à jour ses préférences",
    message: "Nouvelles préférences pour Anniversaire",
    time: "Il y a 2h",
    unread: true,
    contactId: "1",
    avatar: "/assets/generated/profiles/thomas.jpg"
  },
  {
    id: "2",
    type: "request",
    title: "Nouvelle demande d'accès",
    message: "Alex M. souhaite consulter ton profil pour un Dîner",
    time: "Il y a 5h",
    unread: true,
    requestId: "req_1",
    avatar: "/assets/generated/profiles/alex.jpg"
  }
];

export function NotificationsScreen({ onMarkAllRead, onViewProfile, onViewRequest }: NotificationsScreenProps) {
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeaderMain />
      <PageHeader title="Notifications" count={unreadCount} />
      
      <div className="p-4 space-y-4 overflow-y-auto pb-20" style={{ height: 'calc(100vh - 68px - 64px)' }}>
        {unreadCount > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onMarkAllRead}>
              <Check className="h-4 w-4 mr-2" />
              Tout marquer lu
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`card-clickable ${notification.unread ? 'border-primary/20 bg-gradient-to-br from-[#9600FF]/5 to-[#AEBAF8]/5' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={notification.avatar} />
                    <AvatarFallback>{notification.title.split(' ')[0].charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-sm truncate-2">{notification.title}</h3>
                      {notification.type === 'preferences' ? 
                        <Heart className="h-4 w-4 text-primary flex-shrink-0 ml-2" /> : 
                        <MessageCircle className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                      }
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 truncate-2">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{notification.time}</span>
                      {notification.type === 'request' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onViewProfile?.(notification.contactId || '')}
                          className="text-xs"
                        >
                          Voir le profil
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}