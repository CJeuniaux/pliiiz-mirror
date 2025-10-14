import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Edit3, Heart, ShieldX, AlertTriangle, Shirt, Settings, ChevronRight } from 'lucide-react';
import { usePreferences } from '@/hooks/use-preferences';
import { useToast } from '@/hooks/use-toast';
import { TagInputGuided } from '@/components/ui/tag-input-guided';

interface TagWithPriority {
  text: string;
  priority?: 1 | 2 | 3;
}

interface EditablePreferencesProps {
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function EditablePreferences({ isEditing, onToggleEdit }: EditablePreferencesProps) {
  const { preferences, updatePreferences, loading } = usePreferences();
  const { toast } = useToast();
  
  const [likes, setLikes] = useState<TagWithPriority[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [currentWants, setCurrentWants] = useState<string[]>([]);
  const [sizes, setSizes] = useState({
    tshirt: '',
    pants: '',
    shoes: '',
    other: ''
  });

  const [newDislikeItem, setNewDislikeItem] = useState('');
  const [newAllergyItem, setNewAllergyItem] = useState('');

  useEffect(() => {
    if (preferences) {
      // Convert simple string array to TagWithPriority array
      const convertedLikes = (preferences.likes || []).map((like: string) => ({ text: like, priority: 1 as const }));
      setLikes(convertedLikes);
      setDislikes(preferences.dislikes || []);
      setAllergies(preferences.allergies || []);
      setCurrentWants(preferences.current_wants || []);
      const preferenceSizes = preferences.sizes || {};
      setSizes({
        tshirt: preferenceSizes.top || '',
        pants: preferenceSizes.bottom || '',
        shoes: preferenceSizes.shoes || '',
        other: preferenceSizes.other || ''
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    try {
      // Convert TagWithPriority array back to simple string array for backend
      const likesStrings = likes.map(like => like.text);
      
      await updatePreferences({
        likes: likesStrings,
        dislikes,
        allergies,
        current_wants: currentWants,
        sizes: {
          top: sizes.tshirt,
          bottom: sizes.pants,
          shoes: sizes.shoes,
          other: sizes.other
        }
      });
      toast({
        title: "Préférences sauvegardées",
        description: "Vos préférences ont été mises à jour avec succès."
      });
      onToggleEdit();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos préférences.",
        variant: "destructive"
      });
    }
  };

  const removeDislike = (index: number) => {
    setDislikes(dislikes.filter((_, i) => i !== index));
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="space-y-4">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-outfit font-extrabold">Mes préférences globales</h2>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={onToggleEdit}>
            <Settings className="h-4 w-4 mr-1" />
            Éditer mes préférences globales
          </Button>
        )}
      </div>

      {/* Section J'aime */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-success" />
          <h3 className="text-lg font-outfit font-extrabold">J'aime</h3>
        </div>

        {isEditing ? (
          <TagInputGuided
            tags={likes}
            onTagsChange={setLikes}
            placeholder="Ajouter quelque chose que vous aimez..."
            showPriority={true}
            sectionType="likes"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {likes.map((item, index) => (
              <Badge key={index} variant="secondary" className="gap-1 flex items-center">
                {item.text}
                <div className="flex ml-1">
                  {[1, 2, 3].map((star) => (
                    <span
                      key={star}
                      className={`text-xs ${star <= (item.priority || 1) ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Section À éviter */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldX className="h-5 w-5 text-danger" />
          <h3 className="text-lg font-outfit font-extrabold">À éviter</h3>
        </div>

        {isEditing ? (
          <div className="flex gap-2 w-full">
            <Input
              value={newDislikeItem}
              onChange={(e) => setNewDislikeItem(e.target.value)}
              placeholder="Ajouter quelque chose à éviter..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newDislikeItem.trim()) {
                    setDislikes([...dislikes, newDislikeItem.trim()]);
                    setNewDislikeItem('');
                  }
                }
              }}
              className="flex-1"
            />
            <Button 
              onClick={() => {
                if (newDislikeItem.trim()) {
                  setDislikes([...dislikes, newDislikeItem.trim()]);
                  setNewDislikeItem('');
                }
              }} 
              size="sm"
            >
              Ajouter
            </Button>
          </div>
        ) : null}
        
        <div className="flex flex-wrap gap-2">
          {dislikes.map((item, index) => (
            <Badge key={index} variant="destructive" className="gap-1">
              {item}
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 hover:bg-white hover:text-destructive"
                  onClick={() => removeDislike(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      </div>

      {/* Section Allergies */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h3 className="text-lg font-outfit font-extrabold">Allergies</h3>
        </div>

        {isEditing ? (
          <div className="flex gap-2 w-full">
            <Input
              value={newAllergyItem}
              onChange={(e) => setNewAllergyItem(e.target.value)}
              placeholder="Ajouter une allergie..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newAllergyItem.trim()) {
                    setAllergies([...allergies, newAllergyItem.trim()]);
                    setNewAllergyItem('');
                  }
                }
              }}
              className="flex-1"
            />
            <Button 
              onClick={() => {
                if (newAllergyItem.trim()) {
                  setAllergies([...allergies, newAllergyItem.trim()]);
                  setNewAllergyItem('');
                }
              }} 
              size="sm"
            >
              Ajouter
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {allergies.map((item, index) => (
            <Badge key={index} variant="outline" className="gap-1 border-warning text-warning">
              {item}
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 hover:bg-warning hover:text-white"
                  onClick={() => removeAllergy(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      </div>

      {/* Section Idées cadeaux */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-outfit font-extrabold">Idées cadeaux</h3>
        </div>

        {isEditing ? (
          <TagInputGuided
            tags={currentWants.map(want => ({ text: want }))}
            onTagsChange={(tags) => setCurrentWants(tags.map(tag => tag.text))}
            placeholder="Ajouter une idée cadeau..."
            sectionType="wants"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {currentWants.map((item, index) => (
              <Badge key={index} variant="secondary" className="gap-1 bg-pink-100 text-pink-700">
                {item}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Section Taille UE */}
      {isEditing && (
        <Card className="card-soft">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Shirt className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-outfit font-extrabold">Taille UE</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tshirt">T-shirt/Haut</Label>
                <Input
                  id="tshirt"
                  value={sizes.tshirt}
                  onChange={(e) => setSizes(prev => ({ ...prev, tshirt: e.target.value }))}
                  placeholder="Ex: M, L..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pants">Pantalon</Label>
                <Input
                  id="pants"
                  value={sizes.pants}
                  onChange={(e) => setSizes(prev => ({ ...prev, pants: e.target.value }))}
                  placeholder="Ex: 38, 40..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shoes">Chaussures</Label>
                <Input
                  id="shoes"
                  value={sizes.shoes}
                  onChange={(e) => setSizes(prev => ({ ...prev, shoes: e.target.value }))}
                  placeholder="Ex: 39, 42..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other">Autre</Label>
                <Input
                  id="other"
                  value={sizes.other}
                  onChange={(e) => setSizes(prev => ({ ...prev, other: e.target.value }))}
                  placeholder="Autres tailles..."
                />
              </div>
            </div>
            
          </CardContent>
        </Card>
      )}

      {/* Buttons after Tailles section */}
      {isEditing && (
        <div className="space-y-3 pt-4">
          <Button onClick={handleSave} variant="gradient" className="w-full">
            Sauvegarder mes préférences
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-primary hover:text-primary" 
            onClick={() => {
              // Navigate to next occasion preferences 
              console.log("Navigate to next occasion preferences");
            }}
          >
            <ChevronRight className="h-4 w-4 mr-1" />
            Vers mes préférences (occasion suivante)
          </Button>
          <Button variant="outline" onClick={onToggleEdit} className="w-full">
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
}