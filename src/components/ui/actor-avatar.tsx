import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ActorAvatarProps {
  actorName?: string | null;
  actorAvatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ActorAvatar({ 
  actorName, 
  actorAvatarUrl, 
  size = 'md',
  className = '' 
}: ActorAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Génère les initiales à partir du nom
  const initials = (actorName || 'U')
    .split(' ')
    .map((word: string) => word.charAt(0)?.toUpperCase() || '')
    .slice(0, 2)
    .join('');

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm', 
    lg: 'h-10 w-10 text-base',
    xl: 'h-16 w-16 text-lg'
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {actorAvatarUrl && !imageError ? (
        <AvatarImage 
          src={actorAvatarUrl} 
          alt={actorName || 'Avatar'}
          onError={() => setImageError(true)}
        />
      ) : null}
      <AvatarFallback className="bg-muted text-muted-foreground font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}