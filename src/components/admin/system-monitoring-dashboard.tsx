import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  useSystemHealth, 
  useReplicationStatus, 
  useSystemMaintenance 
} from '@/hooks/use-system-monitoring';
import { Loader2, RefreshCw, Database, Users, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function SystemMonitoringDashboard() {
  const { 
    metrics: healthMetrics, 
    loading: healthLoading, 
    error: healthError, 
    refreshMetrics 
  } = useSystemHealth();

  const { 
    metrics: replicationMetrics, 
    loading: replicationLoading, 
    error: replicationError, 
    triggerReplication, 
    refreshStatus 
  } = useReplicationStatus();

  const { 
    loading: maintenanceLoading, 
    cleanupRequestLogs, 
    cleanupProcessedOutbox 
  } = useSystemMaintenance();

  const handleTriggerReplication = async () => {
    const success = await triggerReplication();
    if (success) {
      toast.success('Réplication déclenchée avec succès');
    } else {
      toast.error('Erreur lors du déclenchement de la réplication');
    }
  };

  const handleCleanupLogs = async () => {
    const count = await cleanupRequestLogs(30);
    if (count !== null) {
      toast.success(`${count} logs de requêtes nettoyés`);
      refreshMetrics();
    } else {
      toast.error('Erreur lors du nettoyage des logs');
    }
  };

  const handleCleanupOutbox = async () => {
    const count = await cleanupProcessedOutbox(24);
    if (count !== null) {
      toast.success(`${count} éléments outbox nettoyés`);
      refreshMetrics();
    } else {
      toast.error('Erreur lors du nettoyage de l\'outbox');
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getOutboxStatus = (pendingItems: number, oldestPending: number | null) => {
    if (pendingItems === 0) {
      return { color: 'success', text: 'Synchronisé' };
    }
    if (oldestPending && oldestPending > 300) { // > 5 minutes
      return { color: 'destructive', text: 'Retard critique' };
    }
    if (oldestPending && oldestPending > 60) { // > 1 minute
      return { color: 'warning', text: 'Retard modéré' };
    }
    return { color: 'default', text: 'En cours' };
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Monitoring Système Pliiiz</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={healthLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${healthLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* System Health Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Métriques de Santé du Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthLoading && !healthMetrics ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Chargement des métriques...
            </div>
          ) : healthError ? (
            <div className="text-red-500 py-4">
              Erreur: {healthError}
            </div>
          ) : healthMetrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{healthMetrics.total_users}</div>
                <div className="text-sm text-muted-foreground">Utilisateurs</div>
              </div>
              
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{healthMetrics.recent_signups_24h}</div>
                <div className="text-sm text-muted-foreground">Inscriptions 24h</div>
              </div>
              
              <div className="text-center">
                <AlertTriangle className={`h-8 w-8 mx-auto mb-2 ${
                  healthMetrics.pending_outbox_items > 0 ? 'text-orange-500' : 'text-green-500'
                }`} />
                <div className="text-2xl font-bold">{healthMetrics.pending_outbox_items}</div>
                <div className="text-sm text-muted-foreground">Items en attente</div>
              </div>
              
              <div className="text-center">
                <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{healthMetrics.request_log_size}</div>
                <div className="text-sm text-muted-foreground">Logs requêtes</div>
              </div>
            </div>
          ) : null}
          
          {healthMetrics && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">État de la réplication</div>
                  <div className="text-sm text-muted-foreground">
                    {healthMetrics.pending_outbox_items > 0 ? (
                      <>
                        Plus ancien élément: {formatDuration(healthMetrics.oldest_pending_outbox)}
                        <Badge 
                          variant={getOutboxStatus(
                            healthMetrics.pending_outbox_items, 
                            healthMetrics.oldest_pending_outbox
                          ).color as any}
                          className="ml-2"
                        >
                          {getOutboxStatus(
                            healthMetrics.pending_outbox_items, 
                            healthMetrics.oldest_pending_outbox
                          ).text}
                        </Badge>
                      </>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Synchronisé
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTriggerReplication}
                  disabled={replicationLoading}
                >
                  {replicationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Forcer la réplication
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Replication Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Métriques de Réplication</CardTitle>
        </CardHeader>
        <CardContent>
          {replicationLoading && replicationMetrics.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Chargement des métriques de réplication...
            </div>
          ) : replicationError ? (
            <div className="text-red-500 py-4">
              Erreur: {replicationError}
            </div>
          ) : (
            <div className="space-y-2">
              {replicationMetrics.map((metric) => (
                <div key={metric.metric_name} className="flex justify-between items-center p-2 rounded bg-muted">
                  <span className="font-medium">{metric.metric_name}</span>
                  <span className="font-mono">{metric.metric_value}</span>
                </div>
              ))}
              {replicationMetrics.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Aucune métrique de réplication disponible
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Outils de Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Nettoyer les logs de requêtes</div>
                <div className="text-sm text-muted-foreground">
                  Supprime les logs de plus de 30 jours
                  {healthMetrics && (
                    <span className="ml-2">
                      (actuellement {healthMetrics.request_log_size} logs)
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanupLogs}
                disabled={maintenanceLoading}
              >
                {maintenanceLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Nettoyer
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Nettoyer l'outbox traité</div>
                <div className="text-sm text-muted-foreground">
                  Supprime les éléments traités de plus de 24h
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanupOutbox}
                disabled={maintenanceLoading}
              >
                {maintenanceLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Nettoyer
              </Button>
            </div>

            {healthMetrics?.last_request_log_cleanup && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm">
                  <strong>Dernier nettoyage:</strong> {healthMetrics.last_request_log_cleanup} logs supprimés
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}