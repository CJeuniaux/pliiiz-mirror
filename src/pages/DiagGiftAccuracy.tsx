import { useEffect, useState } from "react";
import { rescoreAllGifts, rescoreOneGift, fetchGiftsWithMedia } from "@/lib/api/gifts";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function DiagGiftAccuracy() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescoring, setRescoring] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await fetchGiftsWithMedia();
    if (!error && data) {
      setRows(data.sort((a, b) => (a.accuracy_score ?? 0) - (b.accuracy_score ?? 0)));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRescoreAll() {
    setRescoring(true);
    try {
      await rescoreAllGifts();
      toast.success("Rescore global terminé");
      await load();
    } catch (err) {
      toast.error("Erreur lors du rescore");
      console.error(err);
    } finally {
      setRescoring(false);
    }
  }

  async function handleRescoreOne(id: string) {
    try {
      await rescoreOneGift(id);
      toast.success("Gift rescored");
      await load();
    } catch (err) {
      toast.error("Erreur");
      console.error(err);
    }
  }

  if (loading) {
    return <div className="p-6">Chargement des gifts…</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Accuracy images – Gifts</h1>
        <Button 
          onClick={handleRescoreAll} 
          disabled={rescoring}
          className="gap-2"
        >
          <RefreshCw size={16} className={rescoring ? "animate-spin" : ""} />
          Rescore global
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          Aucun gift dans la base
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Gift</th>
                <th className="text-left p-3 font-medium">Catégorie</th>
                <th className="text-center p-3 font-medium">Score</th>
                <th className="text-center p-3 font-medium">Image</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.gift_id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-3">{r.title}</td>
                  <td className="p-3 text-sm text-muted-foreground">{r.category_label}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      r.accuracy_score >= 80 ? "bg-green-100 text-green-800" :
                      r.accuracy_score >= 60 ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {r.accuracy_score ?? 0}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {r.source_ref ? (
                      <span className="text-green-600">✅</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRescoreOne(r.gift_id)}
                    >
                      Rescore
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
