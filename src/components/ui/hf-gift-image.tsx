import { usePreferenceImage } from '@/hooks/use-preference-image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift } from 'lucide-react';

interface HFGiftImageProps {
  label: string;
  canonical?: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  size?: string;
}

export function HFGiftImage({ 
  label, 
  canonical, 
  alt, 
  className, 
  loading = 'lazy',
  size = '1024x1024'
}: HFGiftImageProps) {
  const { imageData, loading: imageLoading } = usePreferenceImage(label);

  if (imageLoading) {
    return <Skeleton className={cn("w-full h-full", className)} />;
  }

  if (!imageData) {
    return (
      <div className={cn("w-full h-full bg-muted flex items-center justify-center", className)}>
        <Gift className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img 
      src={imageData.url400}
      alt={alt || `Photo par ${imageData.author} pour ${label}`}
      className={className}
      loading={loading}
    />
  );
}