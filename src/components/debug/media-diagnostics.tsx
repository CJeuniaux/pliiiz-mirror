import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface MediaDiagnostic {
  user_id: string;
  display_name: string;
  uploads_count: number;
  public_uploads_count: number;
  uploads_with_path: number;
  media_in_profile: number;
  last_upload: string | null;
  sample_urls: string[];
}

export function MediaDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<MediaDiagnostic[]>([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      // 1. Métriques globales depuis app_meta
      const { data: metricsData } = await supabase
        .from('app_meta')
        .select('key, value, updated_at')
        .in('key', ['uploads_with_path_count', 'public_uploads_count', 'media_backfill_timestamp']);

      const metricsMap = (metricsData || []).reduce((acc: any, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
      setMetrics(metricsMap);

      // 2. Diagnostic par utilisateur (limité aux 20 premiers)
      const { data: usersData } = await supabase.rpc('get_public_profiles');
      
      if (!usersData) {
        console.warn('No public profiles found');
        setDiagnostics([]);
        return;
      }

      const diagnosticsPromises = usersData.slice(0, 20).map(async (user: any) => {
        // Compter les uploads
        const { count: totalUploads } = await supabase
          .from('user_uploads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.user_id);

        const { count: publicUploads } = await supabase
          .from('user_uploads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.user_id)
          .eq('is_public', true);

        const { count: uploadsWithPath } = await supabase
          .from('user_uploads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.user_id)
          .not('path', 'is', null);

        // Dernier upload
        const { data: lastUpload } = await supabase
          .from('user_uploads')
          .select('created_at')
          .eq('user_id', user.user_id)
          .order('created_at', { ascending: false })
          .limit(1);

        // URLs échantillon (3 premières)
        const { data: sampleUploads } = await supabase
          .from('user_uploads')
          .select('url, path')
          .eq('user_id', user.user_id)
          .eq('is_public', true)
          .not('path', 'is', null)
          .limit(3);

        const sampleUrls = (sampleUploads || []).map(u => 
          u.path ? `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/user-uploads/${u.path}` : u.url
        );

        return {
          user_id: user.user_id,
          display_name: user.display_name || 'Utilisateur',
          uploads_count: totalUploads || 0,
          public_uploads_count: publicUploads || 0,
          uploads_with_path: uploadsWithPath || 0,
          media_in_profile: user.media?.length || 0,
          last_upload: lastUpload?.[0]?.created_at || null,
          sample_urls: sampleUrls
        };
      });

      const results = await Promise.all(diagnosticsPromises);
      setDiagnostics(results);

    } catch (error) {
      console.error('Diagnostic error:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceReplication = async () => {
    try {
      await supabase.functions.invoke('profile-replication-worker', {
        body: { batchSize: 10 }
      });
      alert('Réplication forcée déclenchée');
    } catch (error) {
      console.error('Force replication error:', error);
      alert('Erreur lors de la réplication');
    }
  };

  const getStatusIcon = (diag: MediaDiagnostic) => {
    if (diag.uploads_count === 0) return <Badge variant="secondary">Aucun upload</Badge>;
    if (diag.uploads_with_path === 0) return <XCircle className="h-4 w-4 text-destructive" />;
    if (diag.media_in_profile === 0) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <CheckCircle className="h-4 w-4 text-success" />;
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Diagnostics Media Upload → Profils Publics
            <Button
              onClick={runDiagnostics}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Analyser
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.uploads_with_path_count || '0'}</div>
                <div className="text-sm text-muted-foreground">Uploads avec path</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.public_uploads_count || '0'}</div>
                <div className="text-sm text-muted-foreground">Uploads publics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {metrics.media_backfill_timestamp 
                    ? new Date(parseInt(metrics.media_backfill_timestamp) * 1000).toLocaleDateString()
                    : 'Jamais'
                  }
                </div>
                <div className="text-sm text-muted-foreground">Dernier backfill</div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <Button onClick={forceReplication} variant="outline" size="sm">
              Forcer Réplication
            </Button>
          </div>

          {diagnostics.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">État par utilisateur (20 premiers)</h4>
              {diagnostics.map((diag) => (
                <div key={diag.user_id} className="flex items-center gap-4 p-3 border rounded">
                  {getStatusIcon(diag)}
                  <div className="flex-1">
                    <div className="font-medium">{diag.display_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {diag.uploads_count} uploads total • {diag.public_uploads_count} publics • 
                      {diag.uploads_with_path} avec path • {diag.media_in_profile} dans profil
                    </div>
                    {diag.sample_urls.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        URLs échantillon: {diag.sample_urls.length} disponibles
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {diag.last_upload ? new Date(diag.last_upload).toLocaleDateString() : 'Jamais'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}