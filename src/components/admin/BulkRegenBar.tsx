import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminMode } from "@/contexts/AdminModeContext";
import type { GiftRef } from "./GiftSelectOverlay";
import { toast } from "sonner";

export function BulkRegenBar() {
  const { adminModeOn, isAdmin } = useAdminMode();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<GiftRef[]>([]);
  const [loading, setLoading] = useState(false);
  const count = list.length;

  useEffect(() => {
    const handler = (e: any) => {
      setOpen(true);
      setList(prev => {
        const g: GiftRef = e.detail.gift;
        if (e.detail.add) {
          return [...prev, g];
        } else {
          return prev.filter(x =>
            !(x.giftIdeaId === g.giftIdeaId && 
              x.title === g.title &&
              x.category === g.category &&
              x.occasion === g.occasion)
          );
        }
      });
    };
    document.addEventListener("pliiiz-multi-select", handler);
    return () => document.removeEventListener("pliiiz-multi-select", handler);
  }, []);

  if (!adminModeOn || !isAdmin || !open) return null;

  const run = async () => {
    if (!count) return;
    setLoading(true);
    try {
      const payload = list.map(g => ({
        gift_idea_id: g.giftIdeaId,
        title: g.title,
        category: g.category,
        occasion: g.occasion,
        reason: 'bulk-admin'
      }));

      const { error } = await supabase.rpc("request_gift_image_regen_resolve_many", {
        payload: JSON.parse(JSON.stringify(payload))
      });

      if (error) throw error;

      toast.success(`${count} image${count > 1 ? 's' : ''} en file d'attente`);
      setList([]);
      setOpen(false);
    } catch (error) {
      console.error('Bulk regen error:', error);
      toast.error('Erreur lors de la régénération groupée');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-bar">
      <div>{count} sélectionné{count > 1 ? 's' : ''}</div>
      <button 
        onClick={run} 
        disabled={loading || !count} 
        className="btn-admin btn-admin-primary"
      >
        {loading ? '⏳ Régénération…' : '🔄 Régénérer sélection'}
      </button>
      <button 
        onClick={() => { 
          setList([]); 
          setOpen(false); 
        }} 
        className="btn-admin btn-admin-secondary"
      >
        Annuler
      </button>
    </div>
  );
}
