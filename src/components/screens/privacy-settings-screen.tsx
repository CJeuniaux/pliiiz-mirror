import React, { useState } from "react";
import { IntegratedHeader } from "@/components/ui/integrated-header";
import { ScreenFixedBG } from "@/components/layout/screen-fixed-bg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Eye, Bell, Trash2, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface PrivacySettingsScreenProps {
  onBack: () => void;
}

export function PrivacySettingsScreen({ onBack }: PrivacySettingsScreenProps) {
  const [settings, setSettings] = useState({
    publicPreview: true,
    allowNotifications: true,
    showInSearch: false,
    dataSharing: false,
    regiftVisible: true
  });
  const [saving, setSaving] = useState(false);

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Paramètres enregistrés avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    const data = {
      profile: "données de profil",
      preferences: "préférences utilisateur",
      contacts: "liste de contacts",
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mes-donnees-pliiiz.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="contacts-hero">
      <ScreenFixedBG isAuth={true} topGap={24} padH={16} padB={90}>
        <IntegratedHeader />
        
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 rounded-full bg-[#F2F4F7] hover:bg-[#E5E7EB] p-0"
          >
            <ArrowLeft size={18} className="text-[#374151]" />
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold text-[#2F4B4E] mb-6">Contrôlez vos données et votre visibilité</h1>
        
        <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[#2F4B4E]">
              Visibilité du profil
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="publicPreview">Aperçu public</Label>
                <p className="text-sm text-muted-foreground">
                  Permettre aux autres de voir un aperçu de votre profil
                </p>
              </div>
              <Switch
                id="publicPreview"
                checked={settings.publicPreview}
                onCheckedChange={(checked) => updateSetting('publicPreview', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Export */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-[#2F4B4E]">
              Export des données
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Téléchargez vos données personnelles au format JSON
            </p>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // TODO: Implement export functionality
                  toast.success("Export du profil en cours...");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter mon profil
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // TODO: Implement export functionality
                  toast.success("Export des contacts en cours...");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter mes contacts
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // TODO: Implement export functionality
                  toast.success("Export complet en cours...");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter toutes mes données
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button 
          className="w-full bg-primary hover:bg-primary/90"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </Button>
        </div>
      </ScreenFixedBG>
    </div>
  );
}