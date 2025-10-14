import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rescoreAllGifts, rescoreOneGift } from "@/lib/api/gifts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DiagGiftAccuracy() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescoring, setRescoring] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("vw_gift_with_media")
      .select("*")
      .order("accuracy_score", { ascending: true });
    
    if (!error) {
      setRows(data ?? []);
    } else {
      toast.error("Erreur de chargement");
    }
    setLoading(false);
  }

  useEffect(() => { 
    load(); 
  }, []);

  async function handleRescoreAll() {
    setRescoring(true);
    try {
      await rescoreAllGifts();
      toast.success("Rescore global terminé");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Erreur rescore");
    } finally {
      setRescoring(false);
    }
  }

  async function handleRescoreOne(giftId: string) {
    try {
      await rescoreOneGift(giftId);
      toast.success("Rescore unitaire OK");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    }
  }

  return (
    <div className="pliiz-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Accuracy images – Gifts</h3>
        <Button 
          onClick={handleRescoreAll} 
          disabled={rescoring}
          variant="default"
        >
          {rescoring ? "Rescoring..." : "Rescore (global)"}
        </Button>
      </div>
      
      {loading ? (
        <p className="text-center py-8 opacity-60">Chargement…</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/20">
              <tr>
                <th className="text-left py-2 px-2">Gift</th>
                <th className="text-left py-2 px-2">Catégorie</th>
                <th className="text-center py-2 px-2">Score</th>
                <th className="text-center py-2 px-2">Image</th>
                <th className="text-right py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 opacity-60">
                    Aucun gift trouvé
                  </td>
                </tr>
              ) : (
                rows.map(r => (
                  <tr key={r.gift_id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-2 px-2">{r.title}</td>
                    <td className="py-2 px-2 text-xs opacity-80">{r.category_slug}</td>
                    <td className="text-center py-2 px-2">
                      <span className={`font-medium ${
                        r.accuracy_score >= 80 ? 'text-green-400' :
                        r.accuracy_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {r.accuracy_score}
                      </span>
                    </td>
                    <td className="text-center py-2 px-2">
                      {r.source_ref ? "✅" : "—"}
                    </td>
                    <td className="text-right py-2 px-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleRescoreOne(r.gift_id)}
                      >
                        Rescore
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
