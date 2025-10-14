import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { CheckCircle2, XCircle, RefreshCw, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  id: string;
  label: string;
  ok: boolean | null;
  detail?: string;
  rawError?: string;
}

export default function Diagnostic() {
  const { user, session } = useAuth();
  const [results, setResults] = useState<TestResult[]>([
    { id: 'session', label: 'Connexion au compte', ok: null },
    { id: 'profiles', label: 'Accès à mon profil', ok: null },
    { id: 'connections', label: 'Accès à mes contacts', ok: null },
    { id: 'preferences', label: 'Accès à mes préférences', ok: null },
    { id: 'mutation', label: 'Test d\'enregistrement', ok: null },
  ]);
  const [userId, setUserId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [showExpert, setShowExpert] = useState(false);

  const allOk = useMemo(
    () => results.every(r => r.ok === true),
    [results]
  );

  const firstError = useMemo(
    () => results.find(r => r.ok === false),
    [results]
  );

  const updateResult = (id: string, patch: Partial<TestResult>) => {
    setResults(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));
  };

  const runTests = async () => {
    setRunning(true);
    setResults(rs => rs.map(r => ({ ...r, ok: null, detail: '', rawError: '' })));

    // 1) Session
    const sessionRes = await supabase.auth.getSession();
    const currentSession = sessionRes.data.session;

    if (!currentSession) {
      updateResult('session', {
        ok: false,
        detail: 'Vous n\'êtes pas connecté(e).',
      });
      // Les autres tests n'ont pas de sens si pas de session
      ['profiles', 'connections', 'preferences', 'mutation'].forEach(id =>
        updateResult(id, { ok: false, detail: 'Connectez-vous pour tester.' })
      );
      setUserId(null);
      setRunning(false);
      return;
    }

    setUserId(currentSession.user.id);
    updateResult('session', {
      ok: true,
      detail: `Compte connecté (${currentSession.user.email ?? 'utilisateur'})`
    });

    // Helper pour exécuter un test
    const test = async (
      id: string,
      exec: () => Promise<{ ok: boolean; detail?: string }>
    ) => {
      try {
        const { ok, detail } = await exec();
        updateResult(id, { ok, detail: detail ?? (ok ? 'OK' : 'Échec') });
      } catch (e: any) {
        const errorMsg = e?.message ?? String(e);
        
        // Détection spécifique de l'erreur global_preferences
        let userDetail = 'Accès bloqué';
        if (errorMsg.includes('global_preferences') || errorMsg.includes('has no field')) {
          userDetail = 'Échec d\'enregistrement (trigger obsolète). Un correctif a été déployé, merci de réessayer. Si le problème persiste, signalez ce message au support.';
        }
        
        updateResult(id, {
          ok: false,
          detail: userDetail,
          rawError: errorMsg,
        });
      }
    };

    // 2) SELECT profiles
    await test('profiles', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentSession.user.id)
        .maybeSingle();
      if (error) throw error;
      return { ok: true, detail: data ? 'Profil accessible' : 'Profil non trouvé' };
    });

    // 3) SELECT connections
    await test('connections', async () => {
      const { data, error } = await supabase
        .from('connections')
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      return { ok: true, detail: 'Contacts accessibles' };
    });

    // 4) SELECT preferences
    await test('preferences', async () => {
      const { data, error } = await supabase
        .from('preferences')
        .select('user_id')
        .eq('user_id', currentSession.user.id)
        .maybeSingle();
      if (error) throw error;
      return {
        ok: true,
        detail: data ? 'Préférences trouvées' : 'Pas encore de préférences — c\'est normal'
      };
    });

    // 5) Mutation simulée (upsert préférences)
    await test('mutation', async () => {
      const { error } = await supabase
        .from('preferences')
        .upsert(
          { user_id: currentSession.user.id },
          { onConflict: 'user_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return { ok: true, detail: 'Enregistrement autorisé ✅' };
    });

    setRunning(false);
  };

  useEffect(() => {
    if (user) {
      runTests();
    }
  }, [user]);

  const copyReport = async () => {
    const lines = [
      `Diagnostic Pliiiz — ${new Date().toISOString()}`,
      `User: ${userId ?? 'N/A'}`,
      ...results.map(r =>
        `${r.ok ? '✅' : r.ok === false ? '❌' : '⏳'}  ${r.label} — ${r.detail ?? ''}${r.rawError ? ` | err=${r.rawError}` : ''}`
      )
    ].join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      toast.success('Rapport copié dans le presse-papier');
    } catch (error) {
      toast.error('Impossible de copier le rapport');
    }
  };

  if (!user || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-foreground">Non connecté</h1>
          <p className="text-muted-foreground mb-4">
            Vous devez être connecté pour accéder au diagnostic.
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-3xl py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Diagnostic Pliiiz</h1>
          <p className="text-muted-foreground">
            Vérifie que votre compte peut lire vos données et enregistrer vos préférences.
          </p>
        </div>

        {/* Verdict global */}
        <Card className={`p-5 mb-6 ${allOk ? 'border-green-500/50 bg-green-50/50' : 'border-orange-500/50 bg-orange-50/50'}`}>
          <div className="flex items-center gap-4">
            {allOk ? (
              <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-orange-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-bold text-lg text-foreground">
                {allOk ? 'Tout est OK' : 'Un point bloque l\'enregistrement ou l\'accès'}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {userId ? `ID utilisateur : ${userId}` : 'Non connecté'}
              </div>
            </div>
            <Button
              onClick={runTests}
              disabled={running}
              className="btn-orange"
            >
              {running ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-tester
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Conseils si erreur */}
        {firstError && (
          <Card className="p-5 mb-6 border-yellow-500/50 bg-yellow-50/50">
            <div className="font-bold mb-3 text-foreground">Que faire ?</div>
            <ul className="space-y-2 text-sm text-foreground/80 ml-5 list-disc">
              <li>Essayez de vous <strong>déconnecter</strong> puis de vous <strong>reconnecter</strong>.</li>
              <li>Revenez en arrière puis <strong>réessayez d'enregistrer</strong> vos préférences.</li>
              <li>Si ça persiste, <strong>copiez le rapport</strong> ci-dessous et envoyez-le au support.</li>
            </ul>
            <Button
              onClick={copyReport}
              variant="outline"
              className="mt-4"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copier le rapport
            </Button>
          </Card>
        )}

        {/* Liste des tests */}
        <div className="space-y-3 mb-6">
          {results.map(r => (
            <Card
              key={r.id}
              className={`p-4 ${
                r.ok === true
                  ? 'border-green-500/50 bg-green-50/30'
                  : r.ok === false
                  ? 'border-red-500/50 bg-red-50/30'
                  : 'border-gray-300/50 bg-gray-50/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {r.ok === true ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : r.ok === false ? (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                ) : (
                  <RefreshCw className="w-6 h-6 text-gray-400 flex-shrink-0 animate-spin" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground">{r.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {r.ok === null ? 'Test en cours...' : r.detail}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Mode expert */}
        <div className="mt-6">
          <button
            onClick={() => setShowExpert(s => !s)}
            className="text-sm text-primary hover:underline"
          >
            {showExpert ? 'Masquer le mode expert' : 'Afficher le mode expert'}
          </button>
          {showExpert && (
            <Card className="mt-3 p-4 bg-muted/50">
              <div className="font-semibold mb-2 text-foreground">Détails techniques</div>
              <pre className="text-xs whitespace-pre-wrap overflow-x-auto text-muted-foreground font-mono">
                {results.map(r => (r.rawError ? `[${r.id}] ${r.rawError}\n` : '')).join('') || 'Aucune erreur.'}
              </pre>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
