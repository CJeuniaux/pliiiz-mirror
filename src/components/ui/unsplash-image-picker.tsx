import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnsplash, UnsplashImage } from '@/hooks/use-unsplash';
import { toast } from '@/hooks/use-toast';

interface UnsplashImagePickerProps {
  onImageSelect: (image: UnsplashImage) => void;
  defaultQuery?: string;
  className?: string;
}

export function UnsplashImagePicker({ 
  onImageSelect, 
  defaultQuery = 'gift',
  className 
}: UnsplashImagePickerProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [searchTerm, setSearchTerm] = useState(defaultQuery);
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const { searchImages, trackDownload, loading, error } = useUnsplash();

  const performSearch = useCallback(async (searchQuery: string, page: number = 1, append: boolean = false) => {
    const result = await searchImages(searchQuery, page, 20);
    
    if (result) {
      setImages(prev => append ? [...prev, ...result.results] : result.results);
      setCurrentPage(result.current_page);
      setTotalPages(result.total_pages);
      setHasMore(result.current_page < result.total_pages);
    } else if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les images. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  }, [searchImages, error]);

  // Initial search
  useEffect(() => {
    performSearch(searchTerm);
  }, []);

  const handleSearch = () => {
    setSearchTerm(query);
    setCurrentPage(1);
    performSearch(query, 1, false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      performSearch(searchTerm, currentPage + 1, true);
    }
  };

  const handleImageSelect = async (image: UnsplashImage) => {
    // Track download as required by Unsplash API
    await trackDownload(image.downloadLocation);
    onImageSelect(image);
    
    toast({
      title: "Image sélectionnée",
      description: `Photo de ${image.author} sélectionnée avec succès.`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={className}>
      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Rechercher des images..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Images grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {images.map((image) => (
          <Card 
            key={image.id} 
            className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            onClick={() => handleImageSelect(image)}
          >
            <div className="aspect-square relative overflow-hidden">
              <img
                src={image.url400}
                alt={`Photo by ${image.author} on Unsplash`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground truncate">
                Photo par{' '}
                <a
                  href={image.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {image.author}
                </a>
                {' '}sur{' '}
                <a
                  href="https://unsplash.com/?utm_source=pliiiz&utm_medium=referral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Unsplash
                </a>
              </p>
            </div>
          </Card>
        ))}
        
        {/* Loading skeletons */}
        {loading && images.length === 0 && (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3">
                <Skeleton className="h-3 w-3/4" />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Load more button */}
      {hasMore && images.length > 0 && (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={handleLoadMore}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Charger plus d'images
          </Button>
        </div>
      )}

      {/* No more results */}
      {!hasMore && images.length > 0 && (
        <p className="text-center text-muted-foreground text-sm">
          Toutes les images ont été chargées pour "{searchTerm}"
        </p>
      )}

      {/* No results */}
      {!loading && images.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Aucune image trouvée pour "{searchTerm}"
          </p>
          <Button variant="outline" onClick={() => {
            setQuery('gift');
            setSearchTerm('gift');
            performSearch('gift');
          }}>
            Rechercher "gift"
          </Button>
        </div>
      )}
    </div>
  );
}