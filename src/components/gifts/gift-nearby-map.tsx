import React, { Suspense, lazy } from 'react';
import { NearbyPlace } from '@/gifts/osm';

// Lazy load Leaflet pour éviter d'alourdir les autres pages
const LazyMapComponent = lazy(() => import('./gift-map-component'));

interface GiftNearbyMapProps {
  center: [number, number];
  places: NearbyPlace[];
  loading?: boolean;
  userLocation?: [number, number];
}

// Error Boundary pour isoler les erreurs liées à la carte (react-leaflet/leaflet)
class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }>{
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('[GiftNearbyMap] Map render error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="bg-muted/50 rounded-2xl flex items-center justify-center text-center p-4"
          style={{ height: 240 }}
        >
          <div>
            <p className="text-sm font-medium">Impossible d'afficher la carte</p>
            <p className="text-xs text-muted-foreground mt-1">Veuillez réessayer plus tard.</p>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

export function GiftNearbyMap({ center, places, loading = false, userLocation }: GiftNearbyMapProps) {
  if (loading) {
    return (
      <div 
        className="bg-muted/50 rounded-2xl flex items-center justify-center"
        style={{ height: 240 }}
      >
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  // Ne tente pas de rendre la carte si l'environnement n'est pas le navigateur (sécurité SSR/hydratation)
  const isBrowser = typeof window !== 'undefined';

  return (
    <div 
      className="rounded-2xl overflow-hidden border border-border"
      style={{ height: 240 }}
    >
      {isBrowser ? (
        <MapErrorBoundary>
          <Suspense fallback={
            <div className="bg-muted/50 h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
              </div>
            </div>
          }>
            <LazyMapComponent center={center} places={places} userLocation={userLocation} />
          </Suspense>
        </MapErrorBoundary>
      ) : (
        <div className="bg-muted/50 h-full flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Carte non disponible</p>
        </div>
      )}
    </div>
  );
}
