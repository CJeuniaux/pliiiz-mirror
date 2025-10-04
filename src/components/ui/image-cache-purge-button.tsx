import { useImageCachePurge } from '@/hooks/use-image-cache-purge';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ImageCachePurgeButton() {
  const { purgeImageCache, isPurging, lastPurgeResult } = useImageCachePurge();

  const handlePurge = async () => {
    const result = await purgeImageCache();
    
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Button 
      onClick={handlePurge}
      disabled={isPurging}
      variant="destructive"
      size="sm"
      className="gap-2"
    >
      {isPurging ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      {isPurging ? 'Purge en cours...' : 'Purger le cache images'}
    </Button>
  );
}