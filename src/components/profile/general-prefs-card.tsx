import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit2, Save, X, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface GeneralPrefsCardProps {
  userId: string;
}

export function GeneralPrefsCard({ userId }: GeneralPrefsCardProps) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newItems, setNewItems] = useState({
    likes: '',
    avoid: '',
    gift_ideas: ''
  });

  // Charger les préférences
  const loadPrefs = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      const [prefsRes, profileRes] = await Promise.all([
        supabase.from('preferences').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('profiles').select('global_preferences').eq('user_id', userId).maybeSingle()
      ]);

      const combinedPrefs = {
        likes: prefsRes.data?.likes || [],
        avoid: prefsRes.data?.dislikes || [],
        gift_ideas: prefsRes.data?.gift_ideas || [],
        sizes: prefsRes.data?.sizes || {},
        updated_at: prefsRes.data?.updated_at
      };

      setPrefs(combinedPrefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    loadPrefs();
  }, [userId]);

  // Hydrater le formulaire quand les prefs changent
  useEffect(() => {
    if (prefs) {
      setForm(structuredClone(prefs));
    }
  }, [prefs?.updated_at]);

  // Fonction pour détecter les différences
  const isEqual = (a: any, b: any): boolean => {
    return JSON.stringify(a) === JSON.stringify(b);
  };

  const onCancel = () => {
    if (prefs) {
      setForm(structuredClone(prefs));
    }
    setEditing(false);
    setNewItems({ likes: '', avoid: '', gift_ideas: '' });
  };

  const onSave = async () => {
    if (!user || !form || !prefs) return;

    try {
      const patch: any = {};
      
      if (!isEqual(form.likes, prefs.likes)) patch.likes = form.likes;
      if (!isEqual(form.avoid, prefs.avoid)) patch.avoid = form.avoid;
      if (!isEqual(form.gift_ideas, prefs.gift_ideas)) patch.gift_ideas = form.gift_ideas;
      if (!isEqual(form.sizes, prefs.sizes)) patch.sizes = form.sizes;

      if (Object.keys(patch).length > 0) {
        // Validation des données avant envoi
        const { validateAndSanitizePatch } = await import('@/lib/preferences-validation');
        const validatedPatch = validateAndSanitizePatch(patch);
        
        console.log('[GeneralPrefs] Sending patch to RPC:', validatedPatch);
        
        // 1) Ensure profile exists before patching
        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert({ user_id: userId }, { onConflict: 'user_id' });
        if (upsertErr) {
          console.error('[GeneralPrefs] Upsert error:', upsertErr);
          toast.error(`Erreur de sauvegarde: ${upsertErr.message || 'Problème de base de données'}`);
          return;
        }

        // 2) Apply deep patch via RPC
        const { error } = await supabase.rpc('patch_preferences_deep_v1', {
          p_user_id: userId,
          p_patch: validatedPatch as any
        });

        if (error) {
          console.error('[GeneralPrefs] RPC Error details:', error);
          toast.error(`Erreur de sauvegarde: ${error.message || 'Problème de base de données'}`);
          return;
        }

        toast.success('Préférences enregistrées');
        await loadPrefs(); // Recharger les données
      }
      
      setEditing(false);
      setNewItems({ likes: '', avoid: '', gift_ideas: '' });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  // Fonction pour convertir en chips (texte uniquement)
  const toChips = (arr: any[]) => (Array.isArray(arr) ? arr : [])
    .map(x => typeof x === 'string' ? x : x?.label ?? x?.name ?? '')
    .filter(Boolean);

  // Ajouter un item
  const addItem = (section: string, value: string) => {
    if (!value.trim() || !form) return;

    const trimmedValue = value.trim();
    const currentList = Array.isArray(form[section]) ? form[section] : [];
    
    // Éviter les doublons
    if (currentList.includes(trimmedValue)) return;

    const newForm = { ...form };
    newForm[section] = [...currentList, trimmedValue];
    setForm(newForm);
    setNewItems(prev => ({ ...prev, [section]: '' }));
  };

  // Supprimer un item
  const removeItem = (section: string, index: number) => {
    if (!form) return;

    const newForm = { ...form };
    newForm[section] = newForm[section].filter((_: any, i: number) => i !== index);
    setForm(newForm);
  };

  // Mettre à jour les tailles
  const updateSize = (key: string, value: string) => {
    if (!form) return;

    const newForm = { ...form };
    newForm.sizes = { ...newForm.sizes, [key]: value };
    setForm(newForm);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  const ChipsBlock = ({ title, chips, variant = 'secondary' }: {
    title: string;
    chips: string[];
    variant?: 'secondary' | 'destructive' | 'outline';
  }) => (
    <div className="space-y-2">
      <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip, index) => (
            <Badge key={index} variant={variant} className="text-sm">
              {chip}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">Aucun élément ajouté</p>
      )}
    </div>
  );

  const TagInput = ({ label, section, placeholder, variant = 'secondary' }: {
    label: string;
    section: string;
    placeholder: string;
    variant?: 'secondary' | 'destructive' | 'outline';
  }) => {
    const items = Array.isArray(form?.[section]) ? form?.[section] : [];
    const newValue = newItems[section as keyof typeof newItems] || '';

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">{label}</h4>
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {items.map((item: string, index: number) => (
            <Badge key={index} variant={variant} className="text-sm">
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
            onChange={(e) => setNewItems(prev => ({ ...prev, [section]: e.target.value }))}
            onKeyDown={(e) => {
              // Ne pas valider pendant la composition (IME)
              if (e.key === 'Enter' && !(e as any).nativeEvent?.isComposing) {
                e.preventDefault();
                addItem(section, newValue);
              }
            }}
            onBlur={() => {
              if (newValue.trim()) addItem(section, newValue);
            }}
            className="flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => addItem(section, newValue)}
            disabled={!newValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const SizesBlock = ({ sizes }: { sizes: any }) => {
    const sizeLabels: string[] = [];
    if (sizes?.top) sizeLabels.push(`Haut: ${sizes.top}`);
    if (sizes?.bottom) sizeLabels.push(`Bas: ${sizes.bottom}`);
    if (sizes?.shoes) sizeLabels.push(`Pointure: ${sizes.shoes}`);
    if (sizes?.ring) sizeLabels.push(`Bague: ${sizes.ring}`);
    if (sizes?.other) sizeLabels.push(`Autre: ${sizes.other}`);

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-muted-foreground">Tailles et pointures</h4>
        {sizeLabels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sizeLabels.map((label, index) => (
              <span key={index} className="chip chip-size">
                {label}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Aucune taille renseignée</p>
        )}
      </div>
    );
  };

  const SizesForm = ({ sizes }: { sizes: any }) => (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground">Tailles et pointures</h4>
      <div className="grid grid-cols-1 gap-3">
        {[
          { key: 'top', label: 'Haut (XS, S, M, L...)' },
          { key: 'bottom', label: 'Bas (36, 38, 40...)' },
          { key: 'shoes', label: 'Pointure (39, 40, 41...)' },
          { key: 'ring', label: 'Bague (52, 54, 56...)' },
          { key: 'other', label: 'Autre (bonnets, gants...)' }
        ].map(({ key, label }) => (
          <Input
            key={key}
            placeholder={label}
            value={sizes?.[key] || ''}
            onChange={(e) => updateSize(key, e.target.value)}
          />
        ))}
      </div>
    </div>
  );

  // Fonction pour convertir en libellés lisibles
  const toLabels = (arr: any[]) => (Array.isArray(arr) ? arr : [])
    .map(x => typeof x === 'string' ? x : (x?.label ?? x?.name ?? ''))
    .filter(Boolean);

  return (
    <ErrorBoundary>
      <section id="prefs-general" className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <h3 className="text-xl font-semibold">Mes préférences générales</h3>
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed max-w-none">
          Tes incontournables, ceux qui ne changent jamais : ce que tu adores, tes allergies, tes idées cadeaux à garder en tête, tes tailles, tes pointures…
        </p>

        {!editing ? (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="whitespace-nowrap inline-flex items-center gap-2 px-3 py-1.5 text-sm"
            >
              <Edit2 className="h-4 w-4" />
              Modifier
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancel} 
              className="flex-1 whitespace-nowrap px-3 py-1.5 text-sm"
            >
              Annuler
            </Button>
            <Button 
              size="sm" 
              onClick={onSave} 
              className="flex-1 whitespace-nowrap px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0"
            >
              Sauvegarder
            </Button>
          </div>
        )}

        <Card className="p-4 md:p-5 rounded-2xl shadow-sm">
          <CardContent className="p-0">
            {!editing ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">J'aime</h4>
                  {toLabels(form?.likes).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {toLabels(form?.likes).map((label, index) => (
                        <span key={index} className="chip chip-like">
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucun élément ajouté</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">À éviter</h4>
                  {toLabels(form?.avoid).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {toLabels(form?.avoid).map((label, index) => (
                        <span key={index} className="chip chip-avoid">
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucun élément ajouté</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Idées cadeaux</h4>
                  {toLabels(form?.gift_ideas).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {toLabels(form?.gift_ideas).map((label, index) => (
                        <span key={index} className="chip chip-idea">
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucun élément ajouté</p>
                  )}
                </div>
                
                <SizesBlock sizes={form?.sizes} />
              </div>
            ) : (
              <div className="space-y-6">
                <TagInput 
                  label="J'aime" 
                  section="likes" 
                  placeholder="Ajouter quelque chose que j'aime"
                  variant="secondary"
                />
                <TagInput 
                  label="À éviter" 
                  section="avoid" 
                  placeholder="Ajouter quelque chose à éviter"
                  variant="outline"
                />
                <TagInput 
                  label="Idées cadeaux" 
                  section="gift_ideas" 
                  placeholder="Ajouter une idée cadeau"
                  variant="secondary"
                />
                <SizesForm sizes={form?.sizes} />
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </ErrorBoundary>
  );
}