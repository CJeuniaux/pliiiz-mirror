import React from 'react';
import { PreferenceItem } from '@/hooks/use-public-profile-enhanced';
import { PreferenceCardWithImage } from '@/components/ui/preference-card-with-image';

interface HeaderPreviewCardsProps {
  globalPreferences: {
    giftIdeas?: PreferenceItem[];
  };
  occasionPrefs: Record<string, {
    giftIdeas?: PreferenceItem[];
  }>;
  onOfferClick: (item: string) => void;
  userCity?: string;
  userCoords?: { lat: number; lng: number };
}

export function HeaderPreviewCards({ globalPreferences, occasionPrefs, onOfferClick, userCity, userCoords }: HeaderPreviewCardsProps) {
  // Collecter tous les gift ideas avec leurs niveaux
  const allGiftIdeas: (PreferenceItem & { source: string })[] = [];
  
  // Ajouter les gift ideas globales
  if (globalPreferences.giftIdeas) {
    allGiftIdeas.push(...globalPreferences.giftIdeas.map(item => ({
      ...item,
      source: 'global'
    })));
  }
  
  // Ajouter les gift ideas par occasion
  Object.entries(occasionPrefs).forEach(([slug, prefs]) => {
    if (prefs.giftIdeas) {
      allGiftIdeas.push(...prefs.giftIdeas.map(item => ({
        ...item,
        source: slug
      })));
    }
  });

  // Trier par niveau (3★ d'abord, puis 2★) puis par plus récent
  const sortedGiftIdeas = allGiftIdeas
    .filter(item => item.level && item.level >= 2) // Seulement 2★ et 3★
    .sort((a, b) => {
      // D'abord par niveau (3 avant 2)
      if (a.level !== b.level) {
        return (b.level || 2) - (a.level || 2);
      }
      // Puis par ordre alphabétique pour un tri déterministe
      return a.label.localeCompare(b.label);
    })
    .slice(0, 3); // Maximum 3 cartes

  if (sortedGiftIdeas.length === 0) {
    return null; // Masquer si aucun gift idea 2★ ou 3★
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {sortedGiftIdeas.map((item, index) => (
        <PreferenceCardWithImage
          key={`${item.source}-${item.label}-${index}`}
          label={item.label}
          starLevel={item.level}
          onOfferClick={onOfferClick}
          userCity={userCity}
          userCoords={userCoords}
          className="group hover:shadow-md transition-all duration-200"
        />
      ))}
    </div>
  );
}