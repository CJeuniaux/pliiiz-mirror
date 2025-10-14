import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { RequestCard } from "@/components/ui/request-card";

const allNotifications = [
  {
    id: "1",
    type: "preferences" as const,
    actorName: "Thomas",
    subtitle: "a mis à jour ses préférences",
    avatarUrl: undefined,
    time: "Il y a 2h",
    isRead: false
  },
  {
    id: "2", 
    type: "access_request" as const,
    actorName: "Marie",
    subtitle: "souhaite consulter vos préférences",
    avatarUrl: undefined,
    time: "Il y a 4h",
    isRead: false
  },
  {
    id: "3",
    type: "access_granted" as const,
    actorName: "Alex",
    subtitle: "peut maintenant voir vos préférences",
    avatarUrl: undefined,
    time: "Hier",
    isRead: true
  },
  {
    id: "4",
    type: "preferences" as const,
    actorName: "Zoé",
    subtitle: "a partagé ses allergies",
    avatarUrl: undefined,
    time: "Il y a 2 jours",
    isRead: true
  }
];

export function NotificationsScreenStandardized() {
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set(["3", "4"]));
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  
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

  const currentNotifications = activeTab === 'unread' ? unreadNotifications : readNotificationsList;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="plz-page-title p-0 flex-1">
          Notifications
          {unreadCount > 0 && ` (${unreadCount})`}
        </h1>
      </div>
      
      {/* Onglets */}
      <div className="pliiz-tabs">
        <button 
          className={`pliiz-tab ${activeTab === 'unread' ? 'is-active' : ''}`} 
          onClick={() => setActiveTab('unread')}
        >
          À lire ({unreadCount})
        </button>
        <button 
          className={`pliiz-tab ${activeTab === 'read' ? 'is-active' : ''}`} 
          onClick={() => setActiveTab('read')}
        >
          Lues ({readNotificationsList.length})
        </button>
      </div>

      {/* Liste des notifications */}
      <div className="pliiz-list">
        {currentNotifications.length === 0 ? (
          <div className="plz-card text-center py-12">
            <div className="opacity-80">
              {activeTab === 'unread' ? (
                <p className="font-medium">Aucune notification à lire</p>
              ) : (
                <p className="font-medium">Aucune notification lue</p>
              )}
            </div>
          </div>
        ) : (
          currentNotifications.map(notification => (
            <RequestCard
              key={notification.id}
              title={notification.actorName}
              subtitle={notification.subtitle}
              avatarUrl={notification.avatarUrl}
              rightSlot={
                <div className="flex flex-col items-end gap-2">
                  {!notification.isRead && activeTab === 'unread' && (
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                  )}
                  
                  {notification.type === 'access_request' && activeTab === 'unread' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Refuser
                      </Button>
                    </div>
                  )}
                  
                  {notification.type === 'preferences' && activeTab === 'unread' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                      onClick={() => markAsRead(notification.id)}
                    >
                      OK
                    </Button>
                  )}

                  {activeTab === 'read' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/80 hover:text-white text-xs"
                      onClick={() => markAsUnread(notification.id)}
                    >
                      Marquer non lu
                    </Button>
                  )}
                </div>
              }
            />
          ))
        )}
      </div>
    </>
  );
}
