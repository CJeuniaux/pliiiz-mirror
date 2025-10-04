"use client";
import { useEffect, useState } from "react";
import { geocodeLabel, saveLocation } from "@/lib/user-geo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OffrirSetupCard({
  initialIdea,
  initialZoneFromProfile,            // ← "Namur, Belgique"
  onConfirm,
}: {
  initialIdea: string;
  initialZoneFromProfile?: string;
  onConfirm: (args: { ideaLabel: string; loc: { lat:number; lng:number; label?:string } }) => void;
}) {
  const [zone, setZone] = useState<string>("");           // ✅ valeur contrôlée
  const [ideaLabel, setIdeaLabel] = useState<string>(initialIdea || "");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  // ➜ Quand la zone de profil arrive, l'écrire comme VALEUR (si l'utilisateur n'a rien saisi)
  useEffect(() => {
    if (!touched && initialZoneFromProfile && initialZoneFromProfile !== zone) {
      setZone(initialZoneFromProfile);
    }
  }, [initialZoneFromProfile]); // eslint-disable-line

  // ➜ Si l'idée arrive après (SPA), synchroniser la valeur
  useEffect(() => {
    if (initialIdea && initialIdea !== ideaLabel) setIdeaLabel(initialIdea);
  }, [initialIdea]); // eslint-disable-line

  const onZoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!touched) setTouched(true);
    setZone(e.target.value);
  };


  const submit = async () => {
    if (!zone.trim()) return alert("Indique une zone (ville, code postal…).");
    if (!ideaLabel.trim()) return alert("Indique le type de cadeaux.");
    setLoading(true);
    console.log('[OffrirSetupCard] Geocoding zone:', zone);
    const hit = await geocodeLabel(zone, undefined, navigator.language || "fr");
    setLoading(false);
    if (!hit) return alert('Zone introuvable. Essaie p.ex. "5000 Namur, Belgique".');
    console.log('[OffrirSetupCard] Geocoded location:', hit);
    saveLocation(hit);
    onConfirm({ ideaLabel, loc: hit });
  };

  return (
    <div>
      <div className="plz-field">
        <label className="plz-label text-base font-bold">Votre zone</label>
        <input
          value={zone}
          onChange={onZoneChange}
          onFocus={() => setTouched(true)}
          placeholder="Ex. 5000 Namur, Belgique"
          className="plz-input"
          autoComplete="off"
        />
        <div className="plz-hint italic">
          La zone est préremplie avec votre ville de profil. Modifiez-la si besoin.
        </div>
      </div>

      <div className="plz-field">
        <label className="plz-label text-base font-bold">Type de cadeaux</label>
        <input
          value={ideaLabel}
          onChange={(e)=>setIdeaLabel(e.target.value)}
          placeholder="Ex. resto japonais, bougie parfumée…"
          className="plz-input"
        />
        <div className="plz-hint italic">
          Affinez le type pour des résultats plus précis (ex: "chocolat belge" plutôt que "chocolat").
        </div>
      </div>

      <div className="plz-actions">
        <button 
          onClick={submit} 
          className="w-full py-3 px-6 rounded-full font-bold text-white text-base bg-gradient-to-r from-[#ff7cab] to-[#ff9c6b] hover:opacity-90 transition-opacity disabled:opacity-50 mt-[10px]"
          disabled={loading}
        >
          {loading ? 'Chargement...' : 'Voir la carte'}
        </button>
      </div>
    </div>
  );
}