import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Loader2, Star, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GuidedPreferenceSelector } from '@/components/preferences/guided-preference-selector';
import { PreferenceItem, createPreferenceItem } from '@/lib/taxonomy';


interface GlobalPreferences {
  likes: PreferenceItem[];
  avoid: PreferenceItem[];
  allergies: PreferenceItem[];
  sizes: {
    top?: string;
    pants?: string;
    shoes?: string;
    other?: string;
  };
  giftIdeas: PreferenceItem[];
}

interface GlobalPreferencesEditorProps {
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function GlobalPreferencesEditor({ isEditing, onToggleEdit }: GlobalPreferencesEditorProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<GlobalPreferences>({
    likes: [],
    avoid: [],
    allergies: [],
    sizes: {},
    giftIdeas: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load global preferences
  useEffect(() => {
    if (!user) return;
    
    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('global_preferences')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        const globalPrefs = (data?.global_preferences as unknown as GlobalPreferences) || {
          likes: [],
          avoid: [],
          allergies: [],
          sizes: {},
          giftIdeas: []
        };

        setPreferences(globalPrefs);
      } catch (error) {
        console.error('Error loading global preferences:', error);
        toast.error('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const handleSave = async () => {
    if (!user || isSaving) return;

    try {
      setIsSaving(true);
      
      // Utiliser la fonction sécurisée pour garantir la sauvegarde
      const { data, error } = await supabase
        .rpc('safe_upsert_profile', {
          p_user_id: user.id,
          p_updates: { global_preferences: preferences as any }
        });

      if (error) throw error;

      toast.success('Préférences globales sauvegardées');
      setHasUnsavedChanges(false);
      onToggleEdit();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges && !window.confirm('Voulez-vous vraiment annuler vos modifications ?')) {
      return;
    }
    onToggleEdit();
  };

  const addItem = (section: keyof Omit<GlobalPreferences, 'sizes'>, value: string) => {
    if (!value.trim()) return;

    const kind = section === 'likes' ? 'like' : 
                 section === 'giftIdeas' ? 'giftIdea' : 
                 section === 'avoid' ? 'avoid' : 'allergy';
    
    const level = section === 'likes' || section === 'giftIdeas' ? 2 : undefined;
    const newItem = createPreferenceItem(kind, value.trim(), undefined, level);

    setPreferences(prev => ({
      ...prev,
      [section]: [...prev[section], newItem]
    }));
    setHasUnsavedChanges(true);
  };

  const addGuidedItem = (section: keyof Omit<GlobalPreferences, 'sizes'>, item: PreferenceItem) => {
    setPreferences(prev => ({
      ...prev,
      [section]: [...prev[section], item]
    }));
    setHasUnsavedChanges(true);
  };

  const removeItem = (section: keyof Omit<GlobalPreferences, 'sizes'>, index: number) => {
    setPreferences(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
  };

  const updateStarLevel = (section: 'likes' | 'giftIdeas', index: number, level: number) => {
    setPreferences(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, level } : item
      )
    }));
    setHasUnsavedChanges(true);
  };

  const updateSizes = (key: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      sizes: { ...prev.sizes, [key]: value }
    }));
    setHasUnsavedChanges(true);
  };

  const StarRating = ({ level, onChange }: { level: number; onChange: (level: number) => void }) => (
    <div className="flex gap-0.5 ml-2">
      {[1, 2, 3].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-0.5 hover:scale-110 transition-transform"
        >
          <Star 
            className={`h-3 w-3 ${star <= level ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
          />
        </button>
      ))}
    </div>
  );

  const PreferenceSection = ({ 
    title, 
    items, 
    section, 
    placeholder,
    hasStars = false 
  }: { 
    title: string; 
    items: PreferenceItem[]; 
    section: keyof Omit<GlobalPreferences, 'sizes'>;
    placeholder: string;
    hasStars?: boolean;
  }) => {
    const [newItem, setNewItem] = useState('');
    const [showGuidedSelector, setShowGuidedSelector] = useState(false);

    const kind = section === 'likes' ? 'like' : 
                 section === 'giftIdeas' ? 'giftIdea' : 
                 section === 'avoid' ? 'avoid' : 'allergy';

    return (
      <>
        <Card className="card-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEditing && (
              <div className="space-y-2">
                {hasStars && (
                  <Button 
                    onClick={() => setShowGuidedSelector(true)}
                    size="sm"
                    variant="gradient"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter avec l'assistant
                  </Button>
                )}
                
                <div className="flex gap-2">
                  <Input 
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder={placeholder}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addItem(section, newItem);
                        setNewItem('');
                      }
                    }}
                  />
                  <Button 
                    onClick={() => {
                      addItem(section, newItem);
                      setNewItem('');
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <Badge 
                  key={item.id || index} 
                  variant="secondary" 
                  className="text-xs flex items-center gap-1 min-w-0 flex-shrink-0 whitespace-nowrap max-w-full overflow-hidden"
                >
                  {item.label}
                  {hasStars && item.level && (
                    <StarRating 
                      level={item.level} 
                      onChange={(level) => updateStarLevel(section as 'likes' | 'giftIdeas', index, level)}
                    />
                  )}
                  {isEditing && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="ml-1 h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeItem(section, index)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <GuidedPreferenceSelector
          isOpen={showGuidedSelector}
          onClose={() => setShowGuidedSelector(false)}
          onAdd={(item) => addGuidedItem(section, item)}
          kind={kind}
          title={title}
        />
      </>
    );
  };

  const ActionButtons = ({ className = "" }: { className?: string }) => (
    <div className={`flex gap-4 ${className}`}>
      <Button variant="outline" size="default" onClick={handleCancel} disabled={isSaving} className="min-w-[120px]">
        Annuler
      </Button>
      <Button size="default" onClick={handleSave} disabled={isSaving} variant="gradient" className="min-w-[120px]">
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

  if (loading) return <div>Chargement des préférences globales...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4">
        
        {!isEditing ? (
          <Button variant="outline" size="default" onClick={onToggleEdit} className="min-w-[120px]">
            <Edit3 className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        ) : (
          <ActionButtons />
        )}
      </div>

      <div className="space-y-4">
        <PreferenceSection 
          title="J'aime" 
          items={preferences.likes} 
          section="likes"
          placeholder="Ex: chocolat noir, livres SF..." 
          hasStars={true}
        />

        <PreferenceSection 
          title="À éviter" 
          items={preferences.avoid} 
          section="avoid"
          placeholder="Ex: parfums forts, gadgets..." 
        />

        <PreferenceSection 
          title="Allergies" 
          items={preferences.allergies} 
          section="allergies"
          placeholder="Ex: arachides, pollen..." 
        />

        <PreferenceSection 
          title="Idées cadeaux" 
          items={preferences.giftIdeas} 
          section="giftIdeas"
          placeholder="Ex: carnet pointillé, support vélo..." 
          hasStars={true}
        />

        {/* Sizes section */}
        <Card className="card-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tailles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Haut</label>
                {isEditing ? (
                  <Input 
                    value={preferences.sizes.top || ''} 
                    onChange={(e) => updateSizes('top', e.target.value)}
                    placeholder="Ex: M" 
                  />
                ) : (
                  <p className="text-sm">{preferences.sizes.top || 'Non renseigné'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Pantalon</label>
                {isEditing ? (
                  <Input 
                    value={preferences.sizes.pants || ''} 
                    onChange={(e) => updateSizes('pants', e.target.value)}
                    placeholder="Ex: 38" 
                  />
                ) : (
                  <p className="text-sm">{preferences.sizes.pants || 'Non renseigné'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Chaussures</label>
                {isEditing ? (
                  <Input 
                    value={preferences.sizes.shoes || ''} 
                    onChange={(e) => updateSizes('shoes', e.target.value)}
                    placeholder="Ex: 39" 
                  />
                ) : (
                  <p className="text-sm">{preferences.sizes.shoes || 'Non renseigné'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Autre</label>
                {isEditing ? (
                  <Input 
                    value={preferences.sizes.other || ''} 
                    onChange={(e) => updateSizes('other', e.target.value)}
                    placeholder="Ex: Bague 54" 
                  />
                ) : (
                  <p className="text-sm">{preferences.sizes.other || 'Non renseigné'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom action buttons */}
        {isEditing && (
          <div className="flex justify-end pt-2">
            <ActionButtons />
          </div>
        )}
      </div>
    </div>
  );
}