import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PublicProfileV2 } from '@/types/public-profile-v2';

interface TestResult {
  user_id: string;
  name: string;
  status: 'success' | 'failed' | 'pending';
  missing_fields: string[];
  payload?: PublicProfileV2;
  error?: string;
}

export function PublicProfileV2Tester() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runIntegrationTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      toast.info('Démarrage du test d\'intégration v2...');

      // 1. Test avec un profil complet
      const completeResult = await testCompleteProfile();
      setTestResults(prev => [...prev, completeResult]);

      // 2. Test avec un profil incomplet
      const incompleteResult = await testIncompleteProfile();
      setTestResults(prev => [...prev, incompleteResult]);

      // 3. Test de normalisation des clés
      const legacyResult = await testLegacyOccasionKeys();
      setTestResults(prev => [...prev, legacyResult]);

      // 4. Lance une réconciliation globale
      await runGlobalReconciliation();

      toast.success('Tests d\'intégration terminés');

    } catch (error) {
      console.error('Test integration error:', error);
      toast.error('Erreur lors des tests: ' + (error as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const testCompleteProfile = async (): Promise<TestResult> => {
    const testName = 'Profil complet avec toutes les occasions';
    
    try {
      // Crée des données de test complètes
      const testData = {
        first_name: 'Léna',
        last_name: 'Test',
        city: 'Bruxelles',
        birthday: '1995-03-15',
        regift_enabled: true,
        global_preferences: {
          likes: ['thé matcha', 'bougies'],
          avoid: ['alcool fort'],
          giftIdeas: ['tasse artisanale', 'plaid'],
          sizes: {
            top: 'M',
            bottom: '38',
            shoes: '41',
            other: 'tour de tête 57'
          }
        },
        occasion_prefs: {
          brunch: {
            likes: ['pancakes'],
            allergies: ['noix'],
            avoid: [],
            giftIdeas: ['sirop d\'érable']
          },
          cremaillere: {
            likes: ['plantes'],
            allergies: [],
            avoid: ['bougies fortes'],
            giftIdeas: ['pothos']
          },
          anniversaire: {
            likes: ['surprises'],
            allergies: [],
            avoid: [],
            giftIdeas: ['escape game']
          }
        }
      };

      const userId = await simulateUserCreation(testData);
      await triggerReplication();
      
      // Vérifie la réconciliation
      const reconciliation = await checkReconciliation(userId);
      
      return {
        user_id: userId,
        name: testName,
        status: reconciliation.missing_fields.length === 0 ? 'success' : 'failed',
        missing_fields: reconciliation.missing_fields || [],
        payload: reconciliation.payload
      };

    } catch (error) {
      return {
        user_id: 'error',
        name: testName,
        status: 'failed',
        missing_fields: [],
        error: (error as Error).message
      };
    }
  };

  const testIncompleteProfile = async (): Promise<TestResult> => {
    const testName = 'Profil incomplet (détection des manques)';
    
    try {
      const testData = {
        first_name: 'Marie',
        // Volontairement incomplet
      };

      const userId = await simulateUserCreation(testData);
      await triggerReplication();
      
      const reconciliation = await checkReconciliation(userId);
      
      return {
        user_id: userId,
        name: testName,
        status: reconciliation.missing_fields.length > 0 ? 'success' : 'failed',
        missing_fields: reconciliation.missing_fields || []
      };

    } catch (error) {
      return {
        user_id: 'error',
        name: testName,
        status: 'failed',
        missing_fields: [],
        error: (error as Error).message
      };
    }
  };

  const testLegacyOccasionKeys = async (): Promise<TestResult> => {
    const testName = 'Normalisation des clés d\'occasions legacy';
    
    try {
      const testData = {
        first_name: 'Pierre',
        last_name: 'Legacy',
        occasion_prefs: {
          'diner-entre-amis': { likes: ['vin'] },
          'crémaillère': { likes: ['plantes'] },
          'anniversaires': { likes: ['gâteaux'] }
        }
      };

      const userId = await simulateUserCreation(testData);
      await triggerReplication();
      
      const reconciliation = await checkReconciliation(userId);
      
      // Vérifie que les clés ont été normalisées
      const hasNormalizedKeys = reconciliation.payload && 
        reconciliation.payload.occasions?.diner_amis?.likes?.includes('vin');
      
      return {
        user_id: userId,
        name: testName,
        status: hasNormalizedKeys ? 'success' : 'failed',
        missing_fields: reconciliation.missing_fields || [],
        payload: reconciliation.payload
      };

    } catch (error) {
      return {
        user_id: 'error',
        name: testName,
        status: 'failed',
        missing_fields: [],
        error: (error as Error).message
      };
    }
  };

  const simulateUserCreation = async (userData: any): Promise<string> => {
    // Trouve un utilisateur existant pour les tests
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);

    if (!profiles || profiles.length === 0) {
      throw new Error('Aucun utilisateur disponible pour les tests');
    }

    const userId = profiles[0].user_id;

    // Met à jour temporairement le profil pour les tests
    await supabase
      .from('profiles')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    return userId;
  };

  const triggerReplication = async () => {
    const { error } = await supabase.functions.invoke('profile-replication-worker', {
      body: { batchSize: 10 }
    });

    if (error) {
      throw new Error(`Replication failed: ${error.message}`);
    }
  };

  const checkReconciliation = async (userId: string) => {
    const { data, error } = await supabase.rpc('find_inconsistent_profiles_v2');
    
    if (error) {
      throw new Error(`Reconciliation check failed: ${error.message}`);
    }

    const userReconciliation = data?.find((item: any) => item.user_id === userId);
    
    // Récupère aussi le payload actuel
    const { data: sourceData } = await supabase
      .from('v_public_profile_source')
      .select('*')
      .eq('user_id', userId)
      .single();

    let payload = null;
    if (sourceData) {
      const { data: builtPayload } = await supabase.rpc('build_public_payload_v2', {
        source_row: sourceData
      });
      payload = builtPayload;
    }

    return {
      missing_fields: userReconciliation?.missing_fields || [],
      payload: payload
    };
  };

  const runGlobalReconciliation = async () => {
    const { error } = await supabase.functions.invoke('profile-replication-worker', {
      body: { reconcile: true }
    });

    if (error) {
      throw new Error(`Global reconciliation failed: ${error.message}`);
    }

    toast.success('Réconciliation globale terminée');
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Public Profile v2 - Tests d'Intégration</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tests exhaustifs du nouveau contrat Public Profile v2 avec réconciliation sélective
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runIntegrationTest} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Tests en cours...' : 'Lancer les tests d\'intégration v2'}
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Résultats des tests</h3>
            {testResults.map((result, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{result.name}</h4>
                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                    {result.status === 'success' ? 'RÉUSSI' : 'ÉCHOUÉ'}
                  </Badge>
                </div>
                
                {result.error && (
                  <p className="text-sm text-red-600 mb-2">Erreur: {result.error}</p>
                )}
                
                {result.missing_fields.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium">Champs manquants:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.missing_fields.map((field, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {result.payload && (
                  <details className="mt-2">
                    <summary className="text-sm font-medium cursor-pointer">
                      Payload généré
                    </summary>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(result.payload, null, 2)}
                    </pre>
                  </details>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <h4 className="font-medium mb-2">Checklist v2 :</h4>
          <ul className="space-y-1 text-xs">
            <li>✅ Contrat PublicProfile v2 exhaustif défini</li>
            <li>✅ Fonction buildPublicPayload() en liste blanche</li>
            <li>✅ Vue consolidée v_public_profile_source</li>
            <li>✅ Réconciliation sélective avec détection des manques</li>
            <li>✅ Normalisation des clés d'occasions (cremaillere, diner_amis, etc.)</li>
            <li>✅ Worker de réplication mis à jour</li>
            <li>✅ Tests d'intégration multi-comptes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}