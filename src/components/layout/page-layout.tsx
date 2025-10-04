import React, { useEffect, useState } from 'react';
import BackgroundShapes from '@/components/ui/BackgroundShapes';
import { DebugGrid } from '@/components/debug/DebugGrid';

interface PageLayoutProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function PageLayout({ header, children, footer }: PageLayoutProps) {
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
    <div className="plz-app w-full max-w-full overflow-x-hidden">
      <div className="plz-bg" aria-hidden="true" />
      <BackgroundShapes density="mid" animated />
      <DebugGrid />
      {debug && (
        <div className="__shapes-probe" style={{
          position: 'fixed', left: '10%', bottom: '40%', width: 120, height: 120,
          background: 'rgba(255,0,0,.15)', zIndex: 1, pointerEvents: 'none'
        }} />
      )}
      <div className="plz-container">{/* Conteneur ROUGE 420px centré */}
        {header}
        <main className="plz-content">{/* Frame VERTE avec padding 15px */}
          {children}
        </main>
        {footer}
      </div>
    </div>
  );
}
