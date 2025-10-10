import { useState, KeyboardEvent } from "react";
import { X, Star } from "lucide-react";
import { Input } from "./input";
import { Badge } from "./badge";
import { Button } from "./button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface TagWithPriority {
  text: string;
  priority?: 1 | 2 | 3;
}

interface TagInputGuidedProps {
  tags: TagWithPriority[];
  onTagsChange: (tags: TagWithPriority[]) => void;
  placeholder?: string;
  className?: string;
  suggestions?: string[];
  showPriority?: boolean;
  sectionType?: string;
}

const DEFAULT_SUGGESTIONS = {
  likes: [
    "thé vert", "thé en vrac", "thé en sachet", "café arabica", "café robusta",
    "chocolat noir 70%", "chocolat au lait", "chocolat blanc", "chocolat belge",
    "vin rouge", "vin blanc", "champagne", "whisky", "rhum",
    "livres de fiction", "romans policiers", "biographies", "bd/manga",
    "plantes vertes", "plantes grasses", "orchidées", "bonsaï",
    "bijoux dorés", "bijoux argentés", "montres", "parfums floraux", "parfums boisés"
  ],
  wants: [
    "casque audio sans fil", "enceinte bluetooth", "chargeur sans fil",
    "coussin décoratif", "bougie parfumée", "diffuseur d'huiles",
    "carnet de notes", "stylo plume", "agenda 2024",
    "livre de cuisine", "ustensiles de cuisine", "tablier de cuisine",
    "vêtements bio", "chaussettes fantaisie", "écharpe en laine"
  ]
};

export function TagInputGuided({ 
  tags, 
  onTagsChange, 
  placeholder, 
  className, 
  suggestions = [], 
  showPriority = false,
  sectionType = "other"
}: TagInputGuidedProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const allSuggestions = suggestions.length > 0 
    ? suggestions 
    : DEFAULT_SUGGESTIONS[sectionType as keyof typeof DEFAULT_SUGGESTIONS] || [];

  const filteredSuggestions = allSuggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
    !tags.some(tag => tag.text.toLowerCase() === suggestion.toLowerCase())
  );

  const addTag = (text: string, priority: 1 | 2 | 3 = 1) => {
    const trimmed = text.trim();
    if (trimmed && !tags.some(tag => tag.text.toLowerCase() === trimmed.toLowerCase())) {
      const newTag: TagWithPriority = showPriority ? { text: trimmed, priority } : { text: trimmed };
      onTagsChange([...tags, newTag]);
      setInputValue('');
      setIsOpen(false);
    }
  };

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const updateTagPriority = (index: number, priority: 1 | 2 | 3) => {
    const updatedTags = [...tags];
    updatedTags[index] = { ...updatedTags[index], priority };
    onTagsChange(updatedTags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const getPriorityColor = (priority?: number) => {
    switch (priority) {
      case 3: return "text-yellow-500";
      case 2: return "text-yellow-400"; 
      case 1: return "text-gray-300";
      default: return "text-gray-300";
    }
  };

  const renderStars = (priority?: number) => {
    if (!showPriority) return null;
    
    return (
      <div className="flex ml-1">
        {[1, 2, 3].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= (priority || 1) ? getPriorityColor(priority) : 'text-gray-200'} fill-current`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
            {tag.text}
            {renderStars(tag.priority)}
            {showPriority && (
              <div className="flex ml-1">
                {[1, 2, 3].map((star) => (
                  <button
                    key={star}
                    onClick={() => updateTagPriority(index, star as 1 | 2 | 3)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-3 w-3 ${star <= (tag.priority || 1) ? getPriorityColor(tag.priority) : 'text-gray-200'} fill-current`}
                    />
                  </button>
                ))}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1 hover:bg-transparent"
              onClick={() => removeTag(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setIsOpen(e.target.value.length > 0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-1"
                onFocus={() => setIsOpen(inputValue.length > 0)}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Rechercher ou ajouter..." value={inputValue} onValueChange={setInputValue} />
              <CommandList>
                {filteredSuggestions.length > 0 ? (
                  <CommandGroup heading="Suggestions">
                    {filteredSuggestions.slice(0, 8).map((suggestion) => (
                      <CommandItem
                        key={suggestion}
                        value={suggestion}
                        onSelect={() => addTag(suggestion)}
                      >
                        {suggestion}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : inputValue ? (
                  <CommandEmpty>
                    Appuyez sur Entrée pour ajouter "{inputValue}"
                  </CommandEmpty>
                ) : (
                  <CommandEmpty>Tapez pour voir les suggestions...</CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => addTag(inputValue)}
          disabled={!inputValue.trim()}
        >
          Ajouter
        </Button>
      </div>
    </div>
  );
}