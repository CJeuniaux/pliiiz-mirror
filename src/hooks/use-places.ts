import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Place {
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
  distance?: number; // Calculée côté client
}

interface UserLocation {
  lat: number;
  lng: number;
}

export function usePlaces() {
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);

  // Calculer la distance haversine entre deux points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const searchNearbyPlaces = async (
    giftName: string, 
    userLocation: UserLocation, 
    radius: number = 50000
  ): Promise<{ data?: Place[]; error?: any }> => {
    setLoading(true);
    try {
      const query = `${giftName} boutique magasin`;
      
      const { data, error } = await supabase.functions.invoke('places-proxy', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: new URLSearchParams({
          q: query,
          lat: userLocation.lat.toString(),
          lng: userLocation.lng.toString(),
          radius: radius.toString()
        })
      });

      if (error) {
        console.error('Places search error:', error);
        return { error };
      }

      if (data.error) {
        console.error('Places API error:', data.error);
        return { error: data.error };
      }

      // Ajouter la distance calculée à chaque lieu
      const placesWithDistance = (data.results || []).map((place: Place) => ({
        ...place,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          place.geometry.location.lat,
          place.geometry.location.lng
        )
      }));

      // Trier par distance
      placesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setPlaces(placesWithDistance);
      return { data: placesWithDistance };

    } catch (error) {
      console.error('Places search exception:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const generateGoogleMapsLink = (place: Place, userLocation?: UserLocation): string => {
    const { lat, lng } = place.geometry.location;
    const query = encodeURIComponent(place.name);

    if (userLocation) {
      // Lien avec directions depuis la position de l'utilisateur
      return `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${lat},${lng}/@${lat},${lng},15z`;
    } else {
      // Lien simple vers le lieu
      return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${place.place_id}`;
    }
  };

  const openInNativeMaps = (place: Place) => {
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
    calculateDistance
  };
}