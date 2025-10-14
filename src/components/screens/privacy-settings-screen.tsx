import React, { useState } from "react";
import { useUniversalBack } from "@/hooks/use-universal-back";
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
  const universalBack = useUniversalBack();
  const handleBack = onBack || universalBack;
  
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
    <div className="plz-app">
      <div className="plz-bg" aria-hidden="true" />
      <div className="plz-container">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBack}
            className="plz-iconbtn flex-shrink-0"
            aria-label="Retour"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="plz-page-title p-0 flex-1">Confidentialité & Export</h1>
        </div>
        
        <div className="space-y-4">
          <div className="plz-card">
            <h2 className="text-lg font-semibold text-white mb-4">
              Visibilité du profil
            </h2>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="publicPreview" className="text-white">Aperçu public</Label>
                <p className="text-sm text-white/70">
                  Permettre aux autres de voir un aperçu de votre profil
                </p>
              </div>
              <Switch
                id="publicPreview"
                checked={settings.publicPreview}
                onCheckedChange={(checked) => updateSetting('publicPreview', checked)}
              />
            </div>
          </div>

          <Button 
            className="w-full btn-orange"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </Button>
        </div>
      </div>
    </div>
  );
}