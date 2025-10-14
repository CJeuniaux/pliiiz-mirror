import { useState, useEffect } from 'react';
import { resolveThumbUrl } from '@/utils/thumbnail-resolver';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface GiftImageProps {
  giftName: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function GiftImage({ giftName, alt, className, loading = 'lazy' }: GiftImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadImage = async () => {
      try {
        // 1) Try latest regenerated image from DB (prefers source_ref)
        const { data: rows } = await supabase
          .from('gift_idea_unsplash')
          .select('image_url, unsplash_url, thumb_url')
          .eq('gift_idea_text', giftName)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (!cancelled && rows && rows.length > 0) {
          const dbUrl = (rows[0] as any).source_ref || (rows[0] as any).image_url;
          if (dbUrl) {
            setImageSrc(dbUrl);
            return;
          }
        }

        // 2) Fallback to RPC (v2) which is SECURITY DEFINER
        const { data: rpcData } = await supabase.rpc('get_gift_idea_image_v2', {
          p_idea_text: giftName,
          p_category: null,
          p_occasion: null,
        });
        const rpcUrl = Array.isArray(rpcData) && rpcData.length > 0 ? (rpcData[0] as any).image_url : undefined;
        if (!cancelled && rpcUrl) {
          setImageSrc(rpcUrl);
          return;
        }

        // 3) Final fallback to library resolver
        if (!cancelled) setImageSrc(resolveThumbUrl({ label: giftName }));
      } catch (error) {
        console.error('Error loading gift image:', error);
        if (!cancelled) setImageSrc(resolveThumbUrl({ label: giftName }));
      }
    };

    setImageSrc('');
    loadImage();
    return () => {
      cancelled = true;
    };
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