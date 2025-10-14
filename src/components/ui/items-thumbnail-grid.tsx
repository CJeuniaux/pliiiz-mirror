import React from 'react';
import { ItemThumbnailCard } from './item-thumbnail-card';

interface Item {
  label: string;
  starLevel?: number;
  categoryId?: string;
}

interface ItemsThumbnailGridProps {
  items: Item[];
  userCity?: string;
  userCoords?: { lat: number; lng: number };
  maxItems?: number;
  className?: string;
}

export function ItemsThumbnailGrid({ 
  items, 
  userCity, 
  userCoords, 
  maxItems,
  className = ""
}: ItemsThumbnailGridProps) {
  // Sort by star level (3★ first, then 2★, then newest)
  const sortedItems = [...items].sort((a, b) => {
    if (a.starLevel && b.starLevel) {
      return b.starLevel - a.starLevel;
    }
    if (a.starLevel && !b.starLevel) return -1;
    if (!a.starLevel && b.starLevel) return 1;
    return 0;
  });

  const displayItems = maxItems ? sortedItems.slice(0, maxItems) : sortedItems;

  if (displayItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Aucun élément à afficher</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${className}`}>
      {displayItems.map((item, index) => (
        <ItemThumbnailCard
          key={`${item.label}-${index}`}
          label={item.label}
          starLevel={item.starLevel}
          categoryId={item.categoryId}
          userCity={userCity}
          userCoords={userCoords}
        />
      ))}
    </div>
  );
}