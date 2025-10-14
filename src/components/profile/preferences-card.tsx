import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AutocompleteTagInput } from '@/components/ui/autocomplete-tag-input';
import { Edit3, Plus, X, Heart, ShieldAlert, Gift, Ruler, Tag } from 'lucide-react';

interface PreferencesCardProps {
  title: string;
  icon: React.ReactNode;
  items: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (index: number) => void;
  colorScheme: 'purple' | 'red' | 'blue' | 'gray' | 'violet';
  placeholder?: string;
  maxItems?: number;
  suggestions?: string[];
  helpText?: string;
}

const colorSchemes = {
  purple: {
    container: 'card-like',
    badge: 'chip-like',
    button: 'bg-white text-[#2F4B4E] hover:bg-gray-100',
    icon: 'text-white'
  },
  red: {
    container: 'card-avoid',
    badge: 'chip-avoid',
    button: 'bg-[#2F4B4E] text-white hover:bg-[#253B3E]',
    icon: 'text-[#2F4B4E]'
  },
  blue: {
    container: 'card-ideas',
    badge: 'chip-idea',
    button: 'bg-[#2F4B4E] text-white hover:bg-[#253B3E]',
    icon: 'text-[#2F4B4E]'
  },
  gray: {
    container: 'card-sizes',
    badge: 'chip-size',
    button: 'bg-white text-[#152223] hover:bg-gray-100',
    icon: 'text-white'
  },
  violet: {
    container: 'card-brands',
    badge: 'chip-brand',
    button: 'bg-[#2F4B4E] text-white hover:bg-[#253B3E]',
    icon: 'text-[#2F4B4E]'
  }
};

export function PreferencesCard({
  title,
  icon,
  items,
  onAddItem,
  onRemoveItem,
  colorScheme,
  placeholder = "Ajouter un élément...",
  maxItems,
  suggestions = [],
  helpText
}: PreferencesCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const colors = colorSchemes[colorScheme];

  return (
    <Card className={`${colors.container} border-0 w-full ${isEditing ? 'relative z-[3000]' : 'relative'}`}>
      <CardHeader className="pb-2 pt-3">{/* Padding horizontal géré par CSS global */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold card-title mb-1.5 text-white">
              <span className="text-white">{icon}</span>
              {title}
              {maxItems && (
                <span className="text-xs opacity-60 font-normal ml-auto flex-shrink-0">
                  {items.length}/{maxItems}
                </span>
              )}
            </CardTitle>
            {helpText && (
              <p className="text-sm mt-0.5 opacity-75 leading-snug text-white">
                {helpText}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-icon-orange w-8 h-8 shadow-lg"
            aria-label="Modifier"
          >
            <Edit3 className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 pb-3">{/* Padding horizontal géré par CSS global */}
        {/* Items existants */}
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className={`${colors.badge} relative group border border-white/40 text-sm px-4 py-2 rounded-full`}
            >
              {item}
              {isEditing && (
                <button
                  onClick={() => onRemoveItem(index)}
                  className="ml-2 hover:text-red-200 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>

        {/* Mode édition avec autocomplétion */}
        {isEditing && (
          <div className="space-y-2 relative z-[3200]">
            <AutocompleteTagInput
              category={
                colorScheme === 'purple' ? 'likes' :
                colorScheme === 'red' ? 'avoids' :
                colorScheme === 'blue' ? 'gifts' :
                'brands'
              }
              placeholder={placeholder}
              existingValues={items}
              onAdd={onAddItem}
              maxItems={maxItems}
              className="w-full"
            />
          </div>
        )}

        {items.length === 0 && !isEditing && (
          <p className="text-gray-500 text-sm italic">
            Aucun élément ajouté pour le moment
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Composants spécialisés pour chaque type de préférence
export function LikesCard({ items, onAddItem, onRemoveItem }: {
  items: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (index: number) => void;
}) {
  return (
    <PreferencesCard
      title="J'aime"
      icon={<Heart className="h-5 w-5" />}
      items={items}
      onAddItem={onAddItem}
      onRemoveItem={onRemoveItem}
      colorScheme="purple"
      placeholder="Ex. chocolat, café, plantes…"
      helpText="Ce que tu aimes recevoir en toute occasion — sois précis."
    />
  );
}

export function DislikesCard({ items, onAddItem, onRemoveItem }: {
  items: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (index: number) => void;
}) {
  return (
    <PreferencesCard
      title="À éviter / Allergies"
      icon={<ShieldAlert className="h-5 w-5" />}
      items={items}
      onAddItem={onAddItem}
      onRemoveItem={onRemoveItem}
      colorScheme="red"
      placeholder="Ex. gluten, lactose, arachides…"
      helpText="Allergies et cadeaux à éviter ou que tu n'apprécies pas."
    />
  );
}

export function GiftIdeasCard({ items, onAddItem, onRemoveItem }: {
  items: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (index: number) => void;
}) {
  return (
    <PreferencesCard
      title="Idées cadeaux"
      icon={<Gift className="h-5 w-5" />}
      items={items}
      onAddItem={onAddItem}
      onRemoveItem={onRemoveItem}
      colorScheme="blue"
      placeholder="Ex. carte cadeau, bougie, plante…"
      helpText="Tes envies/besoins du moment — ça peut évoluer."
    />
  );
}

export function SizesCard({ sizes, onUpdateSize, onUpdateSizes }: {
  sizes: { top?: string; bottom?: string; shoes?: string; ring?: string; other?: string; };
  onUpdateSize: (key: string, value: string) => void;
  onUpdateSizes?: (sizes: { top?: string; bottom?: string; shoes?: string; ring?: string; other?: string; }) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localSizes, setLocalSizes] = useState(sizes);
  
  const sizeFields = [
    { key: 'top', label: 'Haut' },
    { key: 'bottom', label: 'Bas' },
    { key: 'shoes', label: 'Chaussures' },
    { key: 'ring', label: 'Bague' },
    { key: 'other', label: 'Autre' }
  ];

  // Reset local state when external sizes change
  useEffect(() => {
    setLocalSizes(sizes);
  }, [sizes]);

  const handleEdit = () => {
    setLocalSizes(sizes);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setLocalSizes(sizes);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (onUpdateSizes) {
      onUpdateSizes(localSizes);
    } else {
      // Fallback: mise à jour champ par champ
      sizeFields.forEach(field => {
        const newValue = localSizes[field.key as keyof typeof localSizes] || '';
        onUpdateSize(field.key, newValue);
      });
    }
    setIsEditing(false);
  };

  const handleSizeChange = (key: string, value: string) => {
    setLocalSizes(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card className="card-sizes border-0 w-full">
      <CardHeader className="pb-2 pt-3">{/* Padding horizontal géré par CSS global */}
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold card-title text-white">
              <Ruler className="h-5 w-5 text-white" />
              Tailles & pointures
            </CardTitle>
            <p className="text-xs mt-0.5 opacity-75 text-white">
              Tes mesures pour vêtements, chaussures, bijoux, etc.
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="btn-icon-orange w-8 h-8 shadow-lg"
              aria-label="Modifier"
            >
              <Edit3 className="h-3.5 w-3.5 text-white" />
            </button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 pb-3">{/* Padding horizontal géré par CSS global */}
        {isEditing ? (
          <>
            <div className="space-y-2">
              {sizeFields.map(field => (
                <div key={field.key} className="flex gap-2 items-center">
                  <label className="text-sm font-medium text-white flex-1">{field.label}:</label>
                  <Input
                    value={localSizes[field.key as keyof typeof localSizes] || ''}
                    onChange={(e) => handleSizeChange(field.key, e.target.value)}
                    placeholder="Ex. S, 40, 52..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="btn-orange flex-1 hover:opacity-90"
              >
                Enregistrer
              </Button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {sizeFields.map(field => {
              const value = sizes[field.key as keyof typeof sizes];
              return value ? (
                <Badge key={field.key} variant="secondary" className="chip-size border border-white">
                  {field.label}: {value}
                </Badge>
              ) : null;
            })}
          </div>
        )}
        
        {!isEditing && Object.values(sizes).every(v => !v) && (
          <p className="text-gray-500 text-sm italic">
            Aucune taille renseignée
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function BrandsCard({ items, onAddItem, onRemoveItem }: {
  items: string[];
  onAddItem: (item: string) => void;
  onRemoveItem: (index: number) => void;
}) {
  return (
    <PreferencesCard
      title="Marques & lieux préférés"
      icon={<Tag className="h-5 w-5" />}
      items={items}
      onAddItem={onAddItem}
      onRemoveItem={onRemoveItem}
      colorScheme="violet"
      placeholder="Tapez une marque…"
      maxItems={10}
      helpText="Enseignes, boutiques et sites que tu privilégies."
    />
  );
}