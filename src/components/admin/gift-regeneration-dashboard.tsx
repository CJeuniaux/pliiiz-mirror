import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Play, Eye, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useGiftRegenJob } from '@/hooks/use-gift-regen-job';
import { toast } from '@/hooks/use-toast';
import { GiftRegenTestLauncher } from './gift-regen-test-launcher';

export function GiftRegenerationDashboard() {
  const {
    startRegeneration,
    getRecentJobs,
    getGiftIdeasStats,
    loading,
    error,
    currentJob,
    setCurrentJob
  } = useGiftRegenJob();

  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [giftStats, setGiftStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [jobs, stats] = await Promise.all([
        getRecentJobs(),
        getGiftIdeasStats()
      ]);
      setRecentJobs(jobs);
      setGiftStats(stats);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Refresh stats when a running job finishes
  useEffect(() => {
    if (currentJob && (currentJob.status === 'completed' || currentJob.status === 'failed')) {
      console.log('Job terminé, rafraîchissement des données...');
      setTimeout(() => loadData(), 1000); // Petit délai pour que la DB soit à jour
    }
  }, [currentJob?.status, loadData]);

  const handleStartRegeneration = async () => {
    const confirm = window.confirm(
      '⚠️ Vous êtes sur le point de lancer une régénération complète de tous les visuels de Gift Ideas. Cette opération peut prendre plusieurs minutes et consommer des crédits API. Continuer ?'
    );

    if (!confirm) return;

    const jobId = await startRegeneration(true);
    if (jobId) {
      toast({
        title: "🚀 Régénération lancée",
        description: `Job ${jobId} démarré avec succès`,
      });
      // Refresh data after starting
      setTimeout(loadData, 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Terminé</Badge>;
      case 'running':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En cours</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Échec</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Régénération des Visuels Gift Ideas</h1>
          <p className="text-muted-foreground mt-2">
            Système de régénération automatique utilisant la base sémantique intégrée
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button 
            onClick={handleStartRegeneration}
            disabled={loading || (currentJob && currentJob.status === 'running')}
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="w-4 h-4 mr-2" />
            Lancer la régénération complète
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="jobs">Jobs de régénération</TabsTrigger>
          <TabsTrigger value="stats">Statistiques détaillées</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Gift Ideas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{giftStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {giftStats?.auto_generated || 0} auto-générées, {giftStats?.user_uploaded || 0} utilisateur
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Visuels v2</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{giftStats?.v2_generated || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Nouvelle base sémantique
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Confiance moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {giftStats?.avg_confidence ? (giftStats.avg_confidence * 100).toFixed(1) + '%' : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {giftStats?.low_confidence || 0} faible confiance
                </p>
              </CardContent>
            </Card>

            <div className="md:row-span-2">
              <GiftRegenTestLauncher />
            </div>
          </div>

          {currentJob && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Job en cours: {currentJob.id}
                </CardTitle>
                <CardDescription>
                  Statut: {currentJob.status} · Démarré le {new Date(currentJob.started_at).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>{currentJob.processed_items} / {currentJob.total_items}</span>
                  </div>
                  <Progress 
                    value={(currentJob.processed_items / Math.max(currentJob.total_items, 1)) * 100} 
                    className="w-full" 
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-green-600">{currentJob.success_items}</div>
                    <div className="text-muted-foreground">Succès</div>
                  </div>
                  <div>
                    <div className="font-medium text-red-600">{currentJob.failed_items}</div>
                    <div className="text-muted-foreground">Échecs</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-600">
                      {currentJob.force_regen ? 'Force' : 'Normal'}
                    </div>
                    <div className="text-muted-foreground">Mode</div>
                  </div>
                </div>

                {Array.isArray(currentJob.error_log) && currentJob.error_log.length > 0 && (
                  <div className="border rounded p-3 max-h-48 overflow-y-auto bg-muted/30">
                    <div className="text-sm font-medium mb-2">Logs en temps réel</div>
                    <div className="space-y-1 text-xs font-mono text-muted-foreground">
                      {currentJob.error_log.slice(-50).map((line: string, i: number) => (
                        <div key={i}>• {line}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Jobs</CardTitle>
              <CardDescription>
                Les 10 derniers jobs de régénération
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentJobs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucun job de régénération trouvé
                  </p>
                ) : (
                  recentJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusBadge(job.status)}
                          <span className="font-mono text-sm text-muted-foreground">
                            {job.id.slice(0, 8)}...
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(job.started_at, job.completed_at)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">{job.total_items}</div>
                          <div className="text-muted-foreground">Total</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-600">{job.success_items}</div>
                          <div className="text-muted-foreground">Succès</div>
                        </div>
                        <div>
                          <div className="font-medium text-red-600">{job.failed_items}</div>
                          <div className="text-muted-foreground">Échecs</div>
                        </div>
                        <div>
                          <div className="font-medium">
                            {job.force_regen ? '🔄 Force' : '📊 Normal'}
                          </div>
                          <div className="text-muted-foreground">Mode</div>
                        </div>
                      </div>

                      {job.stats && Object.keys(job.stats).length > 0 && (
                        <div className="bg-muted/50 rounded p-3 text-sm">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <span className="font-medium">IA:</span> {job.stats.ai_generated || 0}
                            </div>
                            <div>
                              <span className="font-medium">Unsplash:</span> {job.stats.unsplash_generated || 0}
                            </div>
                            <div>
                              <span className="font-medium">Confiance moy:</span> {
                                job.stats.avg_confidence ? (job.stats.avg_confidence * 100).toFixed(1) + '%' : 'N/A'
                              }
                            </div>
                          </div>
                        </div>
                      )}

                      {job.error_log && job.error_log.length > 0 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-red-600 hover:text-red-800">
                            {job.error_log.length} erreur(s) - Cliquer pour voir
                          </summary>
                          <div className="mt-2 bg-red-50 p-2 rounded text-red-800 max-h-32 overflow-y-auto">
                            {job.error_log.slice(0, 5).map((error: string, index: number) => (
                              <div key={index} className="text-xs mb-1">• {error}</div>
                            ))}
                            {job.error_log.length > 5 && (
                              <div className="text-xs">... et {job.error_log.length - 5} autres</div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par source</CardTitle>
              </CardHeader>
              <CardContent>
                {giftStats && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Images IA</span>
                      <Badge variant="secondary">{giftStats.ai_source}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Images Unsplash</span>
                      <Badge variant="secondary">{giftStats.unsplash_source}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Images utilisateur</span>
                      <Badge variant="outline">{giftStats.user_uploaded}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Qualité des visuels</CardTitle>
              </CardHeader>
              <CardContent>
                {giftStats && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Confiance moyenne</span>
                      <Badge variant="default">
                        {(giftStats.avg_confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Faible confiance (&lt;50%)</span>
                      <Badge variant={giftStats.low_confidence > 0 ? "destructive" : "secondary"}>
                        {giftStats.low_confidence}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Version v2 (nouvelle base)</span>
                      <Badge variant="default">{giftStats.v2_generated}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métriques de performance</CardTitle>
              <CardDescription>
                Indicateurs clés pour évaluer la qualité de la régénération
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {giftStats ? ((giftStats.v2_generated / Math.max(giftStats.total, 1)) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Migration v2</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {giftStats ? ((giftStats.ai_source / Math.max(giftStats.auto_generated, 1)) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Taux IA</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    {giftStats ? ((giftStats.unsplash_source / Math.max(giftStats.auto_generated, 1)) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Taux Unsplash</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-orange-600">
                    {giftStats ? ((giftStats.low_confidence / Math.max(giftStats.total, 1)) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">À revoir</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}