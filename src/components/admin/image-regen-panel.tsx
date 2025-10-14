import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Image, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAvatarRegen } from '@/hooks/use-avatar-regen';
import { Badge } from '@/components/ui/badge';

export function ImageRegenPanel() {
  const { loading, lastResults, regenerateBatch, getActiveJobs } = useAvatarRegen();
  const [jobs, setJobs] = useState<any[]>([]);

  const handleBatchRegen = async () => {
    await regenerateBatch();
    // Rafraîchir les jobs
    const activeJobs = await getActiveJobs();
    setJobs(activeJobs);
  };

  const handleCheckJobs = async () => {
    const activeJobs = await getActiveJobs();
    setJobs(activeJobs);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Image className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Images (CDN Transforms)</h3>
          <p className="text-sm text-muted-foreground">
            Cache-busting par hash de contenu • Placeholders BlurHash + couleur dominante
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleBatchRegen}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {loading ? 'Régénération...' : 'Régénérer Batch (50)'}
        </Button>

        <Button
          onClick={handleCheckJobs}
          variant="outline"
          disabled={loading}
        >
          Vérifier Jobs
        </Button>
      </div>

      {/* Résultats du dernier batch */}
      {lastResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Derniers résultats ({lastResults.length})</h4>
          <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
            {lastResults.map((result, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-xs"
              >
                {result.ok ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : result.error ? (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                )}
                
                <span className="font-mono truncate flex-1">{result.id.slice(0, 8)}</span>
                
                {result.ok && (
                  <Badge variant={result.changed ? 'default' : 'secondary'} className="text-xs">
                    {result.changed ? 'Modifié' : 'Inchangé'}
                  </Badge>
                )}
                
                {result.version !== undefined && (
                  <span className="text-muted-foreground">v{result.version}</span>
                )}
                
                {result.error && (
                  <span className="text-red-500 text-xs truncate">{result.error}</span>
                )}
                
                {result.skipped && (
                  <span className="text-yellow-600 text-xs">{result.skipped}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jobs actifs */}
      {jobs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Jobs actifs ({jobs.length})</h4>
          <div className="space-y-1">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className="flex items-center gap-2 p-2 bg-blue-500/10 rounded text-xs"
              >
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="font-mono">{job.profile_id.slice(0, 8)}</span>
                <Badge variant="outline">{job.status}</Badge>
                {job.attempts > 0 && (
                  <span className="text-muted-foreground">Tentatives: {job.attempts}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>✓ Pas de stockage de dérivés (CDN on-the-fly)</p>
        <p>✓ Cache-busting déterministe (SHA1)</p>
        <p>✓ BlurHash + couleur dominante pour LQIP</p>
        <p>✓ Idempotent & concurrent-safe</p>
      </div>
    </Card>
  );
}
