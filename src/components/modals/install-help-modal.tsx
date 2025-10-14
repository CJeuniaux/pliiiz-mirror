import { AppModal } from "@/components/ui/app-modal";
import { Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface InstallHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function InstallHelpModal({ open, onClose }: InstallHelpModalProps) {
  const [activeTab, setActiveTab] = useState<"android" | "ios">("android");

  useEffect(() => {
    if (open) {
      // Log modal opened event
      console.log('[InstallHelp] install_help_opened');
      localStorage.setItem('installHelpOpened', 'true');
    }
  }, [open]);

  const handleClose = () => {
    console.log('[InstallHelp] install_help_closed');
    onClose();
  };

  const handleTabClick = (tab: "android" | "ios") => {
    setActiveTab(tab);
    console.log('[InstallHelp] install_help_tab_clicked:', tab);
  };

  return (
    <AppModal 
      open={open} 
      onClose={handleClose}
      title="Installer Pliiiz sur votre écran d'accueil"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-white/90 text-center">
          2 minutes pour une vraie app, sans Store.
        </p>

        <div className="flex gap-0 p-0.5 tabs-white rounded-full mb-6">
          <button
            onClick={() => handleTabClick('android')}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-full font-semibold text-sm transition-all",
              activeTab === "android" ? "tab-mauve" : "text-[#5b3bb8] bg-transparent"
            )}
          >
            Android
          </button>
          <button
            onClick={() => handleTabClick('ios')}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-full font-semibold text-sm transition-all",
              activeTab === "ios" ? "tab-mauve" : "text-[#5b3bb8] bg-transparent"
            )}
          >
            iPhone / iOS
          </button>
        </div>

        {activeTab === "android" && (
          <div className="space-y-3 text-left">
            <div className="space-y-2">
              <p className="font-semibold text-white text-sm">Chrome ou Edge :</p>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-white/90 pl-2">
                <li>Ouvrez Pliiiz dans Chrome (ou Edge).</li>
                <li>Appuyez sur le menu <strong>⋮</strong> (en haut à droite).</li>
                <li>Choisissez <strong>"Ajouter à l'écran d'accueil"</strong> ou <strong>"Installer l'application"</strong>.</li>
                <li>Confirmez <strong>Ajouter/Installer</strong> puis <strong>Ouvrir</strong>.</li>
              </ol>
            </div>
            
            <div className="p-3 bg-white/10 rounded-lg border border-white/20">
              <p className="text-xs text-white/80">
                <strong>💡 Astuce :</strong> sous Firefox, cherchez "Ajouter à l'écran d'accueil" dans le menu.
              </p>
            </div>
          </div>
        )}

        {activeTab === "ios" && (
          <div className="space-y-3 text-left">
            <div className="space-y-2">
              <p className="font-semibold text-white text-sm">Safari uniquement :</p>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-white/90 pl-2">
                <li>Ouvrez Pliiiz dans <strong>Safari</strong> (pas Chrome).</li>
                <li>Touchez l'icône <strong>Partager</strong> (carré + flèche).</li>
                <li>Sélectionnez <strong>"Sur l'écran d'accueil"</strong>.</li>
                <li>Renommez si besoin puis touchez <strong>Ajouter</strong>.</li>
              </ol>
            </div>

            <div className="p-3 rounded-lg border border-white/20" style={{ background: 'linear-gradient(135deg, #ff7cab, #ff9c6b)' }}>
              <p className="text-xs text-white/80">
                <strong>⚠️ Important :</strong> Cette fonctionnalité n'est disponible que sur Safari, pas sur Chrome iOS.
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 space-y-3 border-t border-white/20">
          <div className="text-center">
            <a 
              href="mailto:support@pliiiz.app" 
              className="text-xs text-white/70 hover:text-white transition-colors underline"
            >
              Besoin d'aide ?
            </a>
          </div>

          <button 
            onClick={handleClose}
            className="btn-orange w-full"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </AppModal>
  );
}
