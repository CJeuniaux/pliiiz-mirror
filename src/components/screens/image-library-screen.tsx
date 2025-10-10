import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Upload, Search, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImageLibraryItem {
  id: string;
  label: string;
  category_id?: string;
  attrs?: any; // Using any to match Supabase Json type
  image_url: string;
  source: string;
  license?: string;
  created_at: string;
  updated_at: string;
}

interface ImageLibraryScreenProps {
  onBack: () => void;
}

export function ImageLibraryScreen({ onBack }: ImageLibraryScreenProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<ImageLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    label: '',
    category_id: '',
    attrs: '{}',
    image_url: '',
    license: 'royalty-free'
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('image_library')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading image library:', error);
      toast.error('Erreur lors du chargement de la bibliothèque');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast.error('Vous devez être connecté pour uploader des images');
      return;
    }

    try {
      setUploading(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('library')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('library')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploadée avec succès');
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    if (!formData.label || !formData.image_url) {
      toast.error('Label et URL d\'image requis');
      return;
    }

    try {
      // Parse JSON attrs
      let attrs = {};
      if (formData.attrs.trim()) {
        try {
          attrs = JSON.parse(formData.attrs);
        } catch {
          toast.error('Format JSON invalide pour les attributs');
          return;
        }
      }

      const { error } = await supabase
        .from('image_library')
        .insert({
          label: formData.label,
          category_id: formData.category_id || null,
          attrs: Object.keys(attrs).length > 0 ? attrs : null,
          image_url: formData.image_url,
          source: 'upload',
          license: formData.license
        });

      if (error) throw error;

      toast.success('Image ajoutée à la bibliothèque');
      setFormData({
        label: '',
        category_id: '',
        attrs: '{}',
        image_url: '',
        license: 'royalty-free'
      });
      setShowAddForm(false);
      loadItems();
      
    } catch (error) {
      console.error('Error adding image:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiée');
  };

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category_id && item.category_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">Authentification requise</h2>
            <p className="text-muted-foreground">
              Vous devez être connecté pour accéder à la bibliothèque d'images.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={onBack}>
            ← Retour
          </Button>
          <h1 className="text-lg font-semibold">Bibliothèque d'images</h1>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par label ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Ajouter une image</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="label">Label *</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="ex: thé vert en vrac"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Input
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    placeholder="ex: tea, chocolate, books"
                  />
                </div>

                <div>
                  <Label htmlFor="attrs">Attributs (JSON)</Label>
                  <Textarea
                    id="attrs"
                    value={formData.attrs}
                    onChange={(e) => setFormData(prev => ({ ...prev, attrs: e.target.value }))}
                    placeholder='{"type":"green","form":"loose-leaf"}'
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Image</Label>
                  <div className="space-y-2">
                    <Input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="URL directe ou uploadez un fichier"
                    />
                    
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {uploading ? 'Upload...' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="license">Licence</Label>
                  <Input
                    id="license"
                    value={formData.license}
                    onChange={(e) => setFormData(prev => ({ ...prev, license: e.target.value }))}
                    placeholder="royalty-free"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={uploading}>
                    Ajouter
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Items List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.image_url}
                      alt={item.label}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.png';
                      }}
                    />
                  </div>
                  
                  <h3 className="font-medium mb-2 truncate">{item.label}</h3>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.category_id && (
                      <Badge variant="secondary" className="text-xs">
                        {item.category_id}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {item.source}
                    </Badge>
                  </div>

                  {item.attrs && Object.keys(item.attrs).length > 0 && (
                    <div className="text-xs text-muted-foreground mb-3 truncate">
                      {JSON.stringify(item.attrs)}
                    </div>
                  )}

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyUrl(item.image_url)}
                      className="flex-1"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(item.image_url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'Aucun résultat trouvé' : 'Aucune image dans la bibliothèque'}
          </div>
        )}
      </div>
    </div>
  );
}