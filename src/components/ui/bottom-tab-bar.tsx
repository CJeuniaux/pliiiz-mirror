import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Heart, Users, Bell, User } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';

interface TabProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badgeCount?: number;
}

function Tab({ to, icon, label, badgeCount }: TabProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        `flex flex-col items-center justify-center py-2 px-1 transition-colors duration-200 ${
          isActive ? 'is-active' : ''
        }`
      }
      aria-label={label}
      end={to === '/home'}
    >
      {({ isActive }) => (
        <>
           <div className="relative mb-1">
             {React.cloneElement(icon as React.ReactElement, { 
               fill: isActive ? 'currentColor' : 'none' 
             })}
           </div>
           <span className="text-xs font-medium">
             {label === 'Alertes' ? (badgeCount && badgeCount > 0 ? `Alertes (${badgeCount})` : 'Alertes') : label}
           </span>
        </>
      )}
    </NavLink>
  );
}

export function BottomTabBar() {
  const { unreadCount } = useNotifications();
  
  const tabs = [
    { to: '/home', icon: <Home size={22} strokeWidth={1.5} />, label: 'Accueil' },
    { to: '/requests', icon: <Heart size={22} strokeWidth={1.5} />, label: 'Demandes' },
    { to: '/contacts', icon: <Users size={22} strokeWidth={1.5} />, label: 'Contacts' },
    { to: '/notifications', icon: <Bell size={22} strokeWidth={1.5} />, label: 'Alertes', badgeCount: unreadCount },
    { to: '/profile', icon: <User size={22} strokeWidth={1.5} />, label: 'Profil' },
  ];

  return (
    <nav 
      className="pliiz-bottomnav"
      style={{
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))'
      }}
      role="navigation" 
      aria-label="Navigation principale"
    >
      {tabs.map((tab) => (
        <Tab key={tab.to} to={tab.to} icon={tab.icon} label={tab.label} badgeCount={tab.badgeCount} />
      ))}
    </nav>
  );
}