import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, MapPin, Search, Map } from 'lucide-react';

interface ZoneExplanationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTryIt?: () => void;
}

export function ZoneExplanationModal({ open, onOpenChange, onTryIt }: ZoneExplanationModalProps) {
  const handleTryIt = () => {
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'modal_try_feature', {
        feature: 'zone_search'
      });
    }

    onOpenChange(false);
    if (onTryIt) {
      onTryIt();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Comment ça marche
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Étape 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[hsl(var(--plz-accent-start))] to-[hsl(var(--plz-accent-end))] text-white rounded-full flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" />
                <h3 className="font-semibold">Définissez votre zone</h3>
              </div>
              <p className="text-sm leading-relaxed opacity-80">
                Saisissez votre zone ou cliquez <strong>"Me localiser"</strong> pour utiliser votre position actuelle.
              </p>
              <div className="mt-2 p-3 bg-white/10 border border-white/20 rounded-lg">
                <div className="flex items-center gap-2 text-xs">
                  💡 Le champ est prérempli avec votre ville, modifiez si besoin.
                </div>
              </div>
            </div>
          </div>

          {/* Étape 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[hsl(var(--plz-accent-start))] to-[hsl(var(--plz-accent-end))] text-white rounded-full flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4" />
                <h3 className="font-semibold">Précisez votre recherche</h3>
              </div>
              <p className="text-sm leading-relaxed opacity-80">
                Tapez votre <strong>Type de cadeaux</strong> : l'encodage automatique propose des idées plus précises.
              </p>
              <div className="mt-2 p-3 bg-white/10 border border-white/20 rounded-lg">
                <div className="text-xs mb-1">Exemple :</div>
                <div className="text-xs opacity-70">
                  "chocolat belge" plutôt que "chocolat"<br/>
                  "plante succulente facile d'intérieur" plutôt que "plante"
                </div>
              </div>
              <div className="mt-2 p-2 bg-white/10 border border-white/20 rounded-lg">
                <div className="flex items-center gap-2 text-xs">
                  💡 Affinez le type pour des résultats plus précis.
                </div>
              </div>
            </div>
          </div>

          {/* Étape 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[hsl(var(--plz-accent-start))] to-[hsl(var(--plz-accent-end))] text-white rounded-full flex items-center justify-center text-sm font-semibold">
              3
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Map className="w-4 h-4" />
                <h3 className="font-semibold">Explorez les résultats</h3>
              </div>
              <p className="text-sm leading-relaxed opacity-80">
                Cliquez <strong>"Voir la carte"</strong> pour explorer les magasins et options près de chez vous.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <Button
              onClick={handleTryIt}
              className="w-full bg-gradient-to-r from-[hsl(var(--plz-accent-start))] to-[hsl(var(--plz-accent-end))] hover:opacity-90 text-white py-3 rounded-full font-medium transition-opacity"
            >
              J'essaie
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}