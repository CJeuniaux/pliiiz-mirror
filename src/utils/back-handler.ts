import { toast } from 'sonner';
import { App } from '@capacitor/app';

// Double-back to exit state
let lastBackTs = 0;

export function armDoubleBackToExit(ms = 2000) {
  lastBackTs = Date.now();
}

export function shouldExitNow() {
  return Date.now() - lastBackTs < 2000;
}

// Overlay management - check for open modals, sheets, drawers
export function closeTopMostOverlay(): boolean {
  // Check for open dialogs/modals
  const openDialog = document.querySelector('[data-state="open"][role="dialog"]');
  if (openDialog) {
    // Find and click the close button or trigger escape
    const closeButton = openDialog.querySelector('[aria-label*="fermer" i], [aria-label*="close" i]') as HTMLElement;
    if (closeButton) {
      closeButton.click();
      return true;
    }
    // Fallback: trigger escape key
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    openDialog.dispatchEvent(escapeEvent);
    return true;
  }

  // Check for open sheets/drawers
  const openSheet = document.querySelector('[data-state="open"][role="dialog"][data-vaul-drawer]');
  if (openSheet) {
    const closeButton = openSheet.querySelector('[aria-label*="fermer" i], [aria-label*="close" i]') as HTMLElement;
    if (closeButton) {
      closeButton.click();
      return true;
    }
    return true;
  }

  // Check for open dropdowns
  const openDropdown = document.querySelector('[data-state="open"][role="menu"]');
  if (openDropdown) {
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    openDropdown.dispatchEvent(escapeEvent);
    return true;
  }

  return false;
}

// Nested view navigation (for future use)
export function goBackInNestedView(): boolean {
  // For now, return false - can be extended for tab-specific navigation
  // Example: if we have nested views within tabs that need special handling
  return false;
}

// Main back handler - use everywhere  
export function handleBack(): boolean {
  // Priority 1: Close overlays first
  if (closeTopMostOverlay()) {
    return true; // Consumed the back action
  }

  // Priority 2: Handle nested views
  if (goBackInNestedView()) {
    return true;
  }

  // Priority 3: Router navigation - enhanced check
  const hasRealHistory = window.history.length > 1;
  const isStandaloneApp = window.matchMedia('(display-mode: standalone)').matches;
  
  if (hasRealHistory) {
    try {
      window.history.back();
      return true;
    } catch (error) {
      console.warn('History back failed:', error);
      // Will fall through to fallback logic
    }
  }

  // Priority 4: At app root or no history available
  if (isStandaloneApp || isAtAppRoot()) {
    toast.info('Appuyez à nouveau pour quitter l\'application');
    armDoubleBackToExit(2000);
  }
  
  return false; // Let caller handle fallback navigation
}

// Check if we're at app root
export function isAtAppRoot(): boolean {
  const path = window.location.pathname;
  return path === '/' || path === '/home';
}

// Handle hardware back for Capacitor
export function handleHardwareBack(canGoBack: boolean): void {
  // Priority 1-3: Use shared handler
  if (handleBack()) {
    return; // Handled by shared logic
  }

  // Priority 4: At root with Capacitor - check for double-back to exit
  if (shouldExitNow()) {
    App.exitApp();
  }
}