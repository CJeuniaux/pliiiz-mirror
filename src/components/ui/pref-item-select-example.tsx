import { useState } from "react";
import PrefItemSelect from "./pref-item-select";
import { Badge } from "./badge";
import { X } from "lucide-react";

/**
 * Exemple d'utilisation du PrefItemSelect
 * À intégrer dans les pages de préférences
 */
export function PrefItemSelectExample() {
  const [selectedItems, setSelectedItems] = useState<Array<{ id?: string; label: string }>>([]);

  const handleSelect = (item: { id?: string; label: string }) => {
    // Éviter les doublons
    if (!selectedItems.some(i => i.label === item.label)) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleRemove = (label: string) => {
    setSelectedItems(selectedItems.filter(i => i.label !== label));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Ajoute tes préférences
        </label>
        <PrefItemSelect 
          onSelect={handleSelect}
          placeholder="Chocolat, manga, randonnée..."
        />
      </div>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item, idx) => (
            <Badge 
              key={idx} 
              variant="secondary"
              className="bg-white/20 text-white border-white/30 pr-1"
            >
              {item.label}
              <button
                onClick={() => handleRemove(item.label)}
                className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                aria-label={`Retirer ${item.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Debug - à retirer en prod */}
      {selectedItems.length > 0 && (
        <details className="text-xs text-white/60">
          <summary className="cursor-pointer">Données sélectionnées (debug)</summary>
          <pre className="mt-2 p-2 bg-black/20 rounded overflow-auto">
            {JSON.stringify(selectedItems, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
