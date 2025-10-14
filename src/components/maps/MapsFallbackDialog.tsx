import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { buildMapsLinks } from "@/lib/maps-launcher";
import { Copy, ExternalLink, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  target: { query?: string; lat?: number; lng?: number };
  title?: string; // ex. "Trouver un fleuriste"
};

export function MapsFallbackDialog({ open, onClose, target, title = "Ouvrir la carte" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const links = buildMapsLinks(target);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(links.googleAlt);
      // Simple feedback without external toast
      const btn = document.activeElement as HTMLButtonElement;
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = "Copié !";
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1500);
      }
    } catch { 
      console.warn("Failed to copy to clipboard");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog 
      ref={ref} 
      className="rounded-2xl p-0 w-[min(92vw,480px)] backdrop:bg-black/30 bg-background border shadow-lg"
      onClick={handleBackdropClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Carte intégrée */}
        <div className="rounded-xl overflow-hidden border mb-4">
          <iframe
            src={links.embed}
            title="Google Maps"
            className="w-full h-64"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button asChild variant="default">
            <a href={links.googleAlt} target="_blank" rel="noopener">
              <ExternalLink className="h-4 w-4 mr-2" />
              Google Maps
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={links.osm} target="_blank" rel="noopener">
              <ExternalLink className="h-4 w-4 mr-2" />
              OpenStreetMap
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={links.appleMaps} target="_blank" rel="noopener">
              <ExternalLink className="h-4 w-4 mr-2" />
              Apple Plans
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={links.waze} target="_blank" rel="noopener">
              <ExternalLink className="h-4 w-4 mr-2" />
              Waze
            </a>
          </Button>
        </div>

        <Button variant="outline" className="w-full mb-4" onClick={copy}>
          <Copy className="h-4 w-4 mr-2" />
          Copier le lien
        </Button>

        <div className="text-right">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </dialog>
  );
}