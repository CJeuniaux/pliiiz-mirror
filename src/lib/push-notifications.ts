/**
 * Push Notifications avec OneSignal
 * Initialise et gère les notifications push Web
 */

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

export async function initPushNotifications(userId?: string) {
  if (typeof window === 'undefined') return;
  
  // Charger le SDK OneSignal
  if (!window.OneSignalDeferred) {
    window.OneSignalDeferred = [];
    
    // Charger le script OneSignal
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    document.head.appendChild(script);
  }

  // Initialiser OneSignal
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID || '',
        safari_web_id: undefined,
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerParam: { scope: '/' },
        serviceWorkerPath: 'OneSignalSDKWorker.js',
      });

      console.log('[Push] OneSignal initialized');

      // Associer l'utilisateur si connecté
      if (userId) {
        await OneSignal.login(userId);
        console.log('[Push] User logged in:', userId);
      }
    } catch (error) {
      console.error('[Push] Error initializing OneSignal:', error);
    }
  });
}

export async function requestPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.OneSignal) {
    console.warn('[Push] OneSignal not loaded');
    return false;
  }

  try {
    const permission = await window.OneSignal.Notifications.requestPermission();
    console.log('[Push] Permission:', permission);
    return permission;
  } catch (error) {
    console.error('[Push] Error requesting permission:', error);
    return false;
  }
}

export async function isPushPermissionGranted(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.OneSignal) {
    return false;
  }

  try {
    const permission = await window.OneSignal.Notifications.permission;
    return permission === true;
  } catch (error) {
    console.error('[Push] Error checking permission:', error);
    return false;
  }
}

export async function logoutPush() {
  if (typeof window === 'undefined' || !window.OneSignal) {
    return;
  }

  try {
    await window.OneSignal.logout();
    console.log('[Push] User logged out');
  } catch (error) {
    console.error('[Push] Error logging out:', error);
  }
}
