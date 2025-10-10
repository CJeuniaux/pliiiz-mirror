import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Play, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReplicationMetrics {
  replicated_ok: number;
  replicated_fail: number;
  reconciliation_runs: number;
  outbox_size: number;
}

interface ReplicationStatus {
  processing: boolean;
  lastRun?: string;
  metrics: ReplicationMetrics;
  errors: string[];
}

export function ReplicationMonitor() {
  const [status, setStatus] = useState<ReplicationStatus>({
    processing: false,
    metrics: {
      replicated_ok: 0,
      replicated_fail: 0,
      reconciliation_runs: 0,
      outbox_size: 0
    },
    errors: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_replication_status');
      if (error) throw error;

      const metrics = data.reduce((acc: any, row: any) => {
        acc[row.metric_name] = row.metric_value;
        return acc;
      }, {});

      setStatus(prev => ({
        ...prev,
        metrics: {
          replicated_ok: metrics.replicated_ok || 0,
          replicated_fail: metrics.replicated_fail || 0,
          reconciliation_runs: metrics.reconciliation_runs || 0,
          outbox_size: metrics.outbox_size || 0
        }
      }));
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const runWorker = async (reconcile = false) => {
    setLoading(true);
    setStatus(prev => ({ ...prev, processing: true, errors: [] }));

    try {
      const { data, error } = await supabase.functions.invoke('profile-replication-worker', {
        body: { batchSize: 100, reconcile }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          reconcile 
            ? `Réconciliation terminée: ${data.processed} profils traités`
            : `Worker terminé: ${data.processed} éléments traités`
        );
        
        if (data.errors && data.errors.length > 0) {
          setStatus(prev => ({ 
            ...prev, 
            errors: data.errors,
            lastRun: new Date().toISOString()
          }));
        } else {
          setStatus(prev => ({ 
            ...prev, 
            lastRun: new Date().toISOString()
          }));
        }
      } else {
        throw new Error(data.error || 'Worker failed');
      }
    } catch (error: any) {
      console.error('Worker failed:', error);
      toast.error(`Erreur: ${error.message}`);
      setStatus(prev => ({ 
        ...prev, 
        errors: [error.message]
      }));
    } finally {
      setLoading(false);
      setStatus(prev => ({ ...prev, processing: false }));
      loadMetrics(); // Refresh metrics after processing
    }
  };

  const cleanupOutbox = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('cleanup_processed_outbox', { older_than_hours: 24 });
      if (error) throw error;

      toast.success(`${data} anciens éléments supprimés de l'outbox`);
      loadMetrics();
    } catch (error: any) {
      console.error('Cleanup failed:', error);
      toast.error(`Erreur de nettoyage: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (status.metrics.outbox_size > 100) return 'destructive';
    if (status.metrics.replicated_fail > status.metrics.replicated_ok * 0.1) return 'destructive';
    if (status.metrics.outbox_size > 0) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Moniteur de Réplication</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={loadMetrics}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${
              status.processing ? 'bg-yellow-500 animate-pulse' :
              status.metrics.outbox_size === 0 ? 'bg-green-500' : 'bg-orange-500'
            }`} />
            État de la Réplication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {status.metrics.replicated_ok}
              </div>
              <div className="text-sm text-muted-foreground">Répliqués OK</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {status.metrics.replicated_fail}
              </div>
              <div className="text-sm text-muted-foreground">Échecs</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {status.metrics.outbox_size}
              </div>
              <div className="text-sm text-muted-foreground">En attente</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {status.metrics.reconciliation_runs}
              </div>
              <div className="text-sm text-muted-foreground">Réconciliations</div>
            </div>
          </div>

          {status.lastRun && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Dernière exécution: {new Date(status.lastRun).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => runWorker(false)}
              disabled={loading || status.processing}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Traiter l'Outbox
              {status.metrics.outbox_size > 0 && (
                <Badge variant={getStatusColor()} className="ml-2">
                  {status.metrics.outbox_size}
                </Badge>
              )}
            </Button>

            <Button
              onClick={() => runWorker(true)}
              disabled={loading || status.processing}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Réconciliation Complète
            </Button>

            <Button
              onClick={cleanupOutbox}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Nettoyer l'Outbox
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {status.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Erreurs détectées:</div>
            <ul className="mt-2 space-y-1">
              {status.errors.map((error, index) => (
                <li key={index} className="text-sm">• {error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>État de Santé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Taille de l'outbox</span>
              <div className="flex items-center gap-2">
                {status.metrics.outbox_size === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : status.metrics.outbox_size > 100 ? (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                ) : (
                  <Clock className="h-5 w-5 text-orange-500" />
                )}
                <Badge variant={getStatusColor()}>
                  {status.metrics.outbox_size} éléments
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span>Taux d'erreur</span>
              <div className="flex items-center gap-2">
                {status.metrics.replicated_fail === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                )}
                <Badge variant={status.metrics.replicated_fail === 0 ? 'default' : 'secondary'}>
                  {status.metrics.replicated_ok + status.metrics.replicated_fail > 0 
                    ? Math.round((status.metrics.replicated_fail / (status.metrics.replicated_ok + status.metrics.replicated_fail)) * 100)
                    : 0}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}