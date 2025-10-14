import { useEffect, useState } from "react";
import { getDiagCounters } from "@/lib/api/admin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ContactsTab from "@/components/admin/diag/ContactsTab";
import RequestsTab from "@/components/admin/diag/RequestsTab";
import KeywordsMerchantsTab from "@/components/admin/diag/KeywordsMerchantsTab";
import { ContactsDemandsCard } from "@/components/admin/diag/ContactsDemandsCard";
import { ImageRegenPanel } from "@/components/admin/image-regen-panel";
import { GiftImageRegenPanel } from "@/components/admin/gift-image-regen-panel";
import { GiftRegenerationDashboard } from "@/components/admin/gift-regeneration-dashboard";
import { PartnersEnrichment } from "@/components/admin/partners-enrichment";
import { SlugMigrationScreen } from "@/components/screens/slug-migration-screen";
import { UnsplashRegenerateAll } from "@/components/admin/unsplash-regenerate-all";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldAlert } from "lucide-react";

interface SyncResult {
  success: boolean;
  total_accepted_requests: number;
  contacts_created: number;
  contacts_before: number;
  contacts_after: number;
  synced_at: string;
}

interface FeedbackStats {
  total: number;
  love: number;
  mixed: number;
  dislike: number;
  averageRating: number;
}

interface FeedbackItem {
  id: string;
  choice: 'LOVE' | 'MIXED' | 'DISLIKE';
  comment: string | null;
  created_at: string;
  user_id: string | null;
  session_id: string;
}

