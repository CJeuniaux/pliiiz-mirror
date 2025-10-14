import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CheckCheck, MailOpen, Eye, Cake, Pencil } from "lucide-react";
import { ConsistentListContainer } from "@/components/layout/consistent-page-layout";
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar";
import { useNavigate } from "react-router-dom";

export function NotificationsScreenRedesign() {
  const navigate = useNavigate();
  const { 
    notifications,
    unreadNotifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    markAllAsUnread
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
  };

  const displayedNotifications = activeTab === "all" ? notifications : unreadNotifications;

  const getNotificationText = (notification: any) => {
    const actorName = notification.actor_name || 'Un utilisateur';
    
    switch (notification.type) {
      case 'birthday_reminder':
        return `${notification.payload?.contact_name || 'Un contact'} fête bientôt son anniversaire`;
      case 'birthday_upcoming':
        return `${actorName} fête bientôt son anniversaire`;
      case 'preferences_updated':
        return `${actorName} a mis à jour ses préférences`;
      case 'profile_updated':
        return `${actorName} a mis à jour son profil`;
      case 'contact_request':
        return `${actorName} vous a envoyé une demande de contact`;
      case 'contact_accepted':
        return `${actorName} a accepté votre demande de contact`;
      case 'regift_suggested':
        return `${actorName} vous suggère un cadeau`;
      default:
        return notification.message || actorName;
    }
  };

  const formatTimeInfo = (notification: any) => {
    // Pour les notifications d'anniversaire (birthday_reminder), afficher "J-XX"
    if (notification.type === 'birthday_reminder' && notification.payload?.days_before) {
      const days = Number(notification.payload.days_before);
      return `J-${days}`;
    }
    
    // Pour les anniversaires, afficher "dans XX jours"
    if (notification.type === 'birthday_upcoming' && notification.payload?.birthday) {
      const birthdayDate = new Date(notification.payload.birthday);
      const today = new Date();
      const thisYearBirthday = new Date(today.getFullYear(), birthdayDate.getMonth(), birthdayDate.getDate());
      
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      const daysUntil = differenceInDays(thisYearBirthday, today);
      
      if (daysUntil === 0) return "Aujourd'hui";
      if (daysUntil === 1) return "Demain";
      return `dans ${daysUntil} jours`;
    }
    
    // Pour les autres notifications, afficher "il y a XX"
    const distance = formatDistanceToNow(new Date(notification.created_at), { 
      locale: fr 
    });
    
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
    return `Il y a ${distance}`;
  };

  if (loading) {
    return (
      <ConsistentListContainer>
        <div className="text-center py-8 text-white">Chargement...</div>
      </ConsistentListContainer>
    );
  }

  return (
    <div className="pliiz-list">
      {/* Header with title and button */}
      <div className="flex items-center justify-between mb-4 notifications-header">
        <h1 className="plz-page-title p-0 flex-1">Alertes</h1>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-white/20 text-white hover:bg-white/30"
              aria-label="Tout marquer comme lu"
              title="Tout marquer comme lu"
            >
              <CheckCheck size={20} />
            </button>
          )}
          {notifications.length > 0 && unreadCount < notifications.length && (
            <button
              onClick={markAllAsUnread}
              className="btn-icon-orange w-10 h-10"
              aria-label="Tout marquer comme non lu"
              title="Tout marquer comme non lu"
            >
              <MailOpen size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 p-1 tabs-white rounded-full mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "flex-1 py-2 px-4 rounded-full font-semibold text-base transition-all",
            activeTab === "all"
              ? "tab-mauve"
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
              ? "tab-mauve"
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
                    <div className="py-3">
                      <div className="flex items-start gap-3">
                        {/* Avatar ou icône selon le type */}
                        {notification.type === 'birthday_reminder' ? (
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-500/20 flex-shrink-0">
                            <Cake className="w-5 h-5 text-white" />
                          </div>
                        ) : notification.type === 'preferences_updated' ? (
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500/20 flex-shrink-0">
                            <Pencil className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <EnhancedAvatar
                            userId={notification.actor_user_id}
                            avatarUrl={notification.actor_avatar_url}
                            name={notification.actor_name || 'Un utilisateur'}
                            size="sm"
                            className="flex-shrink-0"
                          />
                        )}
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm leading-snug">
                            {getNotificationText(notification)}
                          </p>
                          <p className="text-white/70 text-sm mt-1">
                            {formatTimeInfo(notification)}
                          </p>
                        </div>

                        {/* Bouton voir profil */}
                        {(notification.actor_user_id || (notification.type === 'birthday_reminder' && notification.payload?.contact_id)) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetId = notification.type === 'birthday_reminder' 
                                ? notification.payload?.contact_id 
                                : notification.actor_user_id;
                              navigate(`/profil/${targetId}`);
                            }}
                            className="btn-icon-orange w-10 h-10 flex-shrink-0"
                            aria-label="Voir le profil"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Separator */}
                    {index < displayedNotifications.length - 1 && (
                      <div className="h-[2px] bg-white" />
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
