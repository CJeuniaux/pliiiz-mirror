import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { geocode, buildOsmEmbed } from "@/lib/osm";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Share, Copy } from "lucide-react";
import { toast } from "sonner";
import { EnhancedMapsButtons } from "@/components/maps/enhanced-maps-buttons";
import { MapsLauncher, type MapLocation } from "@/utils/maps-unified";

export default function Carte() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const q = searchParams.get("q") || "";
  const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
  const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined;
  const title = q ? `Chercher « ${q} »` : "Voir sur la carte";

  const [embed, setEmbed] = useState<string | null>(null);
  const [label, setLabel] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Build location object for enhanced maps buttons (after label is defined)
  const location: Partial<MapLocation> = useMemo(() => ({
    lat,
    lng,
    name: q || label || undefined
  }), [lat, lng, q, label]);

  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true); 
      setEmbed(null); 
      setLabel("");
      
      if (lat != null && lng != null) {
        if (!dead) { 
          setEmbed(buildOsmEmbed(lat, lng)); 
          setLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`); 
          setLoading(false); 
        }
        return;
      }
      
      if (q) {
        const hit = await geocode(q, navigator.language || "fr");
        if (!dead) {
          if (hit) { 
            setEmbed(buildOsmEmbed(hit.lat, hit.lng)); 
            setLabel(hit.label); 
          }
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [q, lat, lng]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: label || q, url });
        toast.success("Lien partagé !");
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lien copié !");
      }
    } catch {
      toast.error("Erreur lors du partage");
    }
  };

  const handleCopyLink = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      toast.success("Lien copié !");
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-screen-sm flex items-center gap-3 px-4 py-3">
          <BackButton size="sm" />
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">{title}</h1>
            {label && <p className="text-xs text-muted-foreground truncate">{label}</p>}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="gap-1"
          >
            <Share className="h-4 w-4" />
            Partager
          </Button>
        </div>
      </header>

      {/* Map content */}
      <main className="mx-auto max-w-screen-sm px-4 py-4">
        <section className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
          <div className="p-4">
            {loading ? (
              <div className="h-72 rounded-xl bg-muted animate-pulse" />
            ) : embed ? (
              <div className="rounded-xl overflow-hidden border border-border">
                <iframe
                  src={embed}
                  title="Carte"
                  className="w-full h-72"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="h-72 rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground">
                Chargement impossible. Utilisez les liens ci-dessous.
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3 px-4 pb-4">
            {/* Enhanced maps buttons with sandbox-proof opening */}
            <EnhancedMapsButtons 
              location={location}
              variant="outline"
              size="default"
              showLabels={true}
              className="grid grid-cols-2 gap-3"
            />
            
            {/* Traditional web links fallback */}
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="w-full">
                <a 
                  href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(q || `${lat},${lng}`)}`} 
                  target="_blank" 
                  rel="noopener"
                  aria-label="Ouvrir dans OpenStreetMap"
                >
                  OpenStreetMap
                </a>
              </Button>
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={handleCopyLink}
                aria-label="Copier le lien de cette page"
              >
                <Copy className="h-4 w-4" />
                Copier le lien
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}