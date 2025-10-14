import React, { useEffect, useState } from 'react';
import BackgroundShapes from '@/components/ui/BackgroundShapes';
import { DebugGrid } from '@/components/debug/DebugGrid';

interface PageLayoutProps {
  header?: React.ReactNode;
  children: React.ReactNode;
}

export function PageLayout({ header, children }: PageLayoutProps) {
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const qp = new URLSearchParams(window.location.search);
      const on = qp.get('shapes') === 'on';
      document.documentElement.classList.toggle('plz-shapes-debug', on);
      setDebug(on);
    }
  }, []);

  return (
    <>
      <BackgroundShapes density="mid" animated />
      {debug && (
        <div className="__shapes-probe" style={{
          position: 'fixed', left: '10%', bottom: '40%', width: 120, height: 120,
          background: 'rgba(255,0,0,.15)', zIndex: 1, pointerEvents: 'none'
        }} />
      )}
      {header}
      <main className="app-scroll">
        <div className="plz-content">
          {children}
        </div>
      </main>
    </>
  );
}
