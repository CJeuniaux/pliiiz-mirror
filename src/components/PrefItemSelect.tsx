import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [popPos, setPopPos] = useState<{ left: number; top: number; width: number } | null>(null);

  const debouncedQ = useDebounce(q, 120);

  const updatePosition = () => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPopPos({
      left: rect.left + window.scrollX,
      top: rect.bottom + 6 + window.scrollY,
      width: rect.width,
    });
  };

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
        console.error('Search error:', error);
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
      const t = e.target as Node;
      if (boxRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const update = () => updatePosition();
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  const createOption = useMemo(() => {
    const exists = items.some(i => i.label.toLowerCase() === q.trim().toLowerCase());
    return q.trim().length >= 2 && !exists ? `Ajouter "${q.trim()}"` : null;
  }, [q, items]);

  const choose = async (s: Suggestion | null) => {
    setOpen(false);
    if (s) {
      // Existing item - increment usage count
      const { data: currentItem } = await supabase
        .from('pref_items')
        .select('usage_count')
        .eq('id', s.id)
        .single();
      
      if (currentItem) {
        await supabase
          .from('pref_items')
          .update({ usage_count: (currentItem.usage_count || 0) + 1 })
          .eq('id', s.id);
      }
      
      onSelect({ id: s.id, label: s.label });
    } else {
      // New item - create it
      const trimmed = q.trim();
      const { data, error } = await supabase
        .from('pref_items')
        .insert({ label: trimmed, usage_count: 1 })
        .select('id, label')
        .single();
      
      if (!error && data) {
        onSelect({ id: data.id, label: data.label });
      } else {
        // Fallback if insertion fails
        onSelect({ label: trimmed });
      }
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
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={boxRef} className="pref-autocomplete">
      <input
        ref={inputRef}
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => { setOpen(true); updatePosition(); }}
        onKeyDown={onKey}
        placeholder={placeholder}
        className="pref-input"
      />
      {open && (items.length > 0 || createOption || loading) && popPos && (
        createPortal(
          <div
            ref={popRef}
            className="pref-pop"
            style={{ position: 'fixed', left: popPos.left, top: popPos.top, width: popPos.width, zIndex: 10001 }}
          >
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
          </div>,
          document.body
        )
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
