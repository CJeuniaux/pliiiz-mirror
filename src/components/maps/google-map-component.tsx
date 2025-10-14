import React, { useEffect, useRef, useState } from 'react';
import { GooglePlace } from '@/hooks/use-google-places';
import { supabase } from '@/integrations/supabase/client';

interface GoogleMapComponentProps {
  center: [number, number];
  places: GooglePlace[];
  userLocation?: [number, number];
  onPlaceClick?: (place: GooglePlace) => void;
  selectedPlaceId?: string;
  giftItem?: string;
}

declare global {
  interface Window {
    google: any;
    initOfferMap: () => void;
    __offer?: {
      map: any;
      center: { lat: number; lng: number };
      infoWindow: any;
    };
    __giftItem?: string;
  }
}

export function GoogleMapComponent({ 
  center, 
  places, 
  userLocation, 
  onPlaceClick, 
  selectedPlaceId,
  giftItem 
}: GoogleMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const markersRef = useRef<any[]>([]);

  // Calculer la distance haversine
  const haversine = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
    const toRad = (d: number) => d * Math.PI/180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
    return 2*R*Math.asin(Math.sqrt(s));
  };

  // Obtenir le centre avec fallback
  const getCenter = async (): Promise<{ lat: number; lng: number }> => {
    const fallback = { lat: 50.8466, lng: 4.3528 }; // Brussels
    
    if (userLocation) {
      return { lat: userLocation[0], lng: userLocation[1] };
    }

    try {
      const pos = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null),
          { timeout: 8000 }
        );
      });
      return pos || fallback;
    } catch (error) {
      return fallback;
    }
  };

  // Initialiser la carte
  const initOfferMap = async () => {
    if (!mapRef.current || !window.google) return;

    try {
      const mapCenter = await getCenter();
      
      const map = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        disableDefaultUI: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Marqueur de position utilisateur
      new window.google.maps.Marker({
        map,
        position: mapCenter,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#673ab7',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        }
      });

      const infoWindow = new window.google.maps.InfoWindow();

      window.__offer = { map, center: mapCenter, infoWindow };
      window.__giftItem = giftItem;

      // Charger les magasins à proximité
      loadNearbyStores();

    } catch (error) {
      console.error('Erreur initialisation carte:', error);
      setLoadError(true);
    }
  };

  // Construire les requêtes à partir de l'item cadeau
  const buildQueriesFromItem = (item?: string) => {
    if (!item) return [{ keyword: 'gift shop' }];
    
    const t = item.toLowerCase();
    
    if (t.includes('thé') || t.includes('tea')) {
      return [{ keyword: 'salon de thé' }, { type: 'cafe' }, { keyword: 'tea shop' }];
    }
    if (t.includes('chocolat') || t.includes('chocolate')) {
      return [{ keyword: 'chocolaterie' }, { keyword: 'chocolate shop' }];
    }
    if (t.includes('livre') || t.includes('book')) {
      return [{ type: 'book_store' }, { keyword: 'librairie' }];
    }
    if (t.includes('parfum') || t.includes('beauté') || t.includes('perfume') || t.includes('beauty')) {
      return [{ type: 'beauty_salon' }, { keyword: 'parfumerie' }];
    }
    if (t.includes('plante') || t.includes('fleur') || t.includes('plant') || t.includes('flower')) {
      return [{ type: 'florist' }, { keyword: 'fleuriste' }];
    }
    if (t.includes('tech') || t.includes('électronique') || t.includes('gaming')) {
      return [{ type: 'electronics_store' }];
    }
    if (t.includes('mode') || t.includes('vêtement') || t.includes('fashion') || t.includes('bijou')) {
      return [{ type: 'clothing_store' }, { type: 'jewelry_store' }];
    }
    if (t.includes('café') || t.includes('coffee')) {
      return [{ type: 'cafe' }, { keyword: 'coffee shop' }];
    }
    if (t.includes('vin') || t.includes('wine') || t.includes('alcool')) {
      return [{ type: 'liquor_store' }, { keyword: 'cave à vin' }];
    }
    
    return [{ keyword: 'magasin' }];
  };

  // Charger les magasins à proximité
  const loadNearbyStores = async () => {
    if (!window.__offer) return;

    const { map, center } = window.__offer;
    const svc = new window.google.maps.places.PlacesService(map);
    
    const queries = buildQueriesFromItem(window.__giftItem);
    const placesById = new Map();

    for (const q of queries) {
      await new Promise<void>((resolve) => {
        svc.nearbySearch({ 
          location: center, 
          radius: 100000, 
          ...q 
        }, (results: any[], status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach(r => placesById.set(r.place_id, r));
          } else if (status !== window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.warn('places_status', status, q);
          }
          resolve();
        });
      });
    }

    const foundPlaces = [...placesById.values()]
      .map((p: any) => ({
        ...p,
        distanceKm: haversine(center, p.geometry.location.toJSON())
      }))
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm || (b.rating || 0) - (a.rating || 0))
      .slice(0, 20);

    renderMarkersAndList(foundPlaces);
  };

  // Générer l'URL Google Maps pour un lieu
  const gmapsPlaceUrl = (place: any): string => {
    return `https://www.google.com/maps/search/?api=1&query=place_id:${encodeURIComponent(place.place_id)}`;
  };

  // Rendre les marqueurs et la liste
  const renderMarkersAndList = (foundPlaces: any[]) => {
    if (!window.__offer) return;

    const { map, infoWindow } = window.__offer;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    foundPlaces.forEach((place) => {
      const marker = new window.google.maps.Marker({
        map,
        position: place.geometry.location,
        title: place.name
      });

      marker.addListener('click', () => {
        infoWindow.setContent(`
          <div style="padding: 8px; min-width: 200px;">
            <strong style="display: block; margin-bottom: 4px; font-size: 16px;">${place.name}</strong>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${(place.vicinity || '').slice(0, 80)}</p>
            ${place.rating ? `<div style="margin: 4px 0;"><span style="color: #fbbf24;">★</span> ${place.rating}</div>` : ''}
            <a target="_blank" rel="noopener" href="${gmapsPlaceUrl(place)}" 
               style="color: #1976d2; text-decoration: none; font-size: 14px;">
              Ouvrir dans Google Maps
            </a>
          </div>
        `);
        infoWindow.open(map, marker);
        
        if (onPlaceClick) {
          onPlaceClick({
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.vicinity,
            geometry: {
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              }
            },
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            distance: place.distanceKm
          });
        }
      });

      markersRef.current.push(marker);
    });

    // Ajuster la vue pour tous les marqueurs
    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      map.fitBounds(bounds);
      
      // Limiter le zoom maximum
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 16) {
          map.setZoom(16);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  };

  // Charger Google Maps API
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if ((window as any).google?.maps) {
        if (!cancelled) setIsLoaded(true);
        return;
      }

      // Callback globale appelée par le script Google
      window.initOfferMap = () => {
        if (!cancelled) setIsLoaded(true);
      };

      try {
        const { data, error } = await supabase.functions.invoke('maps-key', { method: 'GET' });
        const key = (data as any)?.key;
        if (!key || error) {
          setLoadError(true);
          return;
        }

        if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&callback=initOfferMap`;
          script.async = true;
          script.defer = true;
          script.onerror = () => setLoadError(true);
          document.head.appendChild(script);
        }
      } catch (e) {
        setLoadError(true);
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  // Initialiser la carte quand l'API est chargée
  useEffect(() => {
    if (isLoaded) {
      initOfferMap();
    }
  }, [isLoaded, center, giftItem]);

  if (loadError) {
    return (
      <div className="h-[320px] bg-muted/50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Erreur de chargement de la carte</p>
          <p className="text-xs text-muted-foreground">Veuillez rafraîchir la page</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[320px] bg-muted/50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full rounded-lg shadow-sm border"
      style={{ minHeight: '320px', height: '45vh' }}
    />
  );
}