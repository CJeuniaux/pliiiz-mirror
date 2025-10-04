import { useState, useEffect } from 'react';

// Hook to manage enhanced avatars with only user-uploaded images
export function useEnhancedAvatar(userId?: string, avatarUrl?: string, name?: string) {
  const [finalAvatarUrl, setFinalAvatarUrl] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (avatarUrl && !hasError) {
      setFinalAvatarUrl(avatarUrl);
    } else {
      // Only use placeholder for fallback - no external services
      setFinalAvatarUrl('/placeholder.svg');
    }
  }, [userId, avatarUrl, name, hasError]);

  const handleError = () => {
    setHasError(true);
    // Only use placeholder for fallback - no external services
    setFinalAvatarUrl('/placeholder.svg');
  };

  return {
    avatarUrl: finalAvatarUrl,
    onError: handleError
  };
}

// Generate initials from name
export function getInitials(name: string): string {
  if (!name) return 'U';
  
  return name
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}