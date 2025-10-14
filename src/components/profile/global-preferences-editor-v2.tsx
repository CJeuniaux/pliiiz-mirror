import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, ArrowLeft } from 'lucide-react';
import { usePrefsForm } from '@/hooks/use-prefs-form';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import { saveGlobalPreferences, PreferencesPatch } from '@/lib/persistence';

type SectionKey = 'likes' | 'avoid' | 'gift_ideas' | 'allergies' | 'brands';
type SizeKey = 'top' | 'bottom' | 'shoes' | 'ring' | 'other';

interface GlobalPreferencesEditorV2Props {
  onBack: () => void;
}

export function GlobalPreferencesEditorV2({ onBack }: GlobalPreferencesEditorV2Props) {
  const { form, setForm, onCancel, loading } = usePrefsForm();
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const [newItems, setNewItems] = useState<Record<SectionKey, string>>({
    likes: '',
    avoid: '',
    gift_ideas: '',
    allergies: '',
    brands: '',
  });

  // construit l’objet patch
  const buildPatch = useCallback((): PreferencesPatch => ({
    likes: Array.isArray(form?.likes) ? form.likes : [],
    avoid: Array.isArray(form?.avoid) ? form.avoid : [],
    allergies: Array.isArray(form?.allergies) ? form.allergies : [],
    gift_ideas: Array.isArray(form?.gift_ideas) ? form.gift_ideas : [],
    brands: Array.isArray(form?.brands) ? form.brands : [],
    sizes: (form?.sizes || {}) as Record<string, string>,
  }), [form]);

  // sauvegarde en DB
  const handleSave = useCallback(async () => {
    if (savingRef.current) return;
    try {
      savingRef.current = true;
      setSaving(true);
      await saveGlobalPreferences(buildPatch());
      toast.success('Préférences sauvegardées');
    } catch (e: any) {
      console.error('❌ onSave error (V2):', e);
      toast.error(`Erreur de sauvegarde: ${e?.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }, [buildPatch]);

  const handleCancel = useCallback(() => {
    onCancel();
    onBack();
  }, [onCancel, onBack]);

  const updateSize = useCallback((key: SizeKey, value: string) => {
    setForm((prev: any) => {
      const next = { ...(prev || {}) };
      next.sizes = { ...(next.sizes || {}), [key]: value };
      return next;
    });
  }, [setForm]);

  const addItem = async (section: SectionKey, value: string) => {
    const v = (value || '').trim();
    if (!v) return;
    setForm((prev: any) => {
      const next = { ...(prev || {}) };
      const arr = Array.isArray(next[section]) ? [...next[section]] : [];
      if (!arr.includes(v)) arr.push(v);
      next[section] = arr;
      return next;
    });
    setNewItems((prev) => ({ ...prev, [section]: '' }));
    await handleSave();
  };

  const removeItem = async (section: SectionKey, index: number) => {
    setForm((prev: any) => {
      const next = { ...(prev || {}) };
      const arr = Array.isArray(next[section]) ? [...next[section]] : [];
      next[section] = arr.filter((_, i) => i !== index);
      return next;
    });
    await handleSave();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Préférences générales" onBack={onBack} />
        <div className="p-6">
          <p className="text-center text-muted-foreground">Chargement…</p>
        </div>
      </div>
    );
  }

  const PreferenceSection = ({
    title, section, placeholder, variant = 'secondary',
  }: {
    title: string;
    section: SectionKey;
    placeholder: string;
    variant?: 'secondary' | 'destructive' | 'outline';
  }) => {
    const items = Array.isArray((form as any)?.[section]) ? (form as any)[section] as string[] : [];
    const newValue = newItems[section] || '';

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">{title}</h4>
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {items.map((item, index) => (
            <Badge key={`${item}-${index}`} variant={variant} className="text-sm">
              {item}
              <button
                onClick={() => removeItem(section, index)}
                className="ml-2 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={newValue}
            onChange={(e) => setNewItems((prev) => ({ ...prev, [section]: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !(e as any).nativeEvent?.isComposing) {
                e.preventDefault();
                addItem(section, newValue);
              }
            }}
            className="flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => addItem(section, newValue)}
            disabled={!newValue.trim() || saving}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Préférences générales" onBack={handleCancel} />

      {/* Boutons sauvegarde */}
      <div className="p-6 border-b bg-background">
        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Enregistrement…' : 'Sauvegarder'}
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Préférences */}
        <Card>
          <CardHeader>
            <CardTitle>Mes goûts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <PreferenceSection title="J'aime" section="likes" placeholder="Ajouter un élément que j'aime" variant="secondary" />
            <PreferenceSection title="À éviter" section="avoid" placeholder="Ajouter un élément à éviter" variant="outline" />
            <PreferenceSection title="Allergies" section="allergies" placeholder="Ajouter une allergie" variant="destructive" />
            <PreferenceSection title="Idées cadeaux" section="gift_ideas" placeholder="Ajouter une idée cadeau" variant="secondary" />
            <PreferenceSection title="Marques préférées" section="brands" placeholder="Ajouter une marque" variant="secondary" />
          </CardContent>
        </Card>

        {/* Tailles */}
        <Card>
          <CardHeader>
            <CardTitle>Tailles et pointures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'top', label: 'Haut (XS, S, M, L…)' },
              { key: 'bottom', label: 'Bas (36, 38, 40…)' },
              { key: 'shoes', label: 'Pointure (39, 40, 41…)' },
              { key: 'ring', label: 'Bague (52, 54, 56…)' },
              { key: 'other', label: 'Autre (bonnets, gants…)' },
            ].map(({ key, label }) => (
              <div key={key} className="flex gap-2 items-center">
                <div className="w-48 text-sm text-muted-foreground">{label}</div>
                <Input
                  value={(form?.sizes as any)?.[key] || ''}
                  onChange={(e) => updateSize(key as SizeKey, e.target.value)}
                  onBlur={handleSave}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
