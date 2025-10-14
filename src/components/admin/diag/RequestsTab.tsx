import { useEffect, useState } from "react";
import { fetchRequestsFull } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";

export default function RequestsTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState<"all" | "pending" | "accepted" | "declined">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await fetchRequestsFull(status, page, 50);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [status, page]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="px-3 py-2 rounded-md border bg-background"
        >
          <option value="all">Tous</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
        <div className="flex-1" />
        <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>
          ◀
        </Button>
        <span className="text-sm">p.{page}</span>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
          ▶
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left">De</th>
              <th className="px-4 py-2 text-left">À</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Créé</th>
              <th className="px-4 py-2 text-left">MAJ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Chargement...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Aucune demande
                </td>
              </tr>
            ) : (
              rows.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{r.from_name || r.from_user_id?.slice(0, 8)}</td>
                  <td className="px-4 py-2">{r.to_name || r.to_user_id?.slice(0, 8)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        r.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : r.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">{new Date(r.updated_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
