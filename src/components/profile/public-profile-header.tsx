import React from 'react';
import { Card } from '@/components/ui/card';
import { Gift } from 'lucide-react';
import { ProfileHeaderStrip } from '@/components/ui/profile-header-strip';
import { prettyValue } from '@/lib/display-utils';

interface PreferenceItem {
  label: string;
  level?: number;
}

interface PublicProfileHeaderProps {
  giftIdeas: PreferenceItem[];
  displayName: string;
  userCity?: string;
  userCoords?: { lat: number; lng: number };
}

export function PublicProfileHeader({ 
  giftIdeas, 
  displayName, 
  userCity, 
  userCoords 
}: PublicProfileHeaderProps) {
  // Filter gift ideas with 2★ or 3★
  const filteredGiftIdeas = giftIdeas
    .filter(item => item.level && item.level >= 2)
    .map(item => ({
      label: item.label,
      starLevel: item.level,
      categoryId: undefined // Could be enhanced later based on item type
    }));

  if (filteredGiftIdeas.length === 0) {
    // Afficher une version avec "non renseigné" au lieu de masquer complètement
    return (
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-5 w-5 text-primary" />
            <h3 className="font-outfit font-bold text-lg">
              Idées cadeaux pour {displayName}
            </h3>
          </div>
          <div className="text-sm text-muted-foreground italic">
            {prettyValue([])}
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card className="mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="font-outfit font-bold text-lg">
            Idées cadeaux pour {displayName}
          </h3>
        </div>
        
        <ProfileHeaderStrip 
          giftIdeas={filteredGiftIdeas}
          userCity={userCity}
          userCoords={userCoords}
        />
      </div>
    </Card>
  );
}