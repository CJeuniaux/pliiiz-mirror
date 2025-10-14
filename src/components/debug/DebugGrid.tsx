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
      // Lignes ROUGES = bords du conteneur ± --plz-outer-margin
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      const outer = parseFloat(styles.getPropertyValue('--plz-outer-margin')) || 15;

      // Utiliser le conteneur app-shell au lieu de window.innerWidth
      const appContainer = document.querySelector('#pliiiz-app') || document.querySelector('.app-shell') || document.body;
      const containerRect = appContainer.getBoundingClientRect();
      const containerLeft = containerRect.left;
      const containerWidth = containerRect.width;

      const leftRedAbsolute = containerLeft + outer;                     // 15px du bord gauche du conteneur
      const rightRedAbsolute = containerLeft + containerWidth - outer;   // 15px du bord droit du conteneur

      const newPositions = {
        leftHeader: leftRedAbsolute,
        rightHeader: rightRedAbsolute,
        leftCard: 0,
        rightCard: 0,
      };

      setPositions(newPositions);

      // Log utilitaire
      console.log('[DebugGrid] Container:', Math.round(containerWidth), 'px | Rouge(L,R):', Math.round(leftRedAbsolute), Math.round(rightRedAbsolute));
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
          background: red !important;
        }

        .debug-grid-line-green {
          background: lime !important;
        }

        .debug-grid-bg {
          background-image: 
            repeating-linear-gradient(0deg, rgba(255,0,0,0.1) 0px, rgba(255,0,0,0.1) 1px, transparent 1px, transparent 8px),
            repeating-linear-gradient(90deg, rgba(255,0,0,0.1) 0px, rgba(255,0,0,0.1) 1px, transparent 1px, transparent 8px)
            !important;
          background-size: 8px 8px !important;
          opacity: 0.2 !important;
        }
      `}</style>

      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9999 }}
        aria-hidden="true"
      >
        {/* Grille 8px de fond */}
        <div
          className="absolute inset-0 debug-grid-bg"
          style={{}}
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
          <div className="mt-1 opacity-70">Container width: {(positions.rightHeader - positions.leftHeader).toFixed(0)}px</div>
        </div>
      </div>
    </>
  );
}
