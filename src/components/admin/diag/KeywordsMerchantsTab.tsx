import { useEffect, useState } from "react";
import { fetchQueryTerms, fetchQueryDetails, upsertMerchant, listMerchants } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function KeywordsMerchantsTab() {
  const [terms, setTerms] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [details, setDetails] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await fetchQueryTerms(page, 50, q);
      setTerms(data ?? []);
    })();
  }, [q, page]);

  useEffect(() => {
    (async () => {
      if (!selectedTerm) {
        setDetails([]);
        return;
      }
      const { data } = await fetchQueryDetails(selectedTerm, 1, 50);
      setDetails(data ?? []);
    })();
  }, [selectedTerm]);

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Input
            className="max-w-xs"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrer un terme…"
          />
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
                <th className="px-4 py-2 text-left">Terme</th>
                <th className="px-4 py-2 text-center">Hits</th>
                <th className="px-4 py-2 text-center">Users</th>
                <th className="px-4 py-2 text-left">Dernier</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((t: any) => (
                <tr
                  key={t.term}
                  className={`border-t cursor-pointer hover:bg-accent ${
                    selectedTerm === t.term ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedTerm(t.term)}
                >
                  <td className="px-4 py-2">{t.term}</td>
                  <td className="px-4 py-2 text-center">{t.hits}</td>
                  <td className="px-4 py-2 text-center">{t.users}</td>
                  <td className="px-4 py-2">{new Date(t.last_seen).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">
          Détails du terme {selectedTerm ? `"${selectedTerm}"` : ""}
        </h3>
        {selectedTerm ? (
          <TermDetails term={selectedTerm} details={details} />
        ) : (
          <p className="text-sm text-muted-foreground">Sélectionne un terme à gauche.</p>
        )}
      </div>
    </div>
  );
}

function TermDetails({ term, details }: { term: string; details: any[] }) {
  const [mQ, setMQ] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [newMerchant, setNewMerchant] = useState({ name: "", slug: "", external_url: "" });
  const { toast } = useToast();

  async function searchMerchants() {
    const r = await listMerchants(mQ);
    setMatches(r.data ?? []);
  }

  async function createMerchant() {
    if (!newMerchant.name || !newMerchant.slug) {
      toast({
        title: "Erreur",
        description: "Nom et slug requis",
        variant: "destructive",
      });
      return;
    }
    const { error } = await upsertMerchant(newMerchant);
    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succès",
        description: "Enseigne créée",
      });
      setNewMerchant({ name: "", slug: "", external_url: "" });
      await searchMerchants();
    }
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left">Quand</th>
              <th className="px-4 py-2 text-left">Utilisateur</th>
              <th className="px-4 py-2 text-left">Query</th>
            </tr>
          </thead>
          <tbody>
            {details.map((d: any) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-2">{new Date(d.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">{d.user_name || d.user_id?.slice(0, 8)}</td>
                <td className="px-4 py-2">{d.query_text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t pt-3">
        <h4 className="font-semibold mb-2">Enseignes</h4>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher une enseigne…"
            value={mQ}
            onChange={(e) => setMQ(e.target.value)}
          />
          <Button onClick={searchMerchants}>Chercher</Button>
        </div>
        {matches.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {matches.map((m: any) => (
              <span key={m.id} className="px-2 py-0.5 rounded-full bg-muted text-sm">
                {m.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 p-4 bg-muted/50 rounded-lg">
          <h5 className="font-medium mb-2">Créer une nouvelle enseigne</h5>
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="Nom"
              value={newMerchant.name}
              onChange={(e) => setNewMerchant((s) => ({ ...s, name: e.target.value }))}
            />
            <Input
              placeholder="slug-ex: fnac"
              value={newMerchant.slug}
              onChange={(e) => setNewMerchant((s) => ({ ...s, slug: e.target.value }))}
            />
            <Input
              placeholder="URL"
              value={newMerchant.external_url}
              onChange={(e) => setNewMerchant((s) => ({ ...s, external_url: e.target.value }))}
            />
          </div>
          <Button className="mt-2" onClick={createMerchant}>
            Créer
          </Button>
        </div>
      </div>
    </div>
  );
}
