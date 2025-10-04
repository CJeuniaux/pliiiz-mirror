import { useState, useCallback } from 'react';

export interface UserLocation {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  source: 'gps' | 'ip' | 'cache' | 'fallback';
}

const CACHE_KEY = 'pliiiz:lastPos';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

export function useRobustGeolocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const getCachedLocation = (): UserLocation | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { location, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return { ...location, source: 'cache' };
        }
      }
    } catch (error) {
      console.error('Erreur lecture cache géoloc:', error);
    }
    return null;
  };

  const cacheLocation = (location: UserLocation) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        location,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Erreur sauvegarde cache géoloc:', error);
    }
  };

  const getLocationFromIP = async (): Promise<UserLocation> => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      return {
        lat: data.latitude || 48.8566,
        lng: data.longitude || 2.3522,
        city: data.city || 'Paris',
        country: data.country_name || 'France',
        source: 'ip'
      };
    } catch (error) {
      console.error('Erreur géoloc IP:', error);
      throw error;
    }
  };

  const getFallbackLocation = (): UserLocation => {
    // Paris comme fallback final
    return {
      lat: 48.8566,
      lng: 2.3522,
      city: 'Paris',
      country: 'France',
      source: 'fallback'
    };
  };

  const getCurrentLocation = useCallback(async (): Promise<UserLocation> => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    try {
      // 1. Vérifier le cache en premier
      const cachedLocation = getCachedLocation();
      if (cachedLocation) {
        setLocation(cachedLocation);
        setLoading(false);
        return cachedLocation;
      }

      // 2. Essayer la géolocalisation GPS
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              { 
                enableHighAccuracy: false, 
                timeout: 8000, 
                maximumAge: 10 * 60 * 1000 // 10 minutes
              }
            );
          });

          const gpsLocation: UserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            city: 'Position actuelle',
            country: 'GPS',
            source: 'gps'
          };

          cacheLocation(gpsLocation);
          setLocation(gpsLocation);
          setLoading(false);
          return gpsLocation;

        } catch (gpsError: any) {
          console.error('Erreur géolocalisation GPS:', gpsError);
          
          if (gpsError.code === gpsError.PERMISSION_DENIED) {
            setPermissionDenied(true);
            setError('Permission de géolocalisation refusée');
          }
        }
      }

      // 3. Fallback vers géolocalisation IP
      try {
        const ipLocation = await getLocationFromIP();
        cacheLocation(ipLocation);
        setLocation(ipLocation);
        setLoading(false);
        return ipLocation;
      } catch (ipError) {
        console.error('Erreur géoloc IP:', ipError);
      }

      // 4. Fallback final
      const fallbackLocation = getFallbackLocation();
      setLocation(fallbackLocation);
      setLoading(false);
      return fallbackLocation;

    } catch (error) {
      console.error('Erreur géolocalisation complète:', error);
      const fallbackLocation = getFallbackLocation();
      setLocation(fallbackLocation);
      setError('Impossible de déterminer votre position');
      setLoading(false);
      return fallbackLocation;
    }
  }, []);

  const retry = useCallback(() => {
    setPermissionDenied(false);
    return getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    location,
    loading,
    error,
    permissionDenied,
    getCurrentLocation,
    retry
  };
}