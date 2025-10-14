import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HFGiftImage } from "@/components/ui/hf-gift-image";
import { CarouselItem } from "@/lib/profile-common";
import { useNavigate } from "react-router-dom";
import { openMapsSearch } from "@/utils/maps-unified";
import ExternalLink from "@/components/ui/external-link";
import { useRobustGeolocation } from "@/hooks/use-robust-geolocation";
import giftPlaceholder from "@/assets/gift-placeholder.jpg";

interface ProfileCarouselProps {
  items: CarouselItem[];
  userId?: string;
  readOnly?: boolean;
  profileCity?: string;
  mediaItems?: Array<{
    id: string;
    url: string;
    label?: string;
  }>;
}

export function ProfileCarousel({ items, userId, readOnly = false, profileCity, mediaItems }: ProfileCarouselProps) {
  const navigate = useNavigate();
  const { location: userLocation } = useRobustGeolocation();

  console.info('[ProfileCarousel]', { items, userId, readOnly });

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground italic">Aucun aperçu disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 mt-[10px]">
        {items.map((item, index) => {
          // Prioriser les images uploadées par l'utilisateur si disponibles
          const mediaUrl = mediaItems && mediaItems[index]?.url;
          
          return (
           <Card key={index} className="overflow-hidden">
            <div className="aspect-square">
              {mediaUrl ? (
                <img 
                  src={mediaUrl}
                  alt={item.label}
                  className="w-full h-full object-cover"
                />
              ) : readOnly ? (
                <img 
                  src={giftPlaceholder}
                  alt={item.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <HFGiftImage 
                  label={item.label}
                  canonical={item.label}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <CardContent className="p-4 text-center space-y-3">
              <p className="text-sm font-medium">{item.label}</p>
              {!readOnly && userId && (
                <Button
                  onClick={() => openMapsSearch(item.label, profileCity)}
                  className="inline-flex items-center justify-center w-full h-9 px-4 py-2 text-sm font-semibold text-white bg-[#2f4b4e] hover:opacity-90 rounded-md transition-opacity"
                  aria-label={`Ouvrir Google Maps et rechercher ${item.label}`}
                  disabled={!item.label?.trim()}
                >
                  OFFRIR ÇA !
                </Button>
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
}