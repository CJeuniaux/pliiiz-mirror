import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SystemHealthMetrics {
  total_users: number;
  recent_signups_24h: number;
  pending_outbox_items: number;
  oldest_pending_outbox: number | null;
  request_log_size: number;
  last_request_log_cleanup: string | null;
  timestamp: number;
}

export interface ReplicationMetrics {
  metric_name: string;
  metric_value: number;
  updated_at: string;
}

// Hook pour monitorer l'état du système
export function useSystemHealth() {
  const [metrics, setMetrics] = useState<SystemHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase
        .rpc('get_system_health_metrics');

      if (rpcError) {
        console.error('[SystemHealth] RPC error:', rpcError);
        throw rpcError;
      }

      setMetrics(data as unknown as SystemHealthMetrics);
      setError(null);
    } catch (err: any) {
      console.error('[SystemHealth] Error:', err);
      setError(err.message || 'Failed to fetch system health');
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = () => {
    fetchMetrics();
  };

  useEffect(() => {
    fetchMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return { metrics, loading, error, refreshMetrics };
}

// Hook pour monitorer la réplication
export function useReplicationStatus() {
  const [metrics, setMetrics] = useState<ReplicationMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReplicationStatus = async () => {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase
        .rpc('get_replication_status');

      if (rpcError) {
        console.error('[ReplicationStatus] RPC error:', rpcError);
        throw rpcError;
      }

      setMetrics((data as unknown as ReplicationMetrics[]) || []);
      setError(null);
    } catch (err: any) {
      console.error('[ReplicationStatus] Error:', err);
      setError(err.message || 'Failed to fetch replication status');
    } finally {
      setLoading(false);
    }
  };

  const triggerReplication = async (): Promise<boolean> => {
    try {
      const { error: fnError } = await supabase.functions.invoke('profile-replication-worker', {
        body: { force: true }
      });

      if (fnError) {
        console.error('[ReplicationStatus] Trigger error:', fnError);
        throw fnError;
      }

      // Refresh metrics after triggering
      setTimeout(fetchReplicationStatus, 2000);
      return true;
    } catch (err: any) {
      console.error('[ReplicationStatus] Trigger failed:', err);
      return false;
    }
  };

  const refreshStatus = () => {
    fetchReplicationStatus();
  };

  useEffect(() => {
    fetchReplicationStatus();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchReplicationStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return { 
    metrics, 
    loading, 
    error, 
    triggerReplication, 
    refreshStatus 
  };
}

// Hook pour nettoyer les anciens logs
export function useSystemMaintenance() {
  const [loading, setLoading] = useState(false);

  const cleanupRequestLogs = async (olderThanDays: number = 30): Promise<number | null> => {
    try {
      setLoading(true);
      console.log(`[SystemMaintenance] Cleaning up request logs older than ${olderThanDays} days`);

      const { data, error: rpcError } = await supabase
        .rpc('cleanup_old_request_logs', {
          older_than_days: olderThanDays
        });

      if (rpcError) {
        console.error('[SystemMaintenance] Cleanup error:', rpcError);
        throw rpcError;
      }

      console.log(`[SystemMaintenance] Cleaned up ${data} request logs`);
      return data as number;
    } catch (err: any) {
      console.error('[SystemMaintenance] Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cleanupProcessedOutbox = async (olderThanHours: number = 24): Promise<number | null> => {
    try {
      setLoading(true);
      console.log(`[SystemMaintenance] Cleaning up processed outbox items older than ${olderThanHours} hours`);

      const { data, error: rpcError } = await supabase
        .rpc('cleanup_processed_outbox', {
          older_than_hours: olderThanHours
        });

      if (rpcError) {
        console.error('[SystemMaintenance] Outbox cleanup error:', rpcError);
        throw rpcError;
      }

      console.log(`[SystemMaintenance] Cleaned up ${data} outbox items`);
      return data as number;
    } catch (err: any) {
      console.error('[SystemMaintenance] Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { 
    loading, 
    cleanupRequestLogs, 
    cleanupProcessedOutbox 
  };
}