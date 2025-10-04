import React, { useEffect, useState } from 'react';

interface DebugPositions {
  leftHeader: number;
  rightHeader: number;
  leftCard: number;
  rightCard: number;
}

export function DebugGrid() {
  const [active, setActive] = useState(false);
  const [positions, setPositions] = useState<DebugPositions>({
    leftHeader: 0,
    rightHeader: 0,
    leftCard: 0,
    rightCard: 0,
  });
  const [display, setDisplay] = useState({
    redLeft: 0,
    redRight: 0,
    greenLeft: 0,
    greenRight: 0,
  });

  useEffect(() => {
    // Check activation state
    const params = new URLSearchParams(window.location.search);
    const urlDebug = params.get('debug') === 'grid';
    const storageDebug = localStorage.getItem('plz.debug.grid') === '1';
    
    if (urlDebug || storageDebug) {
      setActive(true);
      document.documentElement.classList.add('debug-grid-on');
    }

    // Keyboard toggle
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'g' || e.key === 'G') {
        setActive(prev => {
          const next = !prev;
          localStorage.setItem('plz.debug.grid', next ? '1' : '0');
          document.documentElement.classList.toggle('debug-grid-on', next);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      document.documentElement.classList.remove('debug-grid-on');
    };
  }, []);

  useEffect(() => {
    if (!active) return;

    const measurePositions = () => {
      // Lignes ROUGES / VERTES calculées avec getBoundingClientRect()
      const container = document.querySelector('.plz-container') as HTMLElement;

      // Base: position absolue du conteneur (bords externes)
      let baseLeft = 0;
      let baseRight = window.innerWidth;
      let containerWidth = window.innerWidth;

      if (container) {
        const rect = container.getBoundingClientRect();
        baseLeft = rect.left;
        baseRight = rect.right;
        containerWidth = rect.width;
      } else {
        // Fallback: centrer 420px (au cas où .plz-container n'existe pas encore)
        const maxWidth = 420;
        const center = window.innerWidth / 2;
        const halfWidth = Math.min(window.innerWidth, maxWidth) / 2;
        baseLeft = center - halfWidth;
        baseRight = center + halfWidth;
        containerWidth = baseRight - baseLeft;
      }

      // Gutter depuis variable CSS (fallback 15px)
      const root = (container as HTMLElement) || document.documentElement;
      const gutterVar = getComputedStyle(root).getPropertyValue('--plz-green-gutter').trim();
      const gutter = Number.isNaN(parseFloat(gutterVar)) ? 15 : parseFloat(gutterVar);

      // Définition correcte:
      // - ROUGE = bords externes du conteneur
      // - VERT = ROUGE ± gutter (15px)
      const leftRedAbsolute = baseLeft;
      const rightRedAbsolute = baseRight;

      const leftGreenAbsolute = baseLeft + gutter;      // 30px si baseLeft=15 et gutter=15
      const rightGreenAbsolute = baseRight - gutter;    // 345px si width=360

      const newPositions = {
        leftHeader: leftRedAbsolute,
        rightHeader: rightRedAbsolute,
        leftCard: leftGreenAbsolute,
        rightCard: rightGreenAbsolute,
      };

      setPositions(newPositions);

      // Log utilitaire
      console.log('[DebugGrid] viewport -> Rouge(L,R):', Math.round(leftRedAbsolute), Math.round(rightRedAbsolute), '| Vert(L,R):', Math.round(leftGreenAbsolute), Math.round(rightGreenAbsolute), '| width:', Math.round(containerWidth));
    };

    // Mesurer immédiatement
    measurePositions();

    // Observer resize
    const handleResize = () => {
      measurePositions();
    };

    window.addEventListener('resize', handleResize);

    // Observer changements DOM (apparition de cartes)
    const observer = new MutationObserver(() => {
      measurePositions();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Observer resize du header
    const headerElement = document.querySelector('.plz-header-main');
    const resizeObserver = new ResizeObserver(() => {
      measurePositions();
    });

    if (headerElement) {
      resizeObserver.observe(headerElement);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [active]);

  if (!active) return null;

  return (
    <>
      <style>{`
        .debug-grid-line {
          position: fixed;
          top: 0;
          bottom: 0;
          width: 2px;
          opacity: 0.8;
          pointer-events: none;
          z-index: 9999;
        }

        .debug-grid-line-red {
          background: red;
        }

        .debug-grid-line-green {
          background: lime;
        }
      `}</style>

      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9999 }}
        aria-hidden="true"
      >
        {/* Grille 8px de fond */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(255,0,0,0.1) 0px, rgba(255,0,0,0.1) 1px, transparent 1px, transparent 8px),
              repeating-linear-gradient(90deg, rgba(255,0,0,0.1) 0px, rgba(255,0,0,0.1) 1px, transparent 1px, transparent 8px)
            `,
            backgroundSize: '8px 8px',
            opacity: 0.2,
          }}
        />

        {/* Lignes ROUGES - bords du .plz-container */}
        <div
          className="debug-grid-line debug-grid-line-red"
          style={{ left: `${positions.leftHeader}px` }}
          title="ROUGE LEFT (.plz-container left)"
        />
        <div
          className="debug-grid-line debug-grid-line-red"
          style={{ left: `${positions.rightHeader}px` }}
          title="ROUGE RIGHT (.plz-container right)"
        />

        {/* Lignes VERTES - 15px à l'intérieur des lignes rouges */}
        <div
          className="debug-grid-line debug-grid-line-green"
          style={{ left: `${positions.leftCard}px` }}
          title="VERT LEFT (ROUGE +15px)"
        />
        <div
          className="debug-grid-line debug-grid-line-green"
          style={{ left: `${positions.rightCard}px` }}
          title="VERT RIGHT (ROUGE -15px)"
        />

        {/* Badge d'activation */}
        <div
          className="fixed top-4 right-4 bg-red-500/90 text-white px-3 py-1 rounded text-xs font-mono shadow-lg z-[10001]"
          style={{ pointerEvents: 'auto' }}
        >
          🔴 DEBUG GRID (Press G)
        </div>

        {/* Info positions - viewport absolu */}
        <div
          className="fixed bottom-4 right-4 bg-black/90 text-white px-3 py-2 rounded text-[11px] font-mono z-[10001] leading-tight"
          style={{ pointerEvents: 'none' }}
        >
          <div className="font-bold mb-1">POSITIONS RÉELLES (viewport):</div>
          <div>🔴 ROUGE: Left: {positions.leftHeader.toFixed(0)}px | Right: {positions.rightHeader.toFixed(0)}px</div>
          <div>🟢 VERT: Left: {positions.leftCard.toFixed(0)}px | Right: {positions.rightCard.toFixed(0)}px</div>
          <div className="mt-1 opacity-70">Container width: {(positions.rightHeader - positions.leftHeader).toFixed(0)}px</div>
        </div>
      </div>
    </>
  );
}
