import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Blurhash } from 'react-blurhash';
import { buildAvatarUrls, type ProfileWithAvatar } from '@/lib/images';
import { generateInitials } from '@/utils/avatar-utils';
import { cn } from '@/lib/utils';

interface OptimizedAvatarProps {
  profile: ProfileWithAvatar & { display_name?: string; first_name?: string; last_name?: string };
  size?: 's' | 'm' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  s: { dim: 32, className: 'h-8 w-8' },
  m: { dim: 64, className: 'h-10 w-10' },
  lg: { dim: 80, className: 'h-12 w-12' },
  xl: { dim: 128, className: 'h-24 w-24' },
};

export function OptimizedAvatar({ profile, size = 'm', className }: OptimizedAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const { dim, className: sizeClassName } = sizeMap[size];
  const urls = buildAvatarUrls(profile);
  
  // Sélectionner la bonne taille d'URL
  const imageUrl = size === 's' ? urls?.s : urls?.m;
  
  // Nom pour initiales
  const displayName = 
    profile.display_name || 
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
    'U';

  const initials = generateInitials(displayName);
  
  // Reset loaded state quand l'URL change
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [imageUrl]);

  // Si pas d'avatar
  if (!urls || !imageUrl || imageError) {
    return (
      <Avatar className={cn(sizeClassName, className)}>
        <AvatarFallback 
          className="text-sm font-medium"
          style={{ 
            backgroundColor: profile.avatar_dominant || '#e5e7eb',
            color: '#ffffff'
          }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div className={cn('relative', sizeClassName, className)}>
      {/* Placeholder BlurHash ou couleur dominante */}
      {!imageLoaded && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {profile.avatar_blurhash ? (
            <Blurhash
              hash={profile.avatar_blurhash}
              width={dim}
              height={dim}
              resolutionX={32}
              resolutionY={32}
              punch={1}
            />
          ) : (
            <div 
              className="w-full h-full"
              style={{ backgroundColor: profile.avatar_dominant || '#e5e7eb' }}
            />
          )}
        </div>
      )}
      
      {/* Avatar réel */}
      <Avatar className={cn(sizeClassName, 'relative z-10')}>
        <AvatarImage
          src={imageUrl}
          alt={displayName}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={cn(
            'object-cover transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
        <AvatarFallback className="text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
