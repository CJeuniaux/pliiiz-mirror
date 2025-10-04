import { useEffect, useMemo, useRef, useState } from "react";
import { OSMTarget, geocode, buildOsmEmbed, buildExternalLinks } from "@/lib/osm";

type Props = { open: boolean; onClose: () => void; target: OSMTarget; title?: string };

export function OSMDialog({ open, onClose, target, title = "Voir sur la carte" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [label, setLabel] = useState<string>("");
  const links = useMemo(() => buildExternalLinks(target), [target]);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  useEffect(() => {
    let dead = false;
    (async () => {
      setSrc(null); setLabel("");
      const { lat, lng, query } = target || {};
      if (lat != null && lng != null) {
        if (!dead) { setSrc(buildOsmEmbed(lat, lng)); setLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`); }
        return;
      }
      if (query?.trim()) {
        const hit = await geocode(query, navigator.language || "fr");
        if (!dead && hit) { setSrc(buildOsmEmbed(hit.lat, hit.lng)); setLabel(hit.label); }
      }
    })();
    return () => { dead = true; };
  }, [target]);

  const copy = async () => { try { await navigator.clipboard.writeText(links.osm); alert("Lien copié !"); } catch {} };

  return (
    <dialog ref={ref} className="rounded-2xl p-0 w-[min(92vw,520px)] backdrop:bg-black/40" onClose={onClose}>
      <div className="bg-white rounded-2xl overflow-hidden border border-black/10">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          {label && <p className="text-sm text-gray-500 truncate">{label}</p>}
        </div>
        <div className="px-5 pb-4">
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            {src ? (
              <iframe src={src} title="Carte" className="w-full h-64" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-gray-500 text-sm">
                Chargement impossible. Utilisez les liens ci-dessous.
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a className="btn btn-primary" href={links.osm} target="_blank" rel="noopener">Ouvrir OSM</a>
            <a className="btn btn-ghost border" href={links.apple} target="_blank" rel="noopener">Apple Plans</a>
            <a className="btn btn-ghost border" href={links.waze}  target="_blank" rel="noopener">Waze</a>
            <a className="btn btn-ghost border" href={links.gmaps} target="_blank" rel="noopener">Google Maps</a>
            <button className="btn btn-ghost border col-span-2" onClick={copy}>Copier le lien</button>
          </div>
          <div className="mt-3 text-right">
            <button className="btn btn-link" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </dialog>
  );
}