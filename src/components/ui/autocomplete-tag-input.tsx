import React, { useEffect, useMemo, useRef, useState } from "react";

export type Suggestion = { id: string; label: string; meta?: string };

type Props = {
  category: "likes" | "avoids" | "gifts" | "brands";
  placeholder?: string;
  existingValues?: string[];             // pour filtrer ce qui est déjà ajouté
  onAdd: (value: string) => void;        // ajoute un tag/chip
  fetchSuggestions?: (q: string) => Promise<Suggestion[]>; // override optionnel
  maxItems?: number;                      // défaut 8
  className?: string;
};

const removeDiacritics = (s: string) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const matchScore = (q: string, target: string) => {
  // priorité au startsWith, sinon includes
  if (!q) return 0;
  const a = removeDiacritics(target.toLowerCase());
  const b = removeDiacritics(q.toLowerCase());
  if (a.startsWith(b)) return 2;
  if (a.includes(b)) return 1;
  return 0;
};

export const AutocompleteTagInput: React.FC<Props> = ({
  category,
  placeholder = "Commencez à taper…",
  existingValues = [],
  onAdd,
  fetchSuggestions,
  maxItems = 8,
  className = "",
}) => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // provider par défaut (local + option marque)
  const provider = useMemo(() => {
    if (fetchSuggestions) return fetchSuggestions;
    return defaultProvider(category);
  }, [category, fetchSuggestions]);

  // charge suggestions (debounce light)
  useEffect(() => {
    let dead = false;
    const t = setTimeout(async () => {
      const all = await provider(q);
      if (dead) return;
      const dedupSet = new Set((existingValues || []).map(v => v.toLowerCase()));
      const filtered = all
        .filter(s => !dedupSet.has(s.label.toLowerCase()))
        .map(s => ({...s, _score: matchScore(q, s.label)}))
        .filter(s => q ? s._score > 0 : true)
        .sort((a: any, b: any) => b._score - a._score || a.label.localeCompare(b.label))
        .slice(0, maxItems)
        .map(({_score, ...rest}: any) => rest);
      setItems(filtered);
      setActive(0); // reset active when items change
    }, 120);
    return () => { dead = true; clearTimeout(t); };
  }, [q, provider, existingValues, maxItems]);

  const select = (s?: Suggestion) => {
    const value = (s?.label || q).trim();
    if (!value) return;
    onAdd(value);
    setQ("");
    setActive(0);
    setOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") { 
      e.preventDefault(); 
      setActive(a => Math.min(a + 1, items.length - 1)); 
    }
    if (e.key === "ArrowUp") { 
      e.preventDefault(); 
      setActive(a => Math.max(a - 1, 0)); 
    }
    if (e.key === "Enter") { 
      e.preventDefault(); 
      if (items.length > 0) {
        select(items[active]); 
      } else if (q.trim()) {
        select();
      }
    }
    if (e.key === "Escape") { 
      setOpen(false); 
      setActive(0);
    }
  };

  const highlight = (label: string) => {
    if (!q) return label;
    const a = removeDiacritics(label.toLowerCase());
    const b = removeDiacritics(q.toLowerCase());
    const i = a.indexOf(b);
    if (i < 0) return label;
    return (
      <>
        {label.slice(0, i)}
        <mark className="bg-yellow-200 rounded px-0.5">{label.slice(i, i + q.length)}</mark>
        {label.slice(i + q.length)}
      </>
    );
  };

  return (
    <div className={`relative z-[3000] ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={q}
        onChange={(e) => { 
          setQ(e.target.value); 
          setOpen(true); 
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay to allow click on suggestions
          setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={onKeyDown}
        aria-autocomplete="list"
        aria-expanded={open}
        placeholder={placeholder}
        className="w-full rounded-full border border-white/40 bg-white/10 backdrop-blur-sm px-3 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
      />

      {open && (q.length >= 0) && items.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="plz-dropdown absolute z-[4000] mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-2xl ring-1 ring-black/10 pointer-events-auto"
        >
          {items.map((s, idx) => (
            <li
              key={s.id || s.label}
              role="option"
              aria-selected={idx === active}
              className={`cursor-pointer px-3 py-2 text-sm text-gray-900 ${
                idx === active ? "bg-emerald-50 text-emerald-900" : "bg-white text-gray-900"
              } hover:bg-emerald-50 hover:text-emerald-900`}
              onMouseEnter={() => setActive(idx)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(s)}
            >
              <div className="flex items-center justify-between">
                <span>{highlight(s.label)}</span>
                {s.meta && <span className="text-xs text-gray-500 ml-3">{s.meta}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ----------------- Providers par défaut ----------------- */

const LIKES_SEED = [
  "Chocolat noir", "Café", "Thé", "Vins rouges", "Bières artisanales",
  "Bougies", "Plantes vertes", "Livres", "Randonnée", "Jeux de société",
  "Soins / spa", "Cuisine italienne", "Cuisine japonaise", "Pâtisseries",
  "Musique", "Cinéma", "Art", "Photographie", "Voyage", "Sport",
  "Yoga", "Méditation", "Cuisine", "Pâtisserie", "Jardinage"
];

const AVOIDS_SEED = [
  "Gluten", "Lactose", "Arachides", "Fruits à coque", "Fruits de mer",
  "Sésame", "Soja", "Œufs", "Porc", "Alcool",
  "Parfums forts", "Bougies parfumées", "Objets encombrants", "Cuir",
  "Plumes", "Poils d'animaux", "Nickel", "Latex"
];

const GIFTS_SEED = [
  "Carte cadeau", "Bougie parfumée", "Plante d'intérieur", "Écharpe en laine",
  "Livre broché", "Vinyle", "Puzzle", "Expérience massage", "Dîner au restaurant",
  "Chocolats artisanaux", "Coffret thé/café", "Jeu de société",
  "Bijoux", "Accessoires mode", "Produits de beauté", "Parfum",
  "Objet déco", "Gadget tech", "Abonnement streaming"
];

const BRANDS_SEED = [
  "Apple", "Lego", "Sephora", "Decathlon", "Nike", "Adidas", 
  "Zara", "H&M", "Ikea", "Amazon", "Netflix", "Spotify",
  "Nespresso", "L'Occitane", "Pandora", "Swarovski",
  "MAC", "Dior", "Chanel", "Hermès", "Louis Vuitton",
  "PlayStation", "Xbox", "Nintendo", "Samsung", "Google",
  "Fnac", "Leroy Merlin", "Maisons du Monde", "Nature et Découvertes"
];

async function localFilter(list: string[], q: string): Promise<Suggestion[]> {
  // renvoyer des suggestions même si q est vide (liste courte)
  const base = list.map((label, i) => ({ id: `${label}-${i}`, label }));
  if (!q) return base.slice(0, 8);
  const b = removeDiacritics(q.toLowerCase());
  return base.filter(s => removeDiacritics(s.label.toLowerCase()).includes(b));
}

// ⚠️ Marque : réutiliser le provider existant si disponible
async function searchBrandsFallback(q: string): Promise<Suggestion[]> {
  // fallback local minimal (remplacer par votre API / provider de la carte marques)
  return localFilter(BRANDS_SEED, q);
}

function defaultProvider(category: Props["category"]) {
  if (category === "likes")  return (q: string) => localFilter(LIKES_SEED, q);
  if (category === "avoids") return (q: string) => localFilter(AVOIDS_SEED, q);
  if (category === "gifts")  return (q: string) => localFilter(GIFTS_SEED, q);
  // brands : essayer provider existant sur la carte "marques préférées"
  // Remplacez `searchBrandsFallback` par votre fonction existante (ex: searchBrands(q))
  return (q: string) => searchBrandsFallback(q);
}