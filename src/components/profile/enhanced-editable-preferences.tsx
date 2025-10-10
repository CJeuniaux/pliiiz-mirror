import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Loader2 } from 'lucide-react';
import { usePreferences } from '@/hooks/use-preferences';
import { useToast } from '@/hooks/use-toast';

interface EditablePreferencesProps {
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function EditablePreferences({
  isEditing,
  onToggleEdit
}: EditablePreferencesProps) {
  const {
    preferences,
    loading,
    updatePreferences
  } = usePreferences();
  const { toast } = useToast();

  // Form state
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [giftIdeas, setGiftIdeas] = useState<string[]>([]);
  const [sizes, setSizes] = useState({
    top: '',
    bottom: '',
    shoes: '',
    other: ''
  });

  // Save state management
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load preferences into form state
  useEffect(() => {
    if (preferences) {
      setLikes(preferences.likes || []);
      setDislikes(preferences.dislikes || []);
      setAllergies(preferences.allergies || []);
      setGiftIdeas(preferences.gift_ideas || preferences.current_wants || []);
      setSizes({
        top: preferences.sizes?.top || '',
        bottom: preferences.sizes?.bottom || '',
        shoes: preferences.sizes?.shoes || '',
        other: preferences.sizes?.other || ''
      });
      setHasUnsavedChanges(false);
    }
  }, [preferences]);

  // Track changes for unsaved warning
  useEffect(() => {
    if (!preferences) return;
    
    const hasChanges = 
      JSON.stringify(likes) !== JSON.stringify(preferences.likes || []) ||
      JSON.stringify(dislikes) !== JSON.stringify(preferences.dislikes || []) ||
      JSON.stringify(allergies) !== JSON.stringify(preferences.allergies || []) ||
      JSON.stringify(giftIdeas) !== JSON.stringify(preferences.gift_ideas || preferences.current_wants || []) ||
      JSON.stringify(sizes) !== JSON.stringify({
        top: preferences.sizes?.top || '',
        bottom: preferences.sizes?.bottom || '',
        shoes: preferences.sizes?.shoes || '',
        other: preferences.sizes?.other || ''
      });
    
    setHasUnsavedChanges(hasChanges);
  }, [likes, dislikes, allergies, giftIdeas, sizes, preferences]);

  // Navigation warning for unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Debounced save function to prevent duplicate submissions
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (immediate = false) => {
        clearTimeout(timeoutId);
        if (immediate) {
          handleSave();
        } else {
          timeoutId = setTimeout(async () => {
            debouncedSave(true); // Call immediately when user clicks save
          }, 600);
        }
      };
    })(),
    [likes, dislikes, allergies, giftIdeas, sizes]
  );

  const handleSave = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      
      const updatedPreferences = {
        likes,
        dislikes,
        allergies,
        gift_ideas: giftIdeas,
        sizes
      };
      
      await updatePreferences(updatedPreferences);
      
      toast({
        title: "Préférences enregistrées."
      });
      
      setHasUnsavedChanges(false);
      onToggleEdit();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Échec de l'enregistrement. Réessayez.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("Vous avez des modifications non sauvegardées. Voulez-vous vraiment annuler ?")) {
        // Reset to original values
        if (preferences) {
          setLikes(preferences.likes || []);
          setDislikes(preferences.dislikes || []);
          setAllergies(preferences.allergies || []);
          setGiftIdeas(preferences.gift_ideas || preferences.current_wants || []);
          setSizes({
            top: preferences.sizes?.top || '',
            bottom: preferences.sizes?.bottom || '',
            shoes: preferences.sizes?.shoes || '',
            other: preferences.sizes?.other || ''
          });
        }
        setHasUnsavedChanges(false);
        onToggleEdit();
      }
    } else {
      onToggleEdit();
    }
  };
  const SimplePreferenceSection = ({
    title,
    items,
    setItems,
    placeholder
  }: {
    title: string;
    items: string[];
    setItems: React.Dispatch<React.SetStateAction<string[]>>;
    placeholder: string;
  }) => {
    return <Card className="card-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditing && <div className="flex gap-2">
              <Input placeholder={placeholder} onKeyPress={e => {
            if (e.key === 'Enter') {
              const value = (e.target as HTMLInputElement).value.trim();
              if (value && !items.includes(value)) {
                setItems([...items, value]);
                (e.target as HTMLInputElement).value = '';
              }
            }
          }} />
            </div>}
          
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => <Badge key={index} variant="secondary" className="text-xs">
                {item}
                {isEditing && <Button size="sm" variant="ghost" className="ml-1 h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground" onClick={() => setItems(items.filter((_, i) => i !== index))}>
                    <X className="h-2 w-2" />
                  </Button>}
              </Badge>)}
          </div>
        </CardContent>
      </Card>;
  };
  // Button component for reusability
  const ActionButtons = ({ className = "" }: { className?: string }) => (
    <div className={`flex gap-2 ${className}`}>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleCancel}
        disabled={isSaving}
      >
        Annuler
      </Button>
      <Button 
        size="sm" 
        onClick={() => debouncedSave(true)}
        disabled={isSaving}
        className="whitespace-nowrap text-sm" 
        style={{ background: 'var(--grad-primary)' }}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Sauvegarde...
          </>
        ) : (
          'Sauvegarder'
        )}
      </Button>
    </div>
  );

  if (loading) {
    return <div>Chargement des préférences...</div>;
  }
  
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-outfit font-extrabold">Mes préférences</h3>
        {!isEditing ? <Button variant="outline" size="sm" onClick={onToggleEdit}>
            <Edit3 className="h-4 w-4 mr-2" />
            Modifier
          </Button> : <ActionButtons />}
      </div>

      <div className="space-y-4">
        <SimplePreferenceSection 
          title="J'aime" 
          items={likes} 
          setItems={setLikes} 
          placeholder="Ex: chocolat noir, livres SF..." 
        />

        <SimplePreferenceSection 
          title="À éviter" 
          items={dislikes} 
          setItems={setDislikes} 
          placeholder="Ex: parfums forts, gadgets..." 
        />

        {/* Allergies section (no occasions needed) */}
        <Card className="card-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Allergies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEditing && <div className="flex gap-2">
                <Input placeholder="Ex: arachides, pollen..." onKeyPress={e => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value) {
                  setAllergies([...allergies, value]);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }} />
              </div>}
            <div className="flex flex-wrap gap-2">
              {allergies.map((allergy, index) => <Badge key={index} variant="outline" className="text-xs">
                  {allergy}
                  {isEditing && <Button size="sm" variant="ghost" className="ml-1 h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground" onClick={() => setAllergies(allergies.filter((_, i) => i !== index))}>
                      <X className="h-2 w-2" />
                    </Button>}
                </Badge>)}
            </div>
          </CardContent>
        </Card>

        {/* Gift Ideas section (formerly Current wants) */}
        <Card className="card-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Idées cadeaux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEditing && <div className="flex gap-2">
                <Input placeholder="Ex: carnet pointillé, support vélo..." onKeyPress={e => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value) {
                  setGiftIdeas([...giftIdeas, value]);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }} />
              </div>}
            <div className="flex flex-wrap gap-2">
              {giftIdeas.map((idea, index) => <Badge key={index} variant="default" className="text-xs">
                  {idea}
                  {isEditing && <Button size="sm" variant="ghost" className="ml-1 h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground" onClick={() => setGiftIdeas(giftIdeas.filter((_, i) => i !== index))}>
                      <X className="h-2 w-2" />
                    </Button>}
                </Badge>)}
            </div>
          </CardContent>
        </Card>

        {/* Sizes section */}
        <Card className="card-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tailles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Haut</label>
                {isEditing ? <Input value={sizes.top} onChange={e => setSizes({
                ...sizes,
                top: e.target.value
              })} placeholder="Ex: M" /> : <p className="text-sm">{sizes.top || 'Non renseigné'}</p>}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Pantalon</label>
                {isEditing ? <Input value={sizes.bottom} onChange={e => setSizes({
                ...sizes,
                bottom: e.target.value
              })} placeholder="Ex: 38" /> : <p className="text-sm">{sizes.bottom || 'Non renseigné'}</p>}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Chaussures</label>
                {isEditing ? <Input value={sizes.shoes} onChange={e => setSizes({
                ...sizes,
                shoes: e.target.value
              })} placeholder="Ex: 39" /> : <p className="text-sm">{sizes.shoes || 'Non renseigné'}</p>}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Autre</label>
                {isEditing ? <Input value={sizes.other} onChange={e => setSizes({
                ...sizes,
                other: e.target.value
              })} placeholder="Ex: Bague 54" /> : <p className="text-sm">{sizes.other || 'Non renseigné'}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duplicate Action Buttons after Tailles section */}
        {isEditing && (
          <div className="flex justify-end pt-2">
            <ActionButtons />
          </div>
        )}
      </div>
    </div>;
}