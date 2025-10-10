import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { LogOut } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";

interface EditProfileScreenProps {
  onBack: () => void;
}

export function EditProfileScreen({ onBack }: EditProfileScreenProps) {
  const { profile, updateProfile, loading, refetch: fetchProfile } = useProfile();
  const { signOut } = useAuth();
  
  // État du formulaire - Doit précharger toutes les infos selon brief §4.1
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birthday: '',
    city: '',
    country: '',
    regift_enabled: false,
    regift_note: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Précharger les données selon brief §4.1
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        birthday: profile.birthday || '',
        city: profile.city || '',
        country: profile.country || '',
        regift_enabled: profile.regift_enabled || false,
        regift_note: profile.regift_note || ''
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Bouton Sauvegarder = mauve selon brief §4.1
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateProfile(formData);
      if (!result.error) {
        setHasChanges(false);
        // Refetch to ensure data is in sync
        await fetchProfile();
      }
      // Toast succès déjà dans le hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('Voulez-vous abandonner vos modifications ?')) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  const handleLogout = async () => {
    if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      await signOut();
    }
  };

  const getInitials = () => {
    const first = formData.first_name?.charAt(0) || '';
    const last = formData.last_name?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Éditer le profil" onBack={onBack} />
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Éditer le profil" 
        onBack={onBack}
      />
      
      <div className="p-4 space-y-6 overflow-y-auto pb-20">
        {/* Photo de profil */}
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <AvatarUpload
              avatarUrl={profile?.avatar_url || undefined}
              displayName={`${formData.first_name} ${formData.last_name}`.trim() || 'Utilisateur'}
              size="lg"
              editable
            />
            <p className="text-sm text-muted-foreground">
              Appuyez pour changer votre photo
            </p>
          </CardContent>
        </Card>

        {/* Informations personnelles */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* H3 "Mes préférences" sur la ligne au-dessus selon brief §4.1 */}
            <h3 className="font-semibold text-lg mb-4">Informations personnelles</h3>
            
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Votre prénom"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Votre nom"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">Date de naissance</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => handleInputChange('birthday', e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Votre ville"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Votre pays"
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>



        {/* Boutons Sauvegarder/Annuler selon brief §4.1 */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button 
            className="flex-1 bg-[hsl(var(--pliiz-primary))] hover:bg-[hsl(var(--btn-mauve-hover))] text-white"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>
    </div>
  );
}