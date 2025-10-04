import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { NearbyPlace } from '@/gifts/osm';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';

// Fix pour les icônes par défaut de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GiftMapComponentProps {
  center: [number, number];
  places: NearbyPlace[];
  userLocation?: [number, number];
}

export default function GiftMapComponent({ center, places, userLocation }: GiftMapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Calculer les bounds pour inclure tous les lieux dans un rayon de 10km
  useEffect(() => {
    if (mapRef.current && places.length > 0 && userLocation) {
      const bounds = L.latLngBounds([]);
      
      // Ajouter la position de l'utilisateur
      bounds.extend(userLocation);
      
      // Ajouter tous les lieux
      places.forEach(place => {
        if (place.lat && place.lon) {
          bounds.extend([place.lat, place.lon]);
        }
      });

      // Appliquer un padding et limiter le zoom pour rester dans un rayon raisonnable (5-10km)
      mapRef.current.fitBounds(bounds, { 
        padding: [20, 20],
        maxZoom: 14 // Limite le zoom pour garder une vue d'ensemble
      });
    }
  }, [places, userLocation]);

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Marqueur pour la position de l'utilisateur */}
      {userLocation && (
        <Marker 
          position={userLocation}
          icon={L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            className: 'user-location-marker'
          })}
        >
          <Popup>
            <div>
              <strong>📍 Votre position</strong>
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* Marqueurs pour les lieux */}
      {places?.map((place) => 
        place && place.lat && place.lon ? (
          <Marker key={place.id} position={[place.lat, place.lon]}>
            <Popup>
              <div>
                <strong>{place.name}</strong>
                <br />
                <span>{place.tags?.shop || place.tags?.amenity || 'Boutique'}</span>
                {place.distance && (
                  <>
                    <br />
                    <span>À {place.distance.toFixed(1)} km</span>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}