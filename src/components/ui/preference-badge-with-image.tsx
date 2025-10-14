import React from 'react';
import { Badge } from '@/components/ui/badge';
import { usePreferenceImage } from '@/hooks/use-preference-image';
import { Gift } from 'lucide-react';

interface PreferenceBadgeWithImageProps {
  label: string;
  variant?: "default" | "destructive" | "secondary" | "outline";
  size?: "sm" | "default" | "lg";
  showAttribution?: boolean;
  className?: string;
}

export function PreferenceBadgeWithImage({ 
  label, 
  variant = "default",
  size = "default",
  showAttribution = true,
  className = ""
}: PreferenceBadgeWithImageProps) {
  const { imageData, loading } = usePreferenceImage(label);

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Image */}
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
        {loading ? (
          <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
            <Gift className="h-4 w-4 text-muted-foreground" />
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
            <Gift className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Badge */}
      <Badge variant={variant} size={size} className="max-w-20 justify-center">
        {label}
      </Badge>

      {/* Attribution */}
      {showAttribution && imageData && (
        <p className="text-xs text-muted-foreground text-center">
          Photo par{' '}
          <a 
            href={imageData.profileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {imageData.author}
          </a>
        </p>
      )}
    </div>
  );
}