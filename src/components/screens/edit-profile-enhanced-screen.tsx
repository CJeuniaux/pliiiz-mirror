import React, { useState, useRef } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, User, Save, ArrowLeft } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';
import { toast } from 'sonner';
interface EditProfileEnhancedScreenProps {
  onBack: () => void;
  onSave?: () => void;
}
export function EditProfileEnhancedScreen({
  onBack,
  onSave
}: EditProfileEnhancedScreenProps) {
  const {
    profile,
    updateProfile,
    loading
  } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    bio: '' // This would come from profile if we had it in the schema
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }
    setUploading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // In a real app, you would upload to Supabase storage here
      // For now, just simulate upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Photo uploadée avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'upload de l\'image');
      setAvatarPreview(null);
    } finally {
      setUploading(false);
    }
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name
      });

      // In a real app, you would also save the bio and avatar
      toast.success('Profil mis à jour avec succès');
      onSave?.();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };
  const getInitials = () => {
    const firstName = formData.first_name || profile?.first_name || '';
    const lastName = formData.last_name || profile?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  if (loading) {
    return <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Modifier mon profil" onBack={onBack} />
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Modifier mon profil" onBack={onBack} />
      
      <div className="p-6 space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg rounded-full">
                  <AvatarImage src={avatarPreview || undefined} alt="Photo de profil" />
                  <AvatarFallback className="text-xl font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button size="icon" variant="default" className="absolute -bottom-2 -right-2 rounded-full h-8 w-8" onClick={handleAvatarClick} disabled={uploading}>
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-center">
                <h3 className="font-medium text-foreground">Photo de profil</h3>
                <p className="text-sm text-muted-foreground">
                  {uploading ? 'Upload en cours...' : 'Cliquez pour modifier'}
                </p>
              </div>
            </div>
            
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Informations générales</h3>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="firstName" className="font-medium text-foreground">
                Prénom *
              </Label>
              <Input id="firstName" type="text" value={formData.first_name} onChange={e => handleInputChange('first_name', e.target.value)} placeholder="Votre prénom" className="h-12" />
            </div>

            <div className="space-y-3">
              <Label htmlFor="lastName" className="font-medium text-foreground">
                Nom
              </Label>
              <Input id="lastName" type="text" value={formData.last_name} onChange={e => handleInputChange('last_name', e.target.value)} placeholder="Votre nom" className="h-12" />
            </div>

            <div className="space-y-3">
              <Label htmlFor="bio" className="font-medium text-foreground">
                Bio (optionnel)
              </Label>
              <Textarea id="bio" value={formData.bio} onChange={e => handleInputChange('bio', e.target.value)} placeholder="Quelques mots sur vous..." rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button variant="gradient" className="w-full" onClick={handleSave} disabled={saving || uploading || !formData.first_name.trim()}>
          {saving ? <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Sauvegarde...
            </> : <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les modifications
            </>}
        </Button>
      </div>
    </div>;
}