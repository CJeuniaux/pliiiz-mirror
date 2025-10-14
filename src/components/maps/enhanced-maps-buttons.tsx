import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { MapsLauncher, type MapLocation } from '@/utils/maps-unified';
import { toast } from 'sonner';

interface EnhancedMapsButtonsProps {
  location: Partial<MapLocation>;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showLabels?: boolean;
}

export function EnhancedMapsButtons({ 
  location, 
  className = '',
  variant = 'outline',
  size = 'default',
  showLabels = true
}: EnhancedMapsButtonsProps) {
  const isValidLocation = MapsLauncher.isValidLocation(location);

  const handleGoogleMaps = async () => {
    if (!isValidLocation) return;

    try {
      await MapsLauncher.openGoogleMaps(
        location,
        () => {
          // Success callback - could track analytics here
        },
        (url) => {
          toast.info('Lien copié dans le presse-papiers', {
            description: 'Ouvrez-le dans votre navigateur',
            action: {
              label: 'Voir',
              onClick: () => window.open(url, '_blank')
            }
          });
        }
      );
    } catch (error) {
      toast.error('Impossible d\'ouvrir Google Maps');
    }
  };

  const handleWaze = async () => {
    if (!isValidLocation) return;

    try {
      await MapsLauncher.openWaze(
        location,
        () => {
          // Success callback
        },
        (url) => {
          toast.info('Lien copié dans le presse-papiers', {
            description: 'Ouvrez-le dans votre navigateur',
            action: {
              label: 'Voir',
              onClick: () => window.open(url, '_blank')
            }
          });
        }
      );
    } catch (error) {
      toast.error('Impossible d\'ouvrir Waze');
    }
  };

  const handleAppleMaps = async () => {
    if (!isValidLocation) return;

    try {
      await MapsLauncher.openAppleMaps(
        location,
        () => {
          // Success callback
        },
        (url) => {
          toast.info('Lien copié dans le presse-papiers', {
            description: 'Ouvrez-le dans votre navigateur',
            action: {
              label: 'Voir',
              onClick: () => window.open(url, '_blank')
            }
          });
        }
      );
    } catch (error) {
      toast.error('Impossible d\'ouvrir Apple Plans');
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant={variant}
        size={size}
        onClick={handleGoogleMaps}
        disabled={!isValidLocation}
        aria-label="Ouvrir dans Google Maps"
        title={!isValidLocation ? 'Coordonnées indisponibles' : 'Ouvrir dans Google Maps'}
        className="flex-1"
      >
        <MapPin className="h-4 w-4" />
        {showLabels && <span className="ml-2">Google Maps</span>}
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={handleWaze}
        disabled={!isValidLocation}
        aria-label="Ouvrir dans Waze"
        title={!isValidLocation ? 'Coordonnées indisponibles' : 'Ouvrir dans Waze'}
        className="flex-1"
      >
        <Navigation className="h-4 w-4" />
        {showLabels && <span className="ml-2">Waze</span>}
      </Button>

      <Button
        variant={variant}
        size={size}
        onClick={handleAppleMaps}
        disabled={!isValidLocation}
        aria-label="Ouvrir dans Apple Plans"
        title={!isValidLocation ? 'Coordonnées indisponibles' : 'Ouvrir dans Apple Plans'}
        className="flex-1"
      >
        <MapPin className="h-4 w-4" />
        {showLabels && <span className="ml-2">Apple Plans</span>}
      </Button>
    </div>
  );
}