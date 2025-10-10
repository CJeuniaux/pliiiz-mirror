import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { X, Plus, Save, ArrowLeft } from 'lucide-react';
import { usePrefsForm } from '@/hooks/use-prefs-form';

interface OccasionsPreferencesEditorProps {
  onBack: () => void;
}

export function OccasionsPreferencesEditor({ onBack }: OccasionsPreferencesEditorProps) {
  const { prefs, form, setForm, onSave, onCancel, loading } = usePrefsForm();
  
  const occasionTypes = [
    { key: 'brunch', label: 'Brunch', emoji: '🥐' },
    { key: 'cremaillere', label: 'Crémaillère', emoji: '🏠' },
    { key: 'anniversaire', label: 'Anniversaire', emoji: '🎂' },
    { key: 'diner_amis', label: 'Dîner entre amis', emoji: '🍽️' }
  ];

  const [newItems, setNewItems] = useState<Record<string, Record<string, string>>>({});

  // Initialiser les nouveaux items
  useEffect(() => {
    const initialNewItems: Record<string, Record<string, string>> = {};
    occasionTypes.forEach(occasion => {
      initialNewItems[occasion.key] = {
        likes: '',
        allergies: '',
        avoid: '',
        gift_ideas: ''
      };
    });
    setNewItems(initialNewItems);
  }, []);

  const addItem = (occasionKey: string, section: string, value: string) => {
    if (!value.trim() || !form) return;

    const newForm = { ...form };
    if (!newForm.occasions) newForm.occasions = {};
    if (!newForm.occasions[occasionKey]) newForm.occasions[occasionKey] = {};
    if (!newForm.occasions[occasionKey][section]) newForm.occasions[occasionKey][section] = [];

    newForm.occasions[occasionKey][section] = [
      ...newForm.occasions[occasionKey][section],
      value.trim()
    ];

    setForm(newForm);
    
    // Reset input
    setNewItems(prev => ({
      ...prev,
      [occasionKey]: {
        ...prev[occasionKey],
        [section]: ''
      }
    }));
  };

  const removeItem = (occasionKey: string, section: string, index: number) => {
    if (!form) return;

    const newForm = { ...form };
    if (newForm.occasions?.[occasionKey]?.[section]) {
      newForm.occasions[occasionKey][section] = newForm.occasions[occasionKey][section].filter(
        (_: any, i: number) => i !== index
      );
    }
    setForm(newForm);
  };

  const handleSave = async () => {
    await onSave();
    onBack();
  };

  const handleCancel = () => {
    onCancel();
    onBack();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Préférences par occasion" onBack={onBack} />
        <div className="p-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const PreferenceSection = ({ occasionKey, sectionKey, title, variant = 'secondary' }: {
    occasionKey: string;
    sectionKey: string;
    title: string;
    variant?: 'secondary' | 'destructive' | 'outline';
  }) => {
    const items = form?.occasions?.[occasionKey]?.[sectionKey] || [];
    const newValue = newItems[occasionKey]?.[sectionKey] || '';

    return (
      <div className="space-y-3">
        <h5 className="text-sm font-medium text-muted-foreground">{title}</h5>
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {items.map((item: string, index: number) => (
            <Badge key={index} variant={variant} className="text-sm">
              {item}
              <button
                onClick={() => removeItem(occasionKey, sectionKey, index)}
                className="ml-2 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={`Ajouter ${title.toLowerCase()}`}
            value={newValue}
            onChange={(e) => setNewItems(prev => ({
              ...prev,
              [occasionKey]: {
                ...prev[occasionKey],
                [sectionKey]: e.target.value
              }
            }))}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addItem(occasionKey, sectionKey, newValue);
              }
            }}
            className="flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => addItem(occasionKey, sectionKey, newValue)}
            disabled={!newValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Préférences par occasion" onBack={handleCancel} />
      
      {/* Boutons de sauvegarde en haut */}
      <div className="p-6 border-b bg-background">
        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {occasionTypes.map((occasion) => (
          <Card key={occasion.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span>{occasion.emoji}</span>
                {occasion.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <PreferenceSection
                occasionKey={occasion.key}
                sectionKey="likes"
                title="J'aime"
                variant="secondary"
              />
              <PreferenceSection
                occasionKey={occasion.key}
                sectionKey="allergies"
                title="Allergies"
                variant="destructive"
              />
              <PreferenceSection
                occasionKey={occasion.key}
                sectionKey="avoid"
                title="À éviter"
                variant="outline"
              />
              <PreferenceSection
                occasionKey={occasion.key}
                sectionKey="gift_ideas"
                title="Idées cadeaux"
                variant="secondary"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Boutons de sauvegarde en bas aussi */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}