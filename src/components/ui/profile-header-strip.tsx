import React from 'react';
import { ItemThumbnailCard } from './item-thumbnail-card';
import { PreferenceCardWithImage } from './preference-card-with-image';

interface Item {
  label: string;
  starLevel?: number;
  categoryId?: string;
}

interface ProfileHeaderStripProps {
  giftIdeas: Item[];
  userCity?: string;
  userCoords?: { lat: number; lng: number };
  className?: string;
}

export function ProfileHeaderStrip({ 
  giftIdeas, 
  userCity, 
  userCoords,
  className = ""
}: ProfileHeaderStripProps) {
  // Sort by star level (3★ first, then 2★, then newest) and take max 3
  const sortedGiftIdeas = [...giftIdeas]
    .sort((a, b) => {
      if (a.starLevel && b.starLevel) {
        return b.starLevel - a.starLevel;
      }
      if (a.starLevel && !b.starLevel) return -1;
      if (!a.starLevel && b.starLevel) return 1;
      return 0;
    })
    .slice(0, 3);

  if (sortedGiftIdeas.length === 0) {
    return null;
  }

  return (
    <div className={`bg-card/50 backdrop-blur-sm rounded-lg p-4 border ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Idées cadeaux</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {sortedGiftIdeas.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex-shrink-0 w-48">
            <PreferenceCardWithImage
              label={item.label}
              starLevel={item.starLevel}
              userCity={userCity}
              userCoords={userCoords}
              className="h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}