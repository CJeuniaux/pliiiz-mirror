import { Compass, MessageCircle, Users, Bell, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface TabItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  visible?: boolean;
}

interface TabBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  badges: {
    pendingRequestsCount?: number;
    unreadCount?: number;
    eventsCount?: number;
  };
}

export function TabBar({ 
  currentTab, 
  onTabChange, 
  badges
}: TabBarProps) {
  
  const tabs: TabItem[] = [
    {
      key: "home",
      icon: Compass,
      label: "Accueil",
      visible: true
    },
    // TEMPORAIREMENT DÉSACTIVÉ - Pour réactiver, changer visible: false en visible: true
    {
      key: "calendar",
      icon: Calendar,
      label: "Calendrier",
      badge: badges.eventsCount,
      visible: false  // Changé de true à false pour masquer temporairement
    },
    {
      key: "contacts",
      icon: Users,
      label: "Mes contacts",
      visible: true
    },
    {
      key: "notifications",
      icon: Bell,
      label: "Notifications",
      badge: badges.unreadCount,
      visible: true
    },
    {
      key: "profile",
      icon: User,
      label: "Profil",
      visible: true
    }
  ];

  const visibleTabs = tabs.filter(tab => tab.visible);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50" style={{ height: '64px' }}>
      <div className="flex items-center justify-around h-full px-2">
        {visibleTabs.map((tab) => {
          const isActive = currentTab === tab.key;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "flex items-center justify-center min-w-0 flex-1 h-full relative",
                "transition-colors duration-200 touch-manipulation active:scale-95",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={`Onglet ${tab.label}`}
              role="tab"
              aria-selected={isActive}
            >
              <Icon 
                className={cn(
                  "h-6 w-6",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} 
              />
               {tab.badge && tab.badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 text-xs flex items-center justify-center p-0 min-w-[1rem] rounded-full bg-primary text-primary-foreground border-0"
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}