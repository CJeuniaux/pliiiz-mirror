import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface JobStats {
  total: number;
  processed: number;
  success: number;
  failed: number;
  ai_generated: number;
  unsplash_generated: number;
  avg_confidence: number;
}

interface RegenJob {
  id: string;
  job_type: string;
  status: string;
  total_items: number;
  processed_items: number;
  success_items: number;
  failed_items: number;
  force_regen: boolean;
  error_log: any[];
  stats: any;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export function useGiftRegenJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState<RegenJob | null>(null);

  const startRegeneration = useCallback(async (forceRegen = true): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('regenerate-gift-images', {
        body: {
          action: 'start_regeneration',
          force_regen: forceRegen
        }
      });

      if (fnError) {
        console.error('Error calling regenerate-gift-images:', fnError);
        setError('Failed to start regeneration process');
        return null;
      }

      if (data?.jobId) {
        pollJobStatus(data.jobId);
        return data.jobId;
      }

      return null;
    } catch (err) {
      console.error('Error starting regeneration:', err);
      setError('An error occurred while starting the regeneration process');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const retryFailedJob = useCallback(async (failedJobId: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('regenerate-gift-images', {
        body: {
          action: 'retry_failed',
          jobId: failedJobId
        }
      });

      if (fnError) {
        console.error('Error retrying failed job:', fnError);
        setError('Failed to retry job');
        return null;
      }

      if (data?.jobId) {
        pollJobStatus(data.jobId);
        return data.jobId;
      }

      return null;
    } catch (err) {
      console.error('Error retrying failed job:', err);
      setError('An error occurred while retrying the job');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const startTest = useCallback(async (): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('regenerate-gift-images', {
        body: { action: 'start_test' }
      });
      if (fnError) {
        console.error('Error starting test job:', fnError);
        setError('Failed to start test job');
        return null;
      }
      if (data?.jobId) {
        pollJobStatus(data.jobId);
        return data.jobId;
      }
      return null;
    } catch (err) {
      console.error('Error starting test:', err);
      setError('An error occurred while starting the test job');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getJobStatus = useCallback(async (jobId: string): Promise<RegenJob | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('regenerate-gift-images', {
        body: {
          action: 'job_status',
          jobId
        }
      });

      if (fnError) {
        console.error('Error getting job status:', fnError);
        return null;
      }

      return data?.job || null;
    } catch (err) {
      console.error('Error fetching job status:', err);
      return null;
    }
  }, []);

  const pollJobStatus = useCallback(async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      const job = await getJobStatus(jobId);
      if (job) {
        setCurrentJob(job);
        
        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(pollInterval);
          setLoading(false);
          console.log(`Job ${jobId} terminé avec le statut: ${job.status}`);
        }
      }
    }, 2000); // Poll every 2 seconds for faster updates

    // Stop polling after 30 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setLoading(false);
    }, 30 * 60 * 1000);
  }, [getJobStatus]);

  const getRecentJobs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gift_regen_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent jobs:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching recent jobs:', err);
      return [];
    }
  }, []);

const getGiftIdeasStats = useCallback(async () => {
  try {
    const { data, error: fnError } = await supabase.functions.invoke('regenerate-gift-images', {
      body: { action: 'get_stats' }
    });
    if (fnError) {
      console.error('Error fetching stats:', fnError);
      return null;
    }
    return data?.stats || null;
  } catch (err) {
    console.error('Error calculating stats:', err);
    return null;
  }
}, []);

  return {
    startRegeneration,
    startTest,
    retryFailedJob,
    getJobStatus,
    getRecentJobs,
    getGiftIdeasStats,
    loading,
    error,
    currentJob,
    setCurrentJob
  };
}