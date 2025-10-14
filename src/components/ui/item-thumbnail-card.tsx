import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { resolveThumbUrl, mapsSearchUrlFromLabel, CTA_LABEL } from '@/utils/thumbnail-resolver';
import { usePreferenceImage } from '@/hooks/use-preference-image';
import { Star, Gift } from 'lucide-react';

interface ItemThumbnailCardProps {
  label: string;
  starLevel?: number;
  categoryId?: string;
  userCity?: string;
  userCoords?: { lat: number; lng: number };
  className?: string;
}

export function ItemThumbnailCard({ 
  label, 
  starLevel, 
  categoryId, 
  userCity, 
  userCoords,
  className = ""
}: ItemThumbnailCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const thumbUrl = resolveThumbUrl({ label, canonical: { categoryId } });
  const { imageData, loading: unsplashLoading, handleOfferClick } = usePreferenceImage(label);
  
  const handleFindClick = async () => {
    // Track Unsplash download first
    await handleOfferClick();
    
    // Then open maps
    const url = mapsSearchUrlFromLabel(label, userCity, userCoords);
    window.open(url, '_blank', 'noopener');
  };

  const renderStars = () => {
    if (!starLevel) return null;
    
    return (
      <div className="flex items-center gap-0.5 mt-1">
        {[1, 2, 3].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= starLevel 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`relative bg-card rounded-lg p-3 border shadow-sm ${className}`}>
      <div className="space-y-2">
        {/* Thumbnail */}
        <div className="relative">
          {(imageLoading || unsplashLoading) && (
            <div className="thumb bg-muted animate-pulse flex items-center justify-center">
              <Gift className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          
          {/* Prefer Unsplash image if available, fallback to local */}
          <img
            src={imageData ? imageData.url400 : (imageError ? '/img/icons/placeholder.svg' : thumbUrl)}
            alt={imageData ? `Photo par ${imageData.author} pour ${label}` : label}
            className={`thumb object-cover ${imageLoading ? 'absolute inset-0 opacity-0' : ''}`}
            style={{ width: '112px', height: '112px', borderRadius: '12px' }}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        </div>
        
        {/* Label */}
        <div className="space-y-1">
          <p className="text-sm font-medium line-clamp-1 text-foreground" title={label}>
            {label}
          </p>
          {renderStars()}
          
          {/* Attribution */}
          {imageData && (
            <p className="text-xs text-muted-foreground">
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
            </p>
          )}
        </div>
        
        {/* CTA Button */}
        <Button
          variant="default"
          size="sm"
          onClick={handleFindClick}
          className="w-full min-h-[40px] text-xs font-medium"
        >
          {CTA_LABEL}
        </Button>
      </div>
    </div>
  );
}