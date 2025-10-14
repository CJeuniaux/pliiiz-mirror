import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useMe } from '@/hooks/use-me';

interface ShareProfileNativeProps {
  className?: string;
}

export function ShareProfileNative({ className }: ShareProfileNativeProps) {
  const { user } = useAuth();
  const { data: meData } = useMe();

  const handleShare = async () => {
    if (!user || !meData?.shareUrl) return;
    
    const shareUrl = meData.shareUrl;
    const shareData = {
      title: 'Mon profil PLIIIZ',
      text: 'Découvre mes préférences cadeaux sur PLIIIZ',
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Lien copié dans le presse-papiers');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to clipboard copy
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Lien copié dans le presse-papiers');
      } catch (clipboardError) {
        toast.error('Impossible de partager le lien');
      }
    }
  };

  return (
    <Button 
      variant="default" 
      onClick={handleShare}
      className={className}
      disabled={!meData?.shareUrl}
    >
      <Share2 className="h-4 w-4 mr-2" />
      Partager mon profil
    </Button>
  );
}