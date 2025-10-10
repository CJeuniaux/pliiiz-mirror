import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Star, Plus, ArrowLeft } from 'lucide-react';
import { 
  DEFAULT_TAXONOMY, 
  TaxonomyCategory, 
  TaxonomyAttribute, 
  PreferenceItem,
  generateLabel,
  createPreferenceItem,
  findCategoryById 
} from '@/lib/taxonomy';

interface GuidedPreferenceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: PreferenceItem) => void;
  kind: 'like' | 'giftIdea' | 'avoid' | 'allergy';
  title: string;
}

interface SelectedAttributes {
  [key: string]: any;
}

export function GuidedPreferenceSelector({ 
  isOpen, 
  onClose, 
  onAdd, 
  kind, 
  title 
}: GuidedPreferenceSelectorProps) {
  const [step, setStep] = useState<'category' | 'attributes' | 'preview'>('category');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaxonomyCategory | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttributes>({});
  const [starLevel, setStarLevel] = useState(2);
  const [freeTextInput, setFreeTextInput] = useState('');

  const showStars = kind === 'like' || kind === 'giftIdea';
  const categories = DEFAULT_TAXONOMY.categories;

  const filteredCategories = categories.filter(cat => 
    cat.label.fr.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategorySelect = (category: TaxonomyCategory) => {
    setSelectedCategory(category);
    setSelectedAttributes({});
    setStep('attributes');
  };

  const handleAttributeChange = (attr: TaxonomyAttribute, value: any) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attr.key]: value
    }));
  };

  const handlePreview = () => {
    if (!selectedCategory) return;
    setStep('preview');
  };

  const handleAdd = () => {
    if (!selectedCategory) return;

    const label = generateLabel(selectedCategory, selectedAttributes);
    const canonical = {
      categoryId: selectedCategory.id,
      path: [selectedCategory.id],
      attrs: selectedAttributes
    };

    const item = createPreferenceItem(kind, label, canonical, showStars ? starLevel : undefined);
    onAdd(item);
    handleClose();
  };

  const handleAddFreeText = () => {
    if (!freeTextInput.trim()) return;

    const item = createPreferenceItem(kind, freeTextInput.trim(), undefined, showStars ? starLevel : undefined);
    onAdd(item);
    handleClose();
  };

  const handleClose = () => {
    setStep('category');
    setSelectedCategory(null);
    setSelectedAttributes({});
    setStarLevel(2);
    setFreeTextInput('');
    setSearchTerm('');
    onClose();
  };

  const canGeneratePreview = selectedCategory && 
    selectedCategory.attributes
      .filter(attr => !attr.optional)
      .every(attr => selectedAttributes[attr.key] !== undefined);

  const previewLabel = selectedCategory ? generateLabel(selectedCategory, selectedAttributes) : '';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== 'category' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step === 'preview' ? 'attributes' : 'category')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            Ajouter à "{title}"
          </DialogTitle>
        </DialogHeader>

        {step === 'category' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-3 gap-1">
              {filteredCategories.map(category => (
                <Button
                  key={category.id}
                  variant="outline"
                  className="h-auto p-2 text-xs text-left justify-start whitespace-normal leading-tight"
                  onClick={() => handleCategorySelect(category)}
                >
                  {category.label.fr}
                </Button>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ou tapez votre propre texte..."
                  value={freeTextInput}
                  onChange={(e) => setFreeTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFreeText()}
                />
                <Button
                  onClick={handleAddFreeText}
                  disabled={!freeTextInput.trim()}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'attributes' && selectedCategory && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Catégorie: <Badge variant="secondary">{selectedCategory.label.fr}</Badge>
            </div>

            <div className="space-y-4 max-h-64 overflow-y-auto">
              {selectedCategory.attributes.map(attr => (
                <AttributeInput
                  key={attr.key}
                  attribute={attr}
                  value={selectedAttributes[attr.key]}
                  onChange={(value) => handleAttributeChange(attr, value)}
                  category={selectedCategory}
                />
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep('category')}>
                Retour
              </Button>
              <Button 
                onClick={handlePreview}
                disabled={!canGeneratePreview}
                className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white"
              >
                Aperçu
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{previewLabel}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedCategory?.label.fr}
                    </div>
                  </div>
                  {showStars && (
                    <div className="flex gap-1">
                      {[1, 2, 3].map(level => (
                        <button
                          key={level}
                          onClick={() => setStarLevel(level)}
                          className={`p-1 ${starLevel >= level ? 'text-yellow-500' : 'text-gray-300'}`}
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep('attributes')}>
                Modifier
              </Button>
              <Button 
                onClick={handleAdd}
                className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white"
              >
                Ajouter
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AttributeInputProps {
  attribute: TaxonomyAttribute;
  value: any;
  onChange: (value: any) => void;
  category: TaxonomyCategory;
}

function AttributeInput({ attribute, value, onChange, category }: AttributeInputProps) {
  const { key, label, type, options, min, max, step, optional } = attribute;

  if (type === 'single' && options) {
    return (
      <div>
        <label className="block text-sm font-medium mb-2">
          {label} {!optional && <span className="text-red-500">*</span>}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {options.map(option => (
            <Button
              key={option}
              variant={value === option ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(option)}
            >
              {category.i18n[option] || option}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'multi' && options) {
    const selectedValues = value || [];
    
    return (
      <div>
        <label className="block text-sm font-medium mb-2">
          {label} {!optional && <span className="text-red-500">*</span>}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {options.map(option => {
            const isSelected = selectedValues.includes(option);
            return (
              <Button
                key={option}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const newValue = isSelected 
                    ? selectedValues.filter((v: string) => v !== option)
                    : [...selectedValues, option];
                  onChange(newValue.length > 0 ? newValue : undefined);
                }}
              >
                {category.i18n[option] || option}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'range') {
    return (
      <div>
        <label className="block text-sm font-medium mb-2">
          {label} {!optional && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value || min}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-medium w-12">
            {value || min}{label.includes('%') ? '%' : ''}
          </span>
        </div>
      </div>
    );
  }

  return null;
}