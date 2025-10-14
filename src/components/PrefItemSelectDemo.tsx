import { useState } from "react";
import PrefItemSelect from "./PrefItemSelect";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

/**
 * Composant de démonstration pour PrefItemSelect
 * Montre comment utiliser l'autocomplete intelligent
 */
export default function PrefItemSelectDemo() {
  const [selectedItems, setSelectedItems] = useState<{ id?: string; label: string }[]>([]);

  const handleSelect = (item: { id?: string; label: string }) => {
    // Éviter les doublons
    if (selectedItems.some(i => i.label === item.label)) {
      return;
    }
    setSelectedItems(prev => [...prev, item]);
  };

  const handleRemove = (label: string) => {
    setSelectedItems(prev => prev.filter(item => item.label !== label));
  };

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl backdrop-blur-sm border border-white/20">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Autocomplete Intelligent
        </h3>
        <p className="text-sm text-white/80 mb-4">
          Recherche avec synonymes, tolérance aux fautes et création automatique
        </p>
        
        <PrefItemSelect 
          onSelect={handleSelect}
          placeholder="Tape un item (ex: chocolat, café, manga...)"
        />
      </div>

      {selectedItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-white/90 font-medium">Items sélectionnés :</p>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item, idx) => (
              <Badge 
                key={idx} 
                variant="secondary"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                {item.label}
                <button
                  onClick={() => handleRemove(item.label)}
                  className="ml-2 hover:text-red-300"
                  aria-label="Retirer"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
