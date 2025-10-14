import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useLocation } from 'react-router-dom';
import { handleHardwareBack, closeTopMostOverlay } from '@/utils/back-handler';

export function useBackHandler() {
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = ({ canGoBack }: { canGoBack: boolean }) => {
      handleHardwareBack(canGoBack);
    };

    // Listen for hardware back button
    App.addListener('backButton', handleBackButton);

    // Web fallback - handle browser back when overlays are open
    const handlePopState = (e: PopStateEvent) => {
      if (closeTopMostOverlay()) {
        // We consumed the back: immediately push state again to keep route
        history.pushState(null, '', location.pathname + location.search);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      App.removeAllListeners();
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location]);
}