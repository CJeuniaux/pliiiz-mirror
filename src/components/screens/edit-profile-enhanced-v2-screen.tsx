import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommonHeader } from "@/components/ui/common-header";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save, X } from "lucide-react";

interface EditProfileEnhancedV2ScreenProps {
  onBack: () => void;
  onSave: () => void;
}

export function EditProfileEnhancedV2Screen({ onBack, onSave }: EditProfileEnhancedV2ScreenProps) {
  const { profile, updateProfile, refetch } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    birthday: '',
    city: '',
    country: '',
    bio: '',
    avatar_url: ''
  });

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        birthday: profile.birthday || '',
        city: (profile as any)?.city || '',
        country: (profile as any)?.country || '',
        bio: profile.city || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const uid = user.id;
      const ext = file.name.split('.').pop();
      const path = `${uid}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = data.publicUrl;

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      // Persist avatar URL immediately (commit action)
      await updateProfile({ avatar_url: publicUrl } as any);
      
      toast({
        title: "Avatar mis à jour",
        description: "Votre photo de profil a été mise à jour avec succès"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Update profile data using any to bypass type checking for new fields
      await updateProfile({
        first_name: formData.display_name.split(' ')[0] || formData.display_name,
        last_name: formData.display_name.split(' ').slice(1).join(' ') || '',
        birthday: formData.birthday || null,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        ...(formData.city && { city: formData.city }),
        ...(formData.country && { country: formData.country })
      } as any);

      await refetch();
      
      toast({
        title: "Profil mis à jour",
        description: "Vos modifications ont été sauvegardées"
      });
      
      onSave();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <CommonHeader 
        title="Éditer mon profil"
        onBack={onBack}
      />
      
      <div className="p-6 space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle>Photo de profil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage 
                  src={formData.avatar_url || "/placeholder.svg"} 
                  className="object-cover" 
                />
                <AvatarFallback className="text-lg">
                  {(formData.display_name || 'U').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 bg-primary rounded-full text-white shadow-lg hover:bg-primary/90 transition-colors"
                disabled={isLoading}
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground text-center">
              Cliquez sur l'icône pour changer votre photo
            </p>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="display_name">Nom affiché</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Votre nom affiché"
              />
            </div>

            <div>
              <Label htmlFor="birthday">Date de naissance</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Votre ville"
                />
              </div>
              <div>
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Votre pays"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Parlez-nous de vous..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1"
            variant="default"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}