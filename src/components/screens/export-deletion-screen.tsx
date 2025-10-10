import React, { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Trash2, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";

interface ExportDeletionScreenProps {
  onBack: () => void;
  onContactSupport: () => void;
}

export function ExportDeletionScreen({ onBack, onContactSupport }: ExportDeletionScreenProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    
    // Simulate data export
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const data = {
      profile: {
        name: "Camille L.",
        city: "Paris",
        acceptsRegift: true
      },
      preferences: {
        likes: ["Café de spécialité", "Papeterie premium", "Plantes faciles"],
        dislikes: ["Parfums forts", "Gadgets encombrants"],
        allergies: ["Arachides"],
        sizes: { top: "S", bottom: "36", shoes: "38" }
      },
      contacts: ["Thomas L.", "Alex M.", "Zoé D."],
      sharedLinks: ["https://app.pliiiz.com/p/abc123"],
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mes-donnees-pliiiz-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setIsExporting(false);
    toast.success("Données exportées avec succès !");
  };

  const handleDeleteAccount = async () => {
    const confirmMessage = "Êtes-vous absolument sûr de vouloir supprimer votre compte ?\n\nCette action supprimera définitivement :\n- Votre profil et préférences\n- Tous vos liens partagés\n- Votre historique de contacts\n- Toutes vos données\n\nCette action est IRRÉVERSIBLE.";
    
    if (!confirm(confirmMessage)) return;
    
    const finalConfirm = confirm("Dernière confirmation : tapez 'SUPPRIMER' pour confirmer");
    if (!finalConfirm) return;
    
    setIsDeleting(true);
    
    // Simulate account deletion process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Clear all local data
    localStorage.clear();
    
    toast.success("Compte supprimé. Redirection vers l'accueil...");
    
    // Redirect to home after a delay
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Exporter & Supprimer" 
        subtitle="Gérez vos données personnelles"
        onBack={onBack}
      />
      
      <div className="p-4 space-y-6 overflow-y-auto pb-20">
        {/* Export Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              Exporter mes données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Téléchargez une copie complète de toutes vos données PLIIIZ au format JSON.
            </p>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Données incluses :</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Profil personnel (nom, ville, préférences Regift)</li>
                <li>• Préférences (J'aime, À éviter, Allergies, Tailles)</li>
                <li>• Liste de contacts et autorisations</li>
                <li>• Liens partagés actifs et historique</li>
                <li>• Historique des demandes d'accès</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isExporting ? (
                "Export en cours..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger mes données
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Delete Account */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Supprimer mon compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-destructive">
                  Action irréversible
                </p>
                <p className="text-xs text-destructive/80 mt-1">
                  La suppression de votre compte entraînera la perte définitive de toutes vos données.
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Conséquences de la suppression :</h4>
              <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                <li>• Suppression définitive de votre profil et préférences</li>
                <li>• Révocation immédiate de tous vos liens partagés</li>
                <li>• Perte de l'accès aux profils de vos contacts</li>
                <li>• Suppression de votre historique de demandes</li>
                <li>• Aucune possibilité de récupération</li>
              </ul>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Recommandation</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Nous vous recommandons d'exporter vos données avant de supprimer votre compte.
              </p>
            </div>
            
            <Button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              variant="destructive"
              className="w-full"
            >
              {isDeleting ? (
                "Suppression en cours..."
              ) : (
                <>
              <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer mon compte
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Help */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">💡 Besoin d'aide ?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Si vous rencontrez des problèmes ou avez des questions sur la gestion de vos données :
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onContactSupport}
            >
              Contacter le support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}