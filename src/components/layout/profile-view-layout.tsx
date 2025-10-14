import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomTabBar } from '@/components/ui/bottom-tab-bar';
import { PageLayout } from '@/components/layout/page-layout';
import { AppBar } from '@/components/layout/app-bar';
import { useAuth } from '@/hooks/use-auth';

/**
 * LAYOUT POUR LES PROFILS PUBLICS
 * 
 * Affiche le BottomTabBar uniquement si l'utilisateur est connecté
 */
export function ProfileViewLayout() {
  const { user } = useAuth();
  
  return (
    <>
      <PageLayout header={<AppBar />}>
        <Outlet />
      </PageLayout>
      {user && (
        <nav className="app-tabbar">
          <BottomTabBar />
        </nav>
      )}
    </>
  );
}
