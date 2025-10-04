import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { usePreferenceImage } from '@/hooks/use-preference-image';
import { Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PreferenceCardWithImageProps {
  label: string;
  starLevel?: number;
  variant?: "default" | "destructive" | "secondary" | "outline";
  onOfferClick?: (label: string) => void;
  showButton?: boolean;
  className?: string;
  userCity?: string;
  userCoords?: { lat: number; lng: number };
}

export function PreferenceCardWithImage({ 
  label, 
  starLevel,
  variant = "default",
  onOfferClick,
  showButton = true,
  className = "",
  userCity,
  userCoords
}: PreferenceCardWithImageProps) {
  const navigate = useNavigate();
  const { imageData, loading, error, handleOfferClick } = usePreferenceImage(label);

  const handleButtonClick = async () => {
    await handleOfferClick();
    onOfferClick?.(label);
  };

  // Convert label to type for the new routing system
  const getTypeFromLabel = (label: string): string => {
    const lowercaseLabel = label.toLowerCase();
    if (lowercaseLabel.includes('chocolat')) return 'chocolatier';
    if (lowercaseLabel.includes('fleur')) return 'fleuriste';
    if (lowercaseLabel.includes('patiss')) return 'patisserie';
    if (lowercaseLabel.includes('cave') || lowercaseLabel.includes('vin')) return 'cave';
    if (lowercaseLabel.includes('spa') || lowercaseLabel.includes('massage')) return 'spa';
    if (lowercaseLabel.includes('livre') || lowercaseLabel.includes('librairie')) return 'librairie';
    if (lowercaseLabel.includes('concept')) return 'concept';
    if (lowercaseLabel.includes('restaurant')) return 'restaurant';
    if (lowercaseLabel.includes('parfum')) return 'parfumerie';
    if (lowercaseLabel.includes('bougie')) return 'bougies';
    if (lowercaseLabel.includes('plante')) return 'plantes';
    if (lowercaseLabel.includes('déco') || lowercaseLabel.includes('decoration')) return 'decoration';
    if (lowercaseLabel.includes('jeu')) return 'jeux';
    if (lowercaseLabel.includes('vinyle') || lowercaseLabel.includes('disque')) return 'vinyle';
    return 'cadeau'; // fallback
  };

  const navigateToOffer = () => {
    const params = new URLSearchParams();
    if (userCity) params.set("near", userCity);
    if (userCoords?.lat != null && userCoords?.lng != null) {
      params.set("lat", String(userCoords.lat));
      params.set("lng", String(userCoords.lng));
    }
    
    const type = getTypeFromLabel(label);
    const slug = type.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const queryString = params.toString();
    const path = `/offrir/${slug}${queryString ? `?${queryString}` : ""}`;
    navigate(path);
  };

  return (
    <div className={`relative bg-card rounded-lg border shadow-sm overflow-hidden ${className}`}>
      {/* Image Section */}
      <div className="relative aspect-square w-full">
        {loading ? (
          <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
            <Gift className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : imageData ? (
          <img
            src={imageData.url400}
            alt={`Photo par ${imageData.author} pour ${label}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Gift className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Label and Stars */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
            {label}
          </h3>
          {starLevel && <StarRating level={starLevel} size="sm" />}
        </div>

        {/* Attribution */}
        {imageData && (
          <figcaption className="text-xs text-muted-foreground">
            Photo par{' '}
            <a 
              href={imageData.profileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {imageData.author}
            </a>
            {' '}sur{' '}
            <a 
              href="https://unsplash.com/?utm_source=pliiiz&utm_medium=referral" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Unsplash
            </a>
          </figcaption>
        )}

        {/* Offer Button */}
        {showButton && (
          <Button
            onClick={() => {
              handleButtonClick();
              navigateToOffer();
            }}
            className="w-full h-9 text-sm font-medium"
            aria-label={`Rechercher ${label} sur la carte`}
            disabled={!label?.trim()}
          >
            Offrir ça ! 🎁
          </Button>
        )}
      </div>
      
    </div>
  );
}