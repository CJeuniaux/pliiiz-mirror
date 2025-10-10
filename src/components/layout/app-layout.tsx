import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabBar } from '@/components/ui/bottom-tab-bar';
import { PageLayout } from '@/components/layout/page-layout';
import { AppBar } from '@/components/layout/app-bar';

/**
 * LAYOUT PRINCIPAL DE L'APPLICATION
 * 
 * Structure :
 * - PageLayout (background + shapes)
 * - AppBar (avec bouton retour sur pages secondaires)
 * - main (contenu des pages via Outlet)
 * - BottomTabBar (navigation)
 */
export function AppLayout() {
  const location = useLocation();
  const [backHandler, setBackHandler] = React.useState<(() => void) | undefined>();

  return (
    <>
      <PageLayout
        header={<AppBar onBackClick={backHandler} />}
      >
        <Outlet context={{ setBackHandler }} />
      </PageLayout>
      <nav className="app-tabbar">
        <BottomTabBar />
      </nav>
    </>
  );
}