export default function DiagAdmin() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [counters, setCounters] = useState<any>(null);
  const [tab, setTab] = useState<
    "contacts" | "requests" | "keywords" | "images" | "gifts" | "partners" | 
    "slugs" | "unsplash" | "populate" | "feedback" | "sync"
  >("contacts");

  // État pour l'onglet Sync
  const [missingContacts, setMissingContacts] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // État pour l'onglet Feedback
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // État pour l'onglet Populate
  const [populateLoading, setPopulateLoading] = useState(false);
  const [populateResult, setPopulateResult] = useState<any>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error('Accès refusé : page réservée aux administrateurs');
      navigate("/home");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    (async () => {
      const { data } = await getDiagCounters();
      setCounters(data ?? {});
    })();
  }, []);

  // Charger les stats sync
  async function loadSyncStats() {
    setLoading(true);
    try {
      const { count, error } = await supabase
        .from('vw_missing_contacts')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Erreur chargement stats:', error);
        toast.error('Erreur lors du chargement des statistiques');
      } else {
        setMissingContacts(count || 0);
      }
    } catch (err) {
      console.error('Exception:', err);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!adminLoading && isAdmin && tab === 'sync') {
      loadSyncStats();
    }
  }, [adminLoading, isAdmin, tab]);

  // Resynchroniser les contacts
  async function resyncContacts() {
    setSyncing(true);
    try {
      const { data, error } = await supabase.rpc('resync_all_contacts');
      
      if (error) {
        console.error('Erreur resync:', error);
        toast.error('Erreur lors de la resynchronisation');
      } else if (data) {
        const result = data as unknown as SyncResult;
        setLastSyncResult(result);
        toast.success(`✅ Resync effectué ! ${result.contacts_created} contacts créés`);
        await loadSyncStats();
      }
    } catch (err) {
      console.error('Exception resync:', err);
      toast.error('Erreur de connexion');
    } finally {
      setSyncing(false);
    }
  }

  // Charger les feedbacks
  async function loadFeedbackData() {
    setFeedbackLoading(true);
    try {
      const { data: allFeedback, error } = await supabase
        .from('design_feedback')
        .select('id, choice, comment, created_at, user_id, session_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const feedbacks = (allFeedback || []) as FeedbackItem[];
      setFeedbackList(feedbacks);

      const stats = {
        total: feedbacks.length,
        love: feedbacks.filter((f: FeedbackItem) => f.choice === 'LOVE').length,
        mixed: feedbacks.filter((f: FeedbackItem) => f.choice === 'MIXED').length,
        dislike: feedbacks.filter((f: FeedbackItem) => f.choice === 'DISLIKE').length,
        averageRating: 0,
      };

      const weights = { LOVE: 5, MIXED: 3, DISLIKE: 1 };
      if (stats.total > 0) {
        const totalScore = feedbacks.reduce((sum: number, f: FeedbackItem) => sum + weights[f.choice], 0);
        stats.averageRating = Number((totalScore / stats.total).toFixed(2));
      }

      setFeedbackStats(stats);
    } catch (error: any) {
      console.error('Erreur chargement feedback:', error);
      toast.error('Erreur lors du chargement des feedbacks');
    } finally {
      setFeedbackLoading(false);
    }
  }

  useEffect(() => {
    if (!adminLoading && isAdmin && tab === 'feedback') {
      loadFeedbackData();
    }
  }, [adminLoading, isAdmin, tab]);

  // Populate images
  async function handlePopulate() {
    try {
      setPopulateLoading(true);
      setPopulateResult(null);

      const { data, error } = await supabase.functions.invoke('populate-gift-images', {
        body: { forceRegenerate: false }
      });

      if (error) throw error;

      setPopulateResult(data);
      toast.success(`✅ Images populées : ${data?.processed || 0} items traités`);
    } catch (error: any) {
      console.error('Erreur populate:', error);
      toast.error(`Erreur : ${error.message}`);
    } finally {
      setPopulateLoading(false);
    }
  }

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Accès refusé</h2>
          <p className="text-muted-foreground">
            Cette page est réservée aux administrateurs.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div id="diag-admin-page" className="min-h-screen w-screen bg-background overflow-x-hidden">
      <div className="px-8 py-4 border-b bg-card/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-semibold">Administration Pliiiz</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          Contacts: <b>{counters?.contacts ?? "—"}</b> • Requests(accepted):{" "}
          <b>{counters?.accepted_requests ?? "—"}</b> • A→B manquants:{" "}
          <b className={counters?.accepted_without_contact ? "text-amber-600" : ""}>
            {counters?.accepted_without_contact ?? "—"}
          </b>{" "}
          • Termes: <b>{counters?.query_terms ?? "—"}</b>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <Tab label="Contacts" active={tab === "contacts"} onClick={() => setTab("contacts")} />
          <Tab label="Demandes" active={tab === "requests"} onClick={() => setTab("requests")} />
          <Tab label="Mots-clés" active={tab === "keywords"} onClick={() => setTab("keywords")} />
          <Tab label="Images" active={tab === "images"} onClick={() => setTab("images")} />
          <Tab label="Cadeaux" active={tab === "gifts"} onClick={() => setTab("gifts")} />
          <Tab label="Partenaires" active={tab === "partners"} onClick={() => setTab("partners")} />
          <Tab label="Slugs" active={tab === "slugs"} onClick={() => setTab("slugs")} />
          <Tab label="Unsplash" active={tab === "unsplash"} onClick={() => setTab("unsplash")} />
          <Tab label="Populate" active={tab === "populate"} onClick={() => setTab("populate")} />
          <Tab label="Feedback" active={tab === "feedback"} onClick={() => setTab("feedback")} />
          <Tab label="Sync Contacts" active={tab === "sync"} onClick={() => setTab("sync")} />
        </div>
      </div>

      <div className="p-8 max-w-none">
        {tab === "contacts" && (
          <div className="space-y-6">
            <ContactsDemandsCard />
            <ContactsTab />
          </div>
        )}
        {tab === "requests" && <RequestsTab />}
        {tab === "keywords" && <KeywordsMerchantsTab />}
        {tab === "images" && (
          <div className="space-y-6">
            <ImageRegenPanel />
            <GiftImageRegenPanel />
          </div>
        )}
        {tab === "gifts" && <GiftRegenerationDashboard />}
        {tab === "partners" && <PartnersEnrichment />}
        {tab === "slugs" && <SlugMigrationScreen />}
        {tab === "unsplash" && <UnsplashRegenerateAll />}
        {tab === "populate" && (
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Populate Gift Images</h3>
              <p className="text-sm text-muted-foreground">
                Génère automatiquement les images pour les cadeaux qui n'en ont pas
              </p>
            </div>
            <Button
              onClick={handlePopulate}
              disabled={populateLoading}
              className="gap-2"
            >
              {populateLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Population en cours...
                </>
              ) : (
                'Lancer la population'
              )}
            </Button>
            {populateResult && (
              <div className="p-4 bg-muted rounded-lg">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(populateResult, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        )}
        {tab === "feedback" && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Feedback Design</h3>
              <Button onClick={loadFeedbackData} disabled={feedbackLoading} variant="outline" size="sm">
                {feedbackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Actualiser'}
              </Button>
            </div>
            
            {feedbackStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-2xl font-bold">{feedbackStats.total}</div>
                </Card>
                <Card className="p-4 border-green-500">
                  <div className="text-sm text-muted-foreground">❤️ LOVE</div>
                  <div className="text-2xl font-bold text-green-600">{feedbackStats.love}</div>
                </Card>
                <Card className="p-4 border-yellow-500">
                  <div className="text-sm text-muted-foreground">😐 MIXED</div>
                  <div className="text-2xl font-bold text-yellow-600">{feedbackStats.mixed}</div>
                </Card>
                <Card className="p-4 border-red-500">
                  <div className="text-sm text-muted-foreground">😞 DISLIKE</div>
                  <div className="text-2xl font-bold text-red-600">{feedbackStats.dislike}</div>
                </Card>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {feedbackList.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${
                      item.choice === 'LOVE' ? 'text-green-600' :
                      item.choice === 'MIXED' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {item.choice === 'LOVE' ? '❤️ LOVE' :
                       item.choice === 'MIXED' ? '😐 MIXED' :
                       '😞 DISLIKE'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  {item.comment && (
                    <p className="text-sm text-muted-foreground italic">"{item.comment}"</p>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        )}
        {tab === "sync" && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">🧪 Diagnostic Contacts</h2>
              <p className="text-muted-foreground">
                Vérifiez et réparez les contacts manquants après acceptation de demandes
              </p>
            </div>

            {loading ? (
              <Card className="p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </Card>
            ) : (
              <>
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">État actuel</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Demandes acceptées sans contact</p>
                        <p className="text-3xl font-bold mt-1">{missingContacts}</p>
                      </div>
                      <div className={`text-2xl ${missingContacts === 0 ? 'text-green-500' : 'text-orange-500'}`}>
                        {missingContacts === 0 ? '✅' : '⚠️'}
                      </div>
                    </div>

                    {lastSyncResult && (
                      <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          ✅ Dernière synchronisation réussie
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          <strong>{lastSyncResult.contacts_created}</strong> contacts créés
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          {lastSyncResult.total_accepted_requests} demandes acceptées · 
                          {lastSyncResult.contacts_before} → {lastSyncResult.contacts_after} contacts au total
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Actions</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Resynchroniser tous les contacts depuis les demandes acceptées
                      </p>
                      <Button 
                        onClick={resyncContacts}
                        disabled={syncing}
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        {syncing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resynchronisation...
                          </>
                        ) : (
                          '🔄 Resynchroniser les contacts'
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );
}
