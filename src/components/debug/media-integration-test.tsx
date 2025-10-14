import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface TestStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  details?: string;
  data?: any;
}

export function MediaIntegrationTest() {
  const [testUserId, setTestUserId] = useState('');
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [running, setRunning] = useState(false);

  const updateStep = (index: number, updates: Partial<TestStep>) => {
    setSteps(prev => prev.map((step, i) => i === index ? { ...step, ...updates } : step));
  };

  const runIntegrationTest = async () => {
    if (!testUserId.trim()) {
      alert('Veuillez entrer un User ID');
      return;
    }

    setRunning(true);
    const testSteps: TestStep[] = [
      { name: '1. Vérifier user_uploads existants', status: 'pending' },
      { name: '2. Simuler upload (INSERT test)', status: 'pending' },
      { name: '3. Déclencher UPSERT_PROFILE', status: 'pending' },
      { name: '4. Vérifier outbox', status: 'pending' },
      { name: '5. Exécuter worker', status: 'pending' },
      { name: '6. Vérifier public_profiles.media', status: 'pending' },
      { name: '7. Tester URL affichable', status: 'pending' },
      { name: '8. Nettoyer données test', status: 'pending' }
    ];
    setSteps(testSteps);

    try {
      // Step 1: Vérifier uploads existants
      updateStep(0, { status: 'running' });
      const { data: existingUploads, error: uploadsError } = await supabase
        .from('user_uploads')
        .select('*')
        .eq('user_id', testUserId);

      if (uploadsError) throw uploadsError;
      updateStep(0, { 
        status: 'success', 
        details: `${existingUploads?.length || 0} uploads trouvés`,
        data: existingUploads 
      });

      // Step 2: Insérer un upload test
      updateStep(1, { status: 'running' });
      const testUpload = {
        user_id: testUserId,
        path: `test-uploads/${testUserId}/integration-test-${Date.now()}.jpg`,
        kind: 'gift_idea',
        is_public: true,
        width: 640,
        height: 640,
        url: `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/user-uploads/test-uploads/${testUserId}/integration-test-${Date.now()}.jpg`
      };

      const { data: insertedUpload, error: insertError } = await supabase
        .from('user_uploads')
        .insert(testUpload)
        .select()
        .single();

      if (insertError) throw insertError;
      updateStep(1, { 
        status: 'success', 
        details: `Upload créé: ${insertedUpload.id}`,
        data: insertedUpload 
      });

      // Step 3: Déclencher UPSERT_PROFILE via outbox
      updateStep(2, { status: 'running' });
      const { error: outboxError } = await supabase
        .from('replication_outbox')
        .insert({
          user_id: testUserId,
          event_type: 'UPSERT_PROFILE',
          source_version: 1,
          payload: { user_id: testUserId, trigger: 'integration_test' },
          idempotency_key: `integration_test_${testUserId}_${Date.now()}`
        });

      if (outboxError) throw outboxError;
      updateStep(2, { status: 'success', details: 'Événement ajouté à outbox' });

      // Step 4: Vérifier outbox
      updateStep(3, { status: 'running' });
      const { data: outboxItems } = await supabase
        .from('replication_outbox')
        .select('*')
        .eq('user_id', testUserId)
        .is('processed_at', null);

      updateStep(3, { 
        status: 'success', 
        details: `${outboxItems?.length || 0} éléments en attente` 
      });

      // Step 5: Exécuter worker
      updateStep(4, { status: 'running' });
      const { data: workerResult, error: workerError } = await supabase.functions
        .invoke('profile-replication-worker', {
          body: { batchSize: 5 }
        });

      if (workerError) throw workerError;
      updateStep(4, { 
        status: 'success', 
        details: `Worker: ${workerResult.processed} traités, ${workerResult.failed} échoués`,
        data: workerResult 
      });

      // Step 6: Vérifier public_profiles
      updateStep(5, { status: 'running' });
      const { data: publicProfile } = await supabase
        .from('public_profile_versions')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      if (!publicProfile) {
        updateStep(5, { status: 'error', details: 'Aucun profil public trouvé' });
      } else {
        // Récupérer le payload complet via fonction
        const { data: profileData } = await supabase.rpc('get_public_profile_secure', {
          profile_user_id: testUserId
        });

        const mediaCount = Array.isArray(profileData) && profileData.length > 0 ? 
          (profileData[0] as any)?.media?.length || 0 : 0;
        updateStep(5, { 
          status: mediaCount > 0 ? 'success' : 'error',
          details: `${mediaCount} éléments media dans le profil`,
          data: Array.isArray(profileData) && profileData.length > 0 ? 
            (profileData[0] as any)?.media : null
        });
      }

      // Step 7: Tester URL
      updateStep(6, { status: 'running' });
      if (publicProfile && testUpload.path) {
        const testUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/user-uploads/${testUpload.path}`;
        
        try {
          const response = await fetch(testUrl, { method: 'HEAD' });
          updateStep(6, { 
            status: response.ok ? 'success' : 'error',
            details: `URL test: ${response.status} ${response.statusText}` 
          });
        } catch (urlError) {
          updateStep(6, { 
            status: 'error', 
            details: `Erreur URL: ${urlError}` 
          });
        }
      } else {
        updateStep(6, { status: 'error', details: 'Pas de path à tester' });
      }

      // Step 8: Nettoyer
      updateStep(7, { status: 'running' });
      if (insertedUpload?.id) {
        await supabase
          .from('user_uploads')
          .delete()
          .eq('id', insertedUpload.id);
        updateStep(7, { status: 'success', details: 'Upload test supprimé' });
      } else {
        updateStep(7, { status: 'success', details: 'Rien à nettoyer' });
      }

    } catch (error) {
      console.error('Test integration error:', error);
      const currentStep = steps.findIndex(s => s.status === 'running');
      if (currentStep >= 0) {
        updateStep(currentStep, { 
          status: 'error', 
          details: error instanceof Error ? error.message : String(error) 
        });
      }
    } finally {
      setRunning(false);
    }
  };

  const getStepIcon = (step: TestStep) => {
    switch (step.status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Test d'Intégration Upload → Profil Public</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="User ID à tester"
            value={testUserId}
            onChange={(e) => setTestUserId(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={runIntegrationTest}
            disabled={running || !testUserId.trim()}
          >
            <Play className="h-4 w-4 mr-2" />
            Lancer Test
          </Button>
        </div>

        {steps.length > 0 && (
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded">
                {getStepIcon(step)}
                <div className="flex-1">
                  <div className="font-medium">{step.name}</div>
                  {step.details && (
                    <div className="text-sm text-muted-foreground">{step.details}</div>
                  )}
                  {step.data && (
                    <details className="text-xs mt-1">
                      <summary className="cursor-pointer text-muted-foreground">Voir données</summary>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <Badge variant={
                  step.status === 'success' ? 'default' :
                  step.status === 'error' ? 'destructive' :
                  step.status === 'running' ? 'secondary' : 'outline'
                }>
                  {step.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}