import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function NotificationsScreenRedesign() {
  const { 
    notifications,
    unreadNotifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    getNotificationText 
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
  };

  const displayedNotifications = activeTab === "all" ? notifications : unreadNotifications;

  const formatTimeAgo = (dateString: string) => {
    const distance = formatDistanceToNow(new Date(dateString), { 
      locale: fr 
    });
    
    // Simplifier le format
    if (distance.includes('minute')) {
      const mins = parseInt(distance);
      return `Il y a ${mins} min`;
    }
    if (distance.includes('heure')) {
      const hours = parseInt(distance);
      return `Il y a ${hours} h`;
    }
    if (distance.includes('jour')) {
      const days = parseInt(distance);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
    return distance;
  };

  if (loading) {
    return (
      <div className="pliiz-list">
        <div className="text-center py-8 text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="pliiz-list">
      {/* Tabs */}
      <div className="flex gap-0 p-1 bg-white/25 backdrop-blur-sm rounded-full mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "flex-1 py-2 px-4 rounded-full font-semibold text-base transition-all",
            activeTab === "all"
              ? "bg-gradient-to-r from-[#7b4bff] to-[#9b5fff] text-white shadow-lg"
              : "text-[#5b3bb8] bg-transparent"
          )}
        >
          Toutes
        </button>
        <button
          onClick={() => setActiveTab("unread")}
          className={cn(
            "flex-1 py-2 px-4 rounded-full font-semibold text-base transition-all",
            activeTab === "unread"
              ? "bg-gradient-to-r from-[#7b4bff] to-[#9b5fff] text-white shadow-lg"
              : "text-[#5b3bb8] bg-transparent"
          )}
        >
          Non lues ({unreadCount})
        </button>
      </div>

      {/* Notifications Card */}
      <Card className="bg-white/15 backdrop-blur-md border-2 border-white/30 rounded-3xl p-6 shadow-xl">
        <div className="space-y-0">
          {displayedNotifications.length > 0 ? (
            <>
              {displayedNotifications.map((notification, index) => {
                const isRead = !!notification.read_at;
                return (
                  <div key={notification.id}>
                    <div
                      onClick={() => handleNotificationClick(notification.id, isRead)}
                      className="py-4 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-start gap-4">
                        {/* Indicator dot */}
                        <div className={cn(
                          "w-3 h-3 rounded-full flex-shrink-0 mt-1",
                          isRead ? "bg-white/30" : "bg-[#5b3bb8]"
                        )} />
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-base leading-snug">
                            {getNotificationText(notification)}
                          </p>
                          <p className="text-white/70 text-sm mt-1">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>

                        {/* Lu badge */}
                        <div className={cn(
                          "px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0",
                          isRead 
                            ? "bg-gradient-to-r from-pink-200 to-purple-200 text-[#5b3bb8]"
                            : "bg-white/20 text-white/50"
                        )}>
                          Lu
                        </div>
                      </div>
                    </div>
                    
                    {/* Separator */}
                    {index < displayedNotifications.length - 1 && (
                      <div className="h-px bg-white/20" />
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/80 text-lg">
                {activeTab === "unread" 
                  ? "Aucune notification non lue." 
                  : "Aucune notification."}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
