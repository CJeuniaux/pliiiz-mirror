import React, { useState, useEffect } from 'react';
import { resolveImageUrl } from '@/utils/image-resolver';

interface ResolvedImageProps {
  label: string;
  categoryId?: string;
  attributes?: Record<string, any>;
  existingUrl?: string | null;
  className?: string;
  alt?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Enhanced image component that uses the image library resolver
 * with intelligent fallback system
 */
export function ResolvedImage({
  label,
  categoryId,
  attributes,
  existingUrl,
  className = 'gift-img',
  alt,
  onLoad,
  onError
}: ResolvedImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      setLoading(true);
      setError(false);

      try {
        const resolvedUrl = await resolveImageUrl({
          label,
          canonical: {
            categoryId,
            attrs: attributes
          },
          imageUrl: existingUrl
        });

        setImageUrl(resolvedUrl);
      } catch (err) {
        console.error('[ResolvedImage] Error resolving image:', err);
        setError(true);
        // Fallback to placeholder
        setImageUrl('https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/library/placeholder.png');
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [label, categoryId, JSON.stringify(attributes), existingUrl]);

  const handleImageLoad = () => {
    setError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    if (!error) {
      setError(true);
      // Fallback to placeholder on error
      setImageUrl('https://afyxwaprjecyormhnncl.supabase.co/storage/v1/object/public/library/placeholder.png');
      onError?.();
    }
  };

  if (loading) {
    return (
      <div className={`${className} bg-muted animate-pulse flex items-center justify-center`}>
        <div className="w-8 h-8 bg-muted-foreground/20 rounded-full"></div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt || label}
      className={className}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading="lazy"
    />
  );
}