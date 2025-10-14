import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  price_level?: number;
  opening_hours?: {
    open_now?: boolean;
  };
  distance?: number;
}

interface UserLocation {
  lat: number;
  lng: number;
}

export function useGooglePlaces() {
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<GooglePlace[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchNearbyPlaces = async (
    query: string,
    userLocation: UserLocation,
    radius: number = 100000
  ): Promise<{ data?: GooglePlace[]; error?: any }> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: {
          query,
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius
        }
      });

      if (error) {
        console.error('Places search error:', error);
        setError('Erreur lors de la recherche des magasins');
        return { error };
      }

      if (data.error) {
        console.error('Places API error:', data.error);
        setError(data.error);
        return { error: data.error };
      }

      const placesData = data.results || [];
      setPlaces(placesData);
      return { data: placesData };

    } catch (error) {
      console.error('Places search exception:', error);
      setError('Erreur de connexion');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const generateGoogleMapsLink = (place: GooglePlace, userLocation?: UserLocation): string => {
    if (place.place_id) {
      return `https://www.google.com/maps/search/?api=1&query=place_id:${encodeURIComponent(place.place_id)}`;
    }
    
    const { lat, lng } = place.geometry.location;
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  const openInNativeMaps = (place: GooglePlace) => {
    const { lat, lng } = place.geometry.location;
    const query = encodeURIComponent(place.name);
    
    // Détecter la plateforme et ouvrir l'app appropriée
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    let url: string;
    
    if (isIOS) {
      url = `maps://?q=${query}&ll=${lat},${lng}`;
    } else if (isAndroid) {
      url = `geo:${lat},${lng}?q=${lat},${lng}(${query})`;
    } else {
      // Fallback vers Google Maps web
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    window.open(url, '_blank');
  };

  return {
    searchNearbyPlaces,
    generateGoogleMapsLink,
    openInNativeMaps,
    places,
    loading,
    error
  };
}