import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus, X, Check } from "lucide-react";

interface EditableSectionProps {
  title: string;
  items: string[];
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onAddItem: (item: string) => void;
  onRemoveItem: (index: number) => void;
  newItem: string;
  onNewItemChange: (value: string) => void;
  emptyMessage?: string;
  icon?: React.ReactNode;
}

export function EditableSection({
  title,
  items,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  onAddItem,
  onRemoveItem,
  newItem,
  onNewItemChange,
  emptyMessage = "Aucun élément ajouté",
  icon
}: EditableSectionProps) {
  const handleAddItem = () => {
    if (newItem.trim()) {
      onAddItem(newItem.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-outfit font-bold text-lg text-text-strong">{title}</h3>
        </div>
        {!isEditing && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onStartEdit}
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => onNewItemChange(e.target.value)}
              placeholder="Ajouter un élément..."
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button size="sm" onClick={handleAddItem}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-sm flex items-center gap-1"
              >
                {item}
                <button 
                  onClick={() => onRemoveItem(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave}>
              <Check className="w-4 h-4 mr-1" />
              Sauvegarder
            </Button>
            <Button variant="outline" size="sm" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-sm"
                >
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground font-inter text-sm italic">
              {emptyMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}