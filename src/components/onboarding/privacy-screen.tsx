import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { PageHeader } from "@/components/ui/page-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Share } from "lucide-react";
import gHome from "@/assets/g-home.webp";

interface PrivacySettings {
  showPublicPreview: boolean;
  previewBudgets: boolean;
  previewSafeBets: boolean;
  maxPreviewItems: number;
}

interface PrivacyScreenProps {
  onNext: (settings: PrivacySettings) => void;
  onBack: () => void;
  safeBets: string[];
  budgetRanges: string[];
}

export function PrivacyScreen({ onNext, onBack, safeBets, budgetRanges }: PrivacyScreenProps) {
  const [showPublicPreview, setShowPublicPreview] = useState(true);
  const [previewBudgets, setPreviewBudgets] = useState(true);
  const [previewSafeBets, setPreviewSafeBets] = useState(true);

  const handleSubmit = () => {
    onNext({
      showPublicPreview,
      previewBudgets: showPublicPreview && previewBudgets,
      previewSafeBets: showPublicPreview && previewSafeBets,
      maxPreviewItems: 3
    });
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat text-white" style={{ backgroundImage: `url(${gHome})` }}>
      <PageHeader 
        title="Confidentialité" 
        subtitle="Étape 4/4"
        onBack={onBack}
      />
      
      <div className="px-[var(--plz-outer-margin)] space-y-6 pb-24">
        <SectionCard
          title="Aperçu public"
          description="Ce que voient les invités avant de demander l'accès"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="publicPreview"
                checked={showPublicPreview}
                onCheckedChange={(checked) => setShowPublicPreview(checked === true)}
              />
              <label htmlFor="publicPreview" className="text-sm cursor-pointer flex-1">
                Afficher un aperçu public minimal
              </label>
            </div>

            {showPublicPreview && (
              <div className="ml-6 space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="previewBudgets"
                    checked={previewBudgets}
                    onCheckedChange={(checked) => setPreviewBudgets(checked === true)}
                  />
                  <label htmlFor="previewBudgets" className="text-sm cursor-pointer">
                    Gammes de budget confortables
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="previewSafeBets"
                    checked={previewSafeBets}
                    onCheckedChange={(checked) => setPreviewSafeBets(checked === true)}
                  />
                  <label htmlFor="previewSafeBets" className="text-sm cursor-pointer">
                    2-3 valeurs sûres
                  </label>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Preview simulation */}
        <SectionCard 
          title="Aperçu de votre profil public"
          description="Voici ce que verront vos invités"
        >
          <div className="border-2 border-dashed rounded-lg p-4 bg-muted/20">
            {showPublicPreview ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Aperçu public</span>
                </div>

                {previewBudgets && budgetRanges.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Budget confortable</p>
                    <div className="flex flex-wrap gap-1">
                      {budgetRanges.slice(0, 2).map((budget) => (
                        <Badge key={budget} variant="outline" className="text-xs">
                          {budget}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {previewSafeBets && safeBets.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Valeurs sûres</p>
                    <div className="flex flex-wrap gap-1">
                      {safeBets.slice(0, 3).map((bet) => (
                        <Badge key={bet} variant="secondary" className="text-xs">
                          {bet}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t">
                  <Button variant="default" size="sm" className="w-full">
                    <Share className="h-4 w-4 mr-2" />
                    Demander l'accès complet
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <EyeOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Profil entièrement privé</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les invités devront demander l'accès sans aperçu
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        <div className="bg-info/10 border border-info/20 rounded-lg p-3">
          <p className="text-xs text-info-foreground">
            <strong>Important :</strong> Vos données sensibles (tailles, allergies, adresses) 
            ne sont jamais visibles dans l'aperçu public. Elles nécessitent toujours 
            une demande d'accès approuvée.
          </p>
        </div>

        <Button 
          onClick={handleSubmit}
          className="w-full"
        >
          Finaliser mon profil PLIIIZ
        </Button>
      </div>
    </div>
  );
}