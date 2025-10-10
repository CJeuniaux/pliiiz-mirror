/**
 * MAPS UNIFIED UTILITIES
 * 
 * Robust URL building and opening strategy for maps services
 * Handles sandbox restrictions and provides fallbacks
 */

export interface MapLocation {
  lat: number;
  lng: number;
  name?: string;
}

export interface MapUrls {
  web: string;
  deepLink?: string;
  androidFallback?: string;
}

/**
 * Build URLs for different map providers
 */
export class MapsUrlBuilder {
  static googleMaps(location: MapLocation): MapUrls {
    const { lat, lng, name } = location;
    
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid coordinates provided');
    }

    // Web URL with proper API format
    let webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    if (name) {
      webUrl += `&query=${encodeURIComponent(name)}`;
    }

    // Deep link for mobile apps
    const deepLink = name 
      ? `comgooglemaps://?q=${encodeURIComponent(name)}&center=${lat},${lng}&zoom=17`
      : `comgooglemaps://?center=${lat},${lng}&zoom=17`;

    // Android fallback (geo: protocol)
    const androidFallback = name
      ? `geo:${lat},${lng}?q=${encodeURIComponent(name)}`
      : `geo:${lat},${lng}`;

    return { web: webUrl, deepLink, androidFallback };
  }

  static waze(location: MapLocation): MapUrls {
    const { lat, lng, name } = location;
    
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid coordinates provided');
    }

    // Web URL
    let webUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&zoom=17`;
    if (name) {
      webUrl += `&q=${encodeURIComponent(name)}`;
    }

    // Deep link for mobile app
    const deepLink = `waze://?ll=${lat},${lng}&navigate=yes`;

    return { web: webUrl, deepLink };
  }

  static appleMaps(location: MapLocation): MapUrls {
    const { lat, lng, name } = location;
    
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid coordinates provided');
    }

    // Web URL
    let webUrl = `https://maps.apple.com/?ll=${lat},${lng}`;
    if (name) {
      webUrl += `&q=${encodeURIComponent(name)}`;
    }

    // Deep link for mobile app
    const deepLink = webUrl.replace('https://', 'maps://');

    return { web: webUrl, deepLink };
  }
}

/**
 * Device detection utilities
 */
export class DeviceDetector {
  static isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  static isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }
}

/**
 * Sandbox-proof URL opener with fallbacks
 */
export class SafeUrlOpener {
  private static async copyToClipboard(url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      } catch {
        return false;
      }
    }
  }

  private static tryDeepLink(url: string, timeout = 800): Promise<boolean> {
    return new Promise((resolve) => {
      const start = Date.now();
      
      // Create invisible iframe to trigger deep link
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);

      // Check if app opened by monitoring visibility
      const checkAppOpened = () => {
        const elapsed = Date.now() - start;
        if (elapsed > timeout) {
          document.body.removeChild(iframe);
          resolve(false);
        } else if (document.hidden || elapsed > 100) {
          // App likely opened if page became hidden quickly
          document.body.removeChild(iframe);
          resolve(true);
        } else {
          setTimeout(checkAppOpened, 50);
        }
      };

      setTimeout(checkAppOpened, 50);
    });
  }

  private static createSafeLink(url: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    
    try {
      link.click();
    } catch (error) {
      console.warn('Direct link click failed:', error);
      throw error;
    } finally {
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
    }
  }

  static async openUrl(
    urls: MapUrls, 
    onSuccess?: () => void,
    onFallback?: (url: string) => void
  ): Promise<void> {
    const isMobile = DeviceDetector.isMobile();
    
    try {
      // Mobile strategy: try deep link first
      if (isMobile && urls.deepLink) {
        console.log('Attempting deep link:', urls.deepLink);
        const deepLinkSuccess = await this.tryDeepLink(urls.deepLink);
        
        if (deepLinkSuccess) {
          console.log('Deep link successful');
          onSuccess?.();
          return;
        }
        
        // Try Android fallback if available
        if (DeviceDetector.isAndroid() && urls.androidFallback) {
          console.log('Trying Android fallback:', urls.androidFallback);
          const androidSuccess = await this.tryDeepLink(urls.androidFallback);
          if (androidSuccess) {
            console.log('Android fallback successful');
            onSuccess?.();
            return;
          }
        }
      }

      // Desktop/fallback strategy: use safe link creation
      console.log('Opening web URL:', urls.web);
      this.createSafeLink(urls.web);
      onSuccess?.();
      
    } catch (error) {
      console.warn('Failed to open URL, falling back to clipboard:', error);
      
      // Ultimate fallback: copy to clipboard
      const copied = await this.copyToClipboard(urls.web);
      if (copied) {
        onFallback?.(urls.web);
      } else {
        throw new Error('All opening methods failed');
      }
    }
  }
}

/**
 * Main interface for opening map locations
 */
export class MapsLauncher {
  static async openGoogleMaps(
    location: MapLocation,
    onSuccess?: () => void,
    onFallback?: (url: string) => void
  ): Promise<void> {
    console.log('openExternal(google-maps)', { lat: location.lat, lng: location.lng, name: location.name });
    
    try {
      const urls = MapsUrlBuilder.googleMaps(location);
      console.log('Google Maps URLs:', urls);
      await SafeUrlOpener.openUrl(urls, onSuccess, onFallback);
    } catch (error) {
      console.error('Google Maps opening failed:', error);
      throw error;
    }
  }

  static async openWaze(
    location: MapLocation,
    onSuccess?: () => void,
    onFallback?: (url: string) => void
  ): Promise<void> {
    console.log('openExternal(waze)', { lat: location.lat, lng: location.lng, name: location.name });
    
    try {
      const urls = MapsUrlBuilder.waze(location);
      console.log('Waze URLs:', urls);
      await SafeUrlOpener.openUrl(urls, onSuccess, onFallback);
    } catch (error) {
      console.error('Waze opening failed:', error);
      throw error;
    }
  }

  static async openAppleMaps(
    location: MapLocation,
    onSuccess?: () => void,
    onFallback?: (url: string) => void
  ): Promise<void> {
    console.log('openExternal(apple-maps)', { lat: location.lat, lng: location.lng, name: location.name });
    
    try {
      const urls = MapsUrlBuilder.appleMaps(location);
      console.log('Apple Maps URLs:', urls);
      await SafeUrlOpener.openUrl(urls, onSuccess, onFallback);
    } catch (error) {
      console.error('Apple Maps opening failed:', error);
      throw error;
    }
  }

  static isValidLocation(location: Partial<MapLocation>): location is MapLocation {
    return typeof location.lat === 'number' && 
           typeof location.lng === 'number' && 
           !isNaN(location.lat) && 
           !isNaN(location.lng) &&
           Math.abs(location.lat) <= 90 &&
           Math.abs(location.lng) <= 180;
  }
}

/**
 * Legacy compatibility function
 * @deprecated Use MapsLauncher.openGoogleMaps instead
 */
export function openMapsSearch(
  label: string,
  city?: string,
  lat?: number,
  lng?: number
): void {
  // Convert legacy parameters to new format
  const location: MapLocation = {
    lat: lat || 0,
    lng: lng || 0,
    name: city ? `${label} ${city}` : label
  };

  // If we don't have valid coordinates, try to open a search
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    const searchQuery = city ? `${label} ${city}` : label;
    const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  // Use new system with valid coordinates
  MapsLauncher.openGoogleMaps(location).catch(error => {
    console.warn('Legacy openMapsSearch fallback:', error);
    // Final fallback
    const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  });
}