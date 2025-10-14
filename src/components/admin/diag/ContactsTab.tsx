import { useEffect, useState } from "react";
import { 
  fetchContactsFull, 
  fetchAcceptedWithoutContact, 
  fetchAcceptedContactGaps,
  resyncAllContactsAdmin,
  resyncContactPairAdmin
} from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ContactsTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [missing, setMissing] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [gapPage, setGapPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  async function load() {
    setBusy(true);
    try {
      const [{ data: c }, { data: m }, g] = await Promise.all([
        fetchContactsFull(page, 50, q),
        fetchAcceptedWithoutContact(),
        fetchAcceptedContactGaps(gapPage, 50)
      ]);
      setRows(c ?? []);
      setMissing(m ?? []);
      setGaps(g.data ?? []);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, q, gapPage]);

  const hasAlerts = (missing.length > 0) || (gaps.length > 0);

  async function fixAll() {
    setBusy(true);
    try {
      await resyncAllContactsAdmin();
      toast({
        title: "Succès",
        description: "Tous les contacts ont été synchronisés",
      });
      await load();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function fixPair(a: string, b: string, dir: "both" | "a2b" | "b2a") {
    setBusy(true);
    try {
      await resyncContactPairAdmin(a, b, dir !== "b2a", dir !== "a2b");
      toast({
        title: "Succès",
        description: "Contacts créés avec succès",
      });
      await load();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Bandeau d'alerte */}
      <div className={`mb-4 p-4 rounded-lg border ${hasAlerts ? "bg-amber-50 border-amber-300" : "bg-emerald-50 border-emerald-300"}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">{hasAlerts ? "⚠️ Anomalies détectées" : "✓ Contacts OK"}</div>
            <div className="text-sm text-slate-600">
              Paires accepted sans contact: <b>{missing.length}</b> · Gaps détaillés: <b>{gaps.length}</b>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={fixAll} disabled={busy}>
              {busy ? "..." : "Auto-fixer tout"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Contacts existants */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Recherche nom…"
              className="max-w-xs"
            />
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ◀
            </Button>
            <span className="text-sm">p.{page}</span>
            <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
              ▶
            </Button>
          </div>
          <h3 className="font-semibold mb-2">Contacts (owner → contact)</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Owner</th>
                  <th className="px-4 py-2 text-left">Contact</th>
                  <th className="px-4 py-2 text-left">Créé</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">
                      {r.owner_name} <span className="text-xs text-slate-500">({r.owner_id?.slice(0, 6)})</span>
                    </td>
                    <td className="px-4 py-2">
                      {r.contact_name} <span className="text-xs text-slate-500">({r.contact_id?.slice(0, 6)})</span>
                    </td>
                    <td className="px-4 py-2">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertes détaillées + actions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Accepted sans contact — actions manuelles</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setGapPage((p) => Math.max(1, p - 1))}>
                ◀
              </Button>
              <span className="text-sm">p.{gapPage}</span>
              <Button variant="outline" onClick={() => setGapPage((p) => p + 1)}>
                ▶
              </Button>
            </div>
          </div>
          {gaps.length === 0 ? (
            <p className="text-sm text-green-700">✓ Aucune anomalie.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">From (A)</th>
                    <th className="px-3 py-2 text-left">To (B)</th>
                    <th className="px-3 py-2 text-left">Créé</th>
                    <th className="px-3 py-2 text-left">Manques</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gaps.map((g: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{g.from_name || g.from_user_id?.slice(0, 8)}</td>
                      <td className="px-3 py-2">{g.to_name || g.to_user_id?.slice(0, 8)}</td>
                      <td className="px-3 py-2">{new Date(g.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        {g.missing_a_to_b && <span className="px-2 py-0.5 mr-1 rounded-full bg-amber-100 text-amber-800 text-xs">A→B</span>}
                        {g.missing_b_to_a && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">B→A</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {g.missing_a_to_b && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-1" 
                            disabled={busy} 
                            onClick={() => fixPair(g.from_user_id, g.to_user_id, "a2b")}
                          >
                            A→B
                          </Button>
                        )}
                        {g.missing_b_to_a && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-1" 
                            disabled={busy} 
                            onClick={() => fixPair(g.from_user_id, g.to_user_id, "b2a")}
                          >
                            B→A
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          disabled={busy} 
                          onClick={() => fixPair(g.from_user_id, g.to_user_id, "both")}
                        >
                          Les deux
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
