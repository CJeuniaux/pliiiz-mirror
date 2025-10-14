import React, { useState, useEffect, useRef } from "react";
import { useUniversalBack } from "@/hooks/use-universal-back";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Camera, Loader2, AlertCircle, Recycle } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useAvatar } from "@/hooks/use-avatar";
import { toast } from "sonner";
import { calculateAge, validateAge } from "@/utils/age";
import { validateDisplayName, validateCity, createDiffPayload } from "@/utils/form-validation";
import { ScreenFixedBG } from "@/components/layout/screen-fixed-bg";

interface EditProfileEnhancedFinalProps {
  onBack: () => void;
}

interface FormData {
  first_name: string;
  last_name: string;
  display_name: string;
  birthday: string;
  city: string;
  country: string;
  regift_enabled: boolean;
  regift_note: string;
}

interface FormErrors {
  [key: string]: string;
}

export function EditProfileEnhancedFinal({ onBack }: EditProfileEnhancedFinalProps) {
  const universalBack = useUniversalBack();
  const handleBack = onBack || universalBack;
  
  const { profile, updateProfile, loading, refetch } = useProfile();
  const { user } = useAuth();
  const { uploadAvatar, uploading } = useAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    display_name: '',
    birthday: '',
    city: '',
    country: '',
    regift_enabled: false,
    regift_note: ''
  });
  
  const [originalData, setOriginalData] = useState<FormData>({} as FormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Preload data when profile is available
  useEffect(() => {
    if (profile) {
      const data = {
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        display_name: profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        birthday: profile.birthday || '',
        city: profile.city || '',
        country: profile.country || '',
        regift_enabled: profile.regift_enabled || false,
        regift_note: profile.regift_note || ''
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [profile]);
  
  // Check for changes
  useEffect(() => {
    const hasAnyChanges = Object.keys(formData).some(
      key => formData[key as keyof FormData] !== originalData[key as keyof FormData]
    );
    setHasChanges(hasAnyChanges);
  }, [formData, originalData]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate display name (required)
    const displayNameValidation = validateDisplayName(formData.display_name);
    if (!displayNameValidation.isValid) {
      newErrors.display_name = displayNameValidation.message!;
    }
    
    // Validate city (optional)
    const cityValidation = validateCity(formData.city);
    if (!cityValidation.isValid) {
      newErrors.city = cityValidation.message!;
    }
    
    // Validate birthday (optional)
    if (formData.birthday) {
      const ageValidation = validateAge(formData.birthday);
      if (!ageValidation.isValid) {
        newErrors.birthday = ageValidation.message!;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }
    
    setIsSaving(true);
    try {
      // Create diff payload with only changed fields
      const diffPayload = createDiffPayload(originalData, formData);
      
      if (Object.keys(diffPayload).length === 0) {
        toast.info('Aucune modification à enregistrer');
        return;
      }

      await updateProfile(diffPayload);
      setOriginalData(formData);
      setHasChanges(false);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('Voulez-vous abandonner vos modifications ?')) {
        setFormData(originalData);
        setErrors({});
        handleBack();
      }
    } else {
      handleBack();
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const result = await uploadAvatar(file);
      if (result && !result.error) {
        // Force un refetch du profil pour afficher le nouvel avatar
        await refetch();
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getInitials = () => {
    const first = formData.first_name?.charAt(0) || '';
    const last = formData.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getAge = () => {
    return formData.birthday ? calculateAge(formData.birthday) : null;
  };

  if (loading) {
    return (
      <ScreenFixedBG isAuth={true} topGap={0} padH={0} padB={24}>
        <PageHeader title="Éditer le profil" onBack={onBack} />
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Chargement...</span>
        </div>
      </ScreenFixedBG>
    );
  }

  return (
    <ScreenFixedBG isAuth={true} topGap={0} padH={0} padB={24}>
      <div className="plz-appbar px-[var(--plz-outer-margin)]">
        <button onClick={handleCancel} className="plz-iconbtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="plz-page-title">Éditer le profil</h1>
      </div>
      
      <div className="px-[var(--plz-outer-margin)] space-y-4 overflow-y-auto pb-24">
        {/* Avatar Section */}
        <Card className="pliiz-card edit-profile-card">
          <CardContent className="text-center space-y-4">
            <div className="relative inline-block">
              <Avatar className="h-24 w-24 mx-auto border-4 border-white shadow-lg rounded-full">
                <AvatarImage 
                  src={profile?.avatar_url || undefined} 
                  alt={formData.display_name || 'Avatar'} 
                />
                <AvatarFallback className="text-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                disabled={uploading}
                className="btn-icon-orange absolute -bottom-2 -right-2 w-10 h-10 shadow-lg"
                aria-label="Changer la photo de profil"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  <Camera className="h-4 w-4 mx-auto" />
                )}
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Cliquez sur l'icône pour changer votre photo
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="pliiz-card">
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Informations personnelles</h3>
            
            {/* First Name */}
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

            {/* Last Name */}
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

            {/* Birthday */}
            <div className="space-y-2">
              <Label htmlFor="birthday">
                Date de naissance
                {getAge() && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({getAge()} ans)
                  </span>
                )}
              </Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => handleInputChange('birthday', e.target.value)}
                disabled={isSaving}
                className={errors.birthday ? 'border-red-500' : ''}
              />
              {errors.birthday && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.birthday}
                </div>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Votre ville"
                disabled={isSaving}
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.city}
                </div>
              )}
            </div>

            {/* Country */}
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

        {/* Regift Preferences */}
        <Card className="pliiz-card">
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg mb-4 text-white">Préférences de regift</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Recycle className="h-5 w-5 text-white" />
                <div>
                  <Label className="text-white font-medium">Cadeaux de seconde main</Label>
                  <p className="text-sm text-white/80">J'apprécie recevoir des cadeaux de seconde main</p>
                </div>
              </div>
              <Switch 
                checked={formData.regift_enabled} 
                onCheckedChange={(checked) => handleInputChange('regift_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button 
            className="btn-orange flex-1 hover:opacity-90"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sauvegarde...
              </>
            ) : (
              'Sauvegarder'
            )}
          </Button>
        </div>
      </div>
    </ScreenFixedBG>
  );
}