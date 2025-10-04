import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useRef } from 'react';
import { handleBack, closeTopMostOverlay } from '@/utils/back-handler';
import { getFallbackRoute } from '@/utils/navigation-fallbacks';
import { toast } from 'sonner';

interface BackNavigationOptions {
  /**
   * Custom logic to execute before standard back navigation
   * Return true to prevent standard back navigation
   */
  customHandler?: () => boolean;
  
  /**
   * Override fallback route instead of using auto-detection
   */
  fallbackRoute?: string;
  
  /**
   * Show toast when at app root
   */
  showExitToast?: boolean;
}

/**
 * Enhanced back navigation hook with centralized logic
 */
export function useEnhancedBackNavigation(options: BackNavigationOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationHistory = useRef<string[]>([]);
  
  const {
    customHandler,
    fallbackRoute,
    showExitToast = true
  } = options;

  // Track navigation history
  useEffect(() => {
    navigationHistory.current.push(location.pathname);
    
    // Keep only last 10 entries to avoid memory issues
    if (navigationHistory.current.length > 10) {
      navigationHistory.current = navigationHistory.current.slice(-10);
    }
  }, [location.pathname]);

  const goBack = useCallback(() => {
    // Step 1: Execute custom handler if provided
    if (customHandler && customHandler()) {
      return;
    }

    // Step 2: Close any open overlays/modals first
    if (closeTopMostOverlay()) {
      return;
    }

    // Step 3: Check if we have browser history
    const hasHistory = window.history.length > 1;
    const hasNavigationHistory = navigationHistory.current.length > 1;
    
    if (hasHistory && hasNavigationHistory) {
      try {
        navigate(-1);
        return;
      } catch (error) {
        console.warn('Navigate(-1) failed, using fallback:', error);
      }
    }

    // Step 4: Use fallback route
    const fallback = fallbackRoute || getFallbackRoute(location.pathname);
    
    // Avoid navigation loop
    if (fallback !== location.pathname) {
      navigate(fallback, { replace: true });
      return;
    }

    // Step 5: At app root - show exit hint
    if (showExitToast) {
      toast.info('Appuyez à nouveau pour quitter l\'application');
    }
  }, [customHandler, fallbackRoute, location.pathname, navigate, showExitToast]);

  const isAtRoot = location.pathname === '/' || location.pathname === '/home';
  
  return {
    goBack,
    isAtRoot,
    canGoBack: window.history.length > 1 || !isAtRoot,
    currentPath: location.pathname
  };
}
