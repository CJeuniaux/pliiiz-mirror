import { useState, useEffect } from 'react';
import { useGiftImageGenerator } from '@/hooks/use-gift-image-generator';
import { resolveThumbUrl } from '@/utils/thumbnail-resolver';
import { Skeleton } from '@/components/ui/skeleton';

interface GiftImageProps {
  giftName: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function GiftImage({ giftName, alt, className, loading = 'lazy' }: GiftImageProps) {
  const { generateGiftImage, isImageLoading, getFallbackImage } = useGiftImageGenerator();
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        // Only use Supabase library images for now
        const libraryImage = resolveThumbUrl({ label: giftName });
        setImageSrc(libraryImage);
        
        // Disabled AI generation until we have suitable AI
        // const aiImageSrc = await generateGiftImage(giftName);
      } catch (error) {
        console.error('Error loading gift image:', error);
        setImageSrc(resolveThumbUrl({ label: giftName })); // Always fallback to library resolver
      }
    };

    loadImage();
  }, [giftName]);

  const handleImageError = () => {
    setImageError(true);
    setImageSrc(resolveThumbUrl({ label: giftName })); // Use library resolver for fallback
  };

  if (!imageSrc) {
    return <Skeleton className={className} />;
  }

  return (
    <img 
      src={imageSrc}
      alt={alt || giftName}
      className={className}
      loading={loading}
      onError={handleImageError}
    />
  );
}