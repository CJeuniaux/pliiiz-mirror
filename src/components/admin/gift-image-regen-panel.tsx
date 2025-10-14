import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Package, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function GiftImageRegenPanel() {
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  const handleStartRegen = async (isTest: boolean = false) => {
    setLoading(true);
    setStats(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-gift-images', {
        body: { 
          action: isTest ? 'start_test' : 'start_regeneration',
          force_regen: true 
        }
      });

      if (error) throw error;

      setJobId(data.jobId);
      toast({
        title: isTest ? "Test lancé" : "Régénération lancée",
        description: `Job ID: ${data.jobId}`,
      });

      // Poll job status
      pollJobStatus(data.jobId);
    } catch (error: any) {
      console.error('Error starting regeneration:', error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pollJobStatus = async (currentJobId: string) => {
    const interval = setInterval(async () => {
      try {
        // Query job status directly from database
        const { data: job, error } = await supabase
          .from('gift_regen_jobs')
          .select('*')
          .eq('id', currentJobId)
          .single();

        if (error) {
          console.error('Error fetching job status:', error);
          clearInterval(interval);
          return;
        }

        if (!job) {
          clearInterval(interval);
          return;
        }

        setStats(job);

        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(interval);
          toast({
            title: job.status === 'completed' ? "✅ Terminé" : "❌ Échec",
            description: `${job.success_items} réussites / ${job.failed_items} échecs sur ${job.total_items} items`,
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(interval);
      }
    }, 2000); // Poll every 2 seconds

    // Store interval ID to clean up on unmount
    return interval;
  };

  const handleCheckPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from('gift_idea_unsplash')
        .select('*', { count: 'exact', head: true })
        .eq('image_status', 'pending_regen');

      if (error) throw error;

      toast({
        title: "Images en attente",
        description: `${count} images marquées pour régénération`,
      });
    } catch (error: any) {
      console.error('Error checking count:', error);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Package className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Gift Ideas Images</h3>
          <p className="text-sm text-muted-foreground">
            Régénération avec nouveau mapping taxonomy détaillé
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => handleStartRegen(false)}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Régénérer TOUTES les images
        </Button>

        <Button
          onClick={() => handleStartRegen(true)}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          Test (10 images)
        </Button>

        <Button
          onClick={handleCheckPendingCount}
          disabled={loading}
          variant="outline"
        >
          Vérifier en attente
        </Button>
      </div>

      {/* Progress Stats */}
      {stats && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Progression</h4>
            <Badge variant={stats.status === 'completed' ? 'default' : 'secondary'}>
              {stats.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-lg font-semibold">{stats.total_items || 0}</div>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground">Traités</div>
              <div className="text-lg font-semibold">{stats.processed_items || 0}</div>
            </div>
            
            <div className="p-3 bg-green-500/10 rounded-lg">
              <div className="text-xs text-green-700">Succès</div>
              <div className="text-lg font-semibold text-green-700">{stats.success_items || 0}</div>
            </div>
            
            <div className="p-3 bg-red-500/10 rounded-lg">
              <div className="text-xs text-red-700">Échecs</div>
              <div className="text-lg font-semibold text-red-700">{stats.failed_items || 0}</div>
            </div>
          </div>

          {stats.status === 'running' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Régénération en cours...
            </div>
          )}

          {stats.status === 'completed' && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              Régénération terminée !
            </div>
          )}

          {/* Error Log */}
          {stats.error_log && Array.isArray(stats.error_log) && stats.error_log.length > 0 && (
            <div className="mt-4 space-y-2">
              <h5 className="text-sm font-medium text-red-700">Détails des échecs ({stats.error_log.length})</h5>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {stats.error_log.map((error: any, index: number) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-xs">
                    <div className="font-medium text-red-900">{error.idea}</div>
                    <div className="text-red-700 mt-1">{error.error}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>✓ Utilise le nouveau système de taxonomy</p>
        <p>✓ Génère des queries Unsplash précises avec keywords + exclusions</p>
        <p>✓ Calcule un score de confiance par tag</p>
        <p>✓ Traite les images par batch avec rate limiting</p>
      </div>
    </Card>
  );
}