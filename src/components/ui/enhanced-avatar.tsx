import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEnhancedAvatar, getInitials } from '@/hooks/use-enhanced-avatar';
import { cn } from '@/lib/utils';

interface EnhancedAvatarProps {
  userId?: string;
  avatarUrl?: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10', 
  lg: 'h-12 w-12',
  xl: 'h-24 w-24'
};

export function EnhancedAvatar({ 
  userId, 
  avatarUrl, 
  name = 'User', 
  className,
  size = 'md'
}: EnhancedAvatarProps) {
  const { avatarUrl: finalAvatarUrl, onError } = useEnhancedAvatar(userId, avatarUrl, name);
  
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage 
        src={finalAvatarUrl} 
        alt={name}
        onError={onError}
        className="object-cover"
      />
      <AvatarFallback className="text-sm font-medium">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}