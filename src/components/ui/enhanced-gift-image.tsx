import React, { useState, useEffect } from 'react';
import { useEnhancedImageGenerator } from '@/hooks/use-enhanced-image-generator';
import { createSemanticMapping } from '@/lib/semantic-image-mapping';
import { RefreshCw, Edit3 } from 'lucide-react';
import { Button } from './button';

interface EnhancedGiftImageProps {
  giftIdea: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  showConfidence?: boolean;
  allowManualEdit?: boolean;
}

export function EnhancedGiftImage({
  giftIdea,
  alt,
  className = '',
  loading = 'lazy',
  showConfidence = false,
  allowManualEdit = false
}: EnhancedGiftImageProps) {
  const { getEnhancedImage, setManualChoice, isLoading, getCachedResult } = useEnhancedImageGenerator();
  const [imageResult, setImageResult] = useState<any>(null);
  const [imageError, setImageError] = useState(false);
  const [showEditInput, setShowEditInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    const loadImage = async () => {
      // Check cache first
      const cached = getCachedResult(giftIdea);
      if (cached) {
        setImageResult(cached);
        return;
      }

      try {
        const result = await getEnhancedImage(giftIdea);
        setImageResult(result);
      } catch (error) {
        console.error('Failed to load enhanced image:', error);
        setImageError(true);
      }
    };

    loadImage();
  }, [giftIdea, getEnhancedImage, getCachedResult]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleRetry = async () => {
    setImageError(false);
    setImageResult(null);
    try {
      const result = await getEnhancedImage(giftIdea);
      setImageResult(result);
    } catch (error) {
      setImageError(true);
    }
  };

  const handleManualEdit = () => {
    setShowEditInput(true);
    setCustomUrl(imageResult?.url || '');
  };

  const handleSaveCustomUrl = () => {
    if (customUrl.trim()) {
      setManualChoice(giftIdea, customUrl.trim());
      setImageResult({
        url: customUrl.trim(),
        source: 'fallback',
        confidence: 1.0
      });
    }
    setShowEditInput(false);
  };

  const handleCancelEdit = () => {
    setShowEditInput(false);
    setCustomUrl('');
  };

  // Show loading skeleton
  if (isLoading(giftIdea) || !imageResult) {
    return (
      <div className={`relative ${className}`}>
        <div className="aspect-square bg-muted animate-pulse rounded-lg" />
        {isLoading(giftIdea) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  // Show edit input
  if (showEditInput) {
    return (
      <div className={`relative ${className}`}>
        <div className="space-y-2">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="URL de l'image personnalisée"
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveCustomUrl}>
              Sauvegarder
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
              Annuler
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <img
        src={imageResult.url}
        alt={alt || `Image pour ${giftIdea}`}
        loading={loading}
        className="w-full h-full object-cover rounded-lg"
        onError={handleImageError}
      />
      
      {/* Confidence indicator */}
      {showConfidence && (
        <div className="absolute top-2 left-2">
          <span 
            className={`
              inline-block px-2 py-1 rounded text-xs font-medium
              ${imageResult.confidence > 0.7 ? 'bg-green-500/80 text-white' : 
                imageResult.confidence > 0.4 ? 'bg-yellow-500/80 text-white' : 
                'bg-red-500/80 text-white'}
            `}
            title={`Confiance: ${Math.round(imageResult.confidence * 100)}% - Source: ${imageResult.source}`}
          >
            {Math.round(imageResult.confidence * 100)}%
          </span>
        </div>
      )}

      {/* Source indicator */}
      <div className="absolute top-2 right-2">
        <span 
          className={`
            inline-block px-2 py-1 rounded text-xs font-medium
            ${imageResult.source === 'ai' ? 'bg-purple-500/80 text-white' :
              imageResult.source === 'unsplash' ? 'bg-blue-500/80 text-white' :
              'bg-gray-500/80 text-white'}
          `}
          title={`Source: ${imageResult.source === 'ai' ? 'IA' : imageResult.source === 'unsplash' ? 'Unsplash' : 'Fallback'}`}
        >
          {imageResult.source === 'ai' ? 'IA' : 
           imageResult.source === 'unsplash' ? 'U' : 'F'}
        </span>
      </div>

      {/* Action buttons (shown on hover) */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          {imageError ? (
            <Button size="sm" variant="outline" onClick={handleRetry}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={handleRetry}>
                <RefreshCw className="h-3 w-3" />
              </Button>
              {allowManualEdit && (
                <Button size="sm" variant="outline" onClick={handleManualEdit}>
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Semantic info overlay (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {(() => {
            const mapping = createSemanticMapping(giftIdea);
            return `${mapping.category}${mapping.brand ? ` | ${mapping.brand}` : ''}${mapping.colors ? ` | ${mapping.colors[0]}` : ''}`;
          })()}
        </div>
      )}
    </div>
  );
}