import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Suggestion = { id: string; label: string; score: number };

interface PrefItemSelectProps {
  onSelect: (item: { id?: string; label: string }) => void;
  placeholder?: string;
}

export default function PrefItemSelect({ 
  onSelect, 
  placeholder = "Ajoute un item (ex: chocolat, manga…)" 
}: PrefItemSelectProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const debouncedQ = useDebounce(q, 120);

  useEffect(() => {
    const run = async () => {
      if (!debouncedQ?.trim()) { 
        setItems([]); 
        return; 
      }
      
      setLoading(true);
      const { data, error } = await supabase.rpc("search_pref_items", { 
        q: debouncedQ, 
        lim: 8 
      });
      
      if (!error && data) {
        setItems(data);
      } else {
        setItems([]);
      }
      
      setLoading(false);
      setOpen(true); 
      setHighlight(0);
    };
    run();
  }, [debouncedQ]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const createOption = useMemo(() => {
    const exists = items.some(i => i.label.toLowerCase() === q.trim().toLowerCase());
    return q.trim().length >= 2 && !exists ? `Ajouter "${q.trim()}"` : null;
  }, [q, items]);

  const choose = (s: Suggestion | null) => {
    setOpen(false);
    if (s) {
      onSelect({ id: s.id, label: s.label });
    } else {
      onSelect({ label: q.trim() });
    }
    setQ("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    
    if (e.key === "ArrowDown") { 
      e.preventDefault(); 
      setHighlight(h => Math.min(h + 1, (items.length + (createOption ? 1 : 0)) - 1)); 
    }
    
    if (e.key === "ArrowUp") { 
      e.preventDefault(); 
      setHighlight(h => Math.max(h - 1, 0)); 
    }
    
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlight < items.length) {
        choose(items[highlight]);
      } else if (createOption) {
        choose(null);
      }
    }
    
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="pref-autocomplete">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => q && setOpen(true)}
        onKeyDown={onKey}
        placeholder={placeholder}
        className="pref-input"
      />
      {open && (items.length > 0 || createOption || loading) && (
        <div className="pref-pop">
          {loading && <div className="pref-opt muted">Recherche…</div>}
          {items.map((s, idx) => (
            <div
              key={s.id}
              className={"pref-opt " + (idx === highlight ? "active" : "")}
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(e) => { e.preventDefault(); choose(s); }}
            >
              {s.label}
            </div>
          ))}
          {createOption && (
            <div
              className={"pref-opt create " + (highlight === items.length ? "active" : "")}
              onMouseEnter={() => setHighlight(items.length)}
              onMouseDown={(e) => { e.preventDefault(); choose(null); }}
            >
              ➕ {createOption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function useDebounce<T>(value: T, delay = 120) {
  const [v, setV] = useState(value);
  useEffect(() => { 
    const t = setTimeout(() => setV(value), delay); 
    return () => clearTimeout(t); 
  }, [value, delay]);
  return v;
}