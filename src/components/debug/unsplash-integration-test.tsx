import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUnsplashRebuild } from '@/hooks/use-unsplash-rebuild';
import { usePreferenceImage } from '@/hooks/use-preference-image';
import { PreferenceCardWithImage } from '@/components/ui/preference-card-with-image';
import { CheckCircle, X, Loader, RefreshCw, Play } from 'lucide-react';

interface TestCase {
  id: string;
  idea: string;
  category?: string;
  expectedScore: number; // Score de pertinence attendu (> 0.35 = bon)
  status: 'pending' | 'running' | 'success' | 'failed' | 'fallback';
  v2Data?: any;
  v1Data?: any;
  error?: string;
}

export function UnsplashIntegrationTest() {
  const { getImageByIdea, startRebuild, loading: rebuildLoading } = useUnsplashRebuild();
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: '1', idea: 'tasse artisanale', category: 'maison', expectedScore: 0.5, status: 'pending' },
    { id: '2', idea: 'bougie parfumée vanille', category: 'déco', expectedScore: 0.6, status: 'pending' },
    { id: '3', idea: 'livre science-fiction', category: 'livres', expectedScore: 0.4, status: 'pending' },
    { id: '4', idea: 'vin rouge premium', category: 'gastronomie', expectedScore: 0.5, status: 'pending' },
    { id: '5', idea: 'plaid cocooning', category: 'maison', expectedScore: 0.4, status: 'pending' }
  ]);
  const [integrationResults, setIntegrationResults] = useState<any[]>([]);
  const [selectedIdea, setSelectedIdea] = useState('');

  const runPrecisionTest = async () => {
    console.log('[IntegrationTest] Starting precision test...');
    
    const updatedCases = [...testCases];
    setTestCases(updatedCases.map(tc => ({ ...tc, status: 'pending' })));

    for (let i = 0; i < updatedCases.length; i++) {
      const testCase = updatedCases[i];
      
      // Marquer comme en cours
      updatedCases[i] = { ...testCase, status: 'running' };
      setTestCases([...updatedCases]);

      try {
        // Test v2 system
        const v2Result = await getImageByIdea(testCase.idea, testCase.category);
        console.log(`[IntegrationTest] v2 result for "${testCase.idea}":`, v2Result);

        if (v2Result && v2Result.image_url) {
          if (v2Result.is_fallback || (v2Result.relevance_score || 0) < 0.35) {
            updatedCases[i] = { 
              ...testCase, 
              status: 'fallback', 
              v2Data: v2Result,
              error: 'Score trop faible ou fallback'
            };
          } else {
            updatedCases[i] = { 
              ...testCase, 
              status: 'success', 
              v2Data: v2Result 
            };
          }
        } else {
          updatedCases[i] = { 
            ...testCase, 
            status: 'failed', 
            error: 'Aucune image trouvée en v2'
          };
        }
      } catch (error) {
        console.error(`[IntegrationTest] Error testing "${testCase.idea}":`, error);
        updatedCases[i] = { 
          ...testCase, 
          status: 'failed', 
          error: error.message 
        };
      }

      setTestCases([...updatedCases]);
      
      // Petit délai entre tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('[IntegrationTest] Precision test completed');
  };

  const testIntegrationWithUI = () => {
    const testIdeas = testCases.slice(0, 3).map(tc => tc.idea);
    
    const results = testIdeas.map(idea => {
      return {
        idea,
        usePreferenceImageHook: true // Indique qu'on utilise le hook
      };
    });
    
    setIntegrationResults(results);
  };

  const rebuildTestSample = async () => {
    const sampleIdeas = testCases.map(tc => ({
      id: tc.id,
      text: tc.idea,
      category: tc.category || null,
      occasion: null,
      user_id: null
    }));

    await startRebuild(sampleIdeas);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-500" />;
      case 'fallback':
        return <RefreshCw className="w-4 h-4 text-orange-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'fallback':
        return 'secondary';
      case 'running':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const calculateSuccessRate = () => {
    const completedTests = testCases.filter(tc => tc.status !== 'pending' && tc.status !== 'running');
    if (completedTests.length === 0) return 0;
    
    const successfulTests = completedTests.filter(tc => tc.status === 'success');
    return Math.round((successfulTests.length / completedTests.length) * 100);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Tests d'Intégration Unsplash v2</h2>
        <p className="text-muted-foreground">
          Tests de précision, performance et intégration du système v2
        </p>
      </div>

      {/* Actions principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button onClick={runPrecisionTest} disabled={rebuildLoading}>
          <Play className="w-4 h-4 mr-2" />
          Test de Précision v2
        </Button>
        <Button onClick={testIntegrationWithUI} variant="outline">
          <CheckCircle className="w-4 h-4 mr-2" />
          Test Intégration UI
        </Button>
        <Button onClick={rebuildTestSample} disabled={rebuildLoading} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Rebuild Échantillon
        </Button>
      </div>

      {/* Résumé des résultats */}
      <Card>
        <CardHeader>
          <CardTitle>Résultats des Tests</CardTitle>
          <CardDescription>
            Taux de succès: <strong>{calculateSuccessRate()}%</strong> 
            {testCases.filter(tc => tc.status === 'success').length > 0 && 
              ` (${testCases.filter(tc => tc.status === 'success').length}/${testCases.filter(tc => tc.status !== 'pending' && tc.status !== 'running').length} réussis)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testCases.map((testCase) => (
              <div key={testCase.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(testCase.status)}
                  <div>
                    <div className="font-medium">{testCase.idea}</div>
                    <div className="text-sm text-muted-foreground">
                      {testCase.category && `Catégorie: ${testCase.category} • `}
                      Score attendu: ≥{testCase.expectedScore}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(testCase.status)}>
                    {testCase.status}
                  </Badge>
                  {testCase.v2Data && (
                    <Badge variant="outline">
                      Score: {testCase.v2Data.relevance_score?.toFixed(2) || '0.00'}
                    </Badge>
                  )}
                  {testCase.v2Data?.image_url && (
                    <img 
                      src={testCase.v2Data.image_url} 
                      alt={testCase.idea}
                      className="w-12 h-12 object-cover rounded border"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test d'intégration UI */}
      {integrationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test d'Intégration UI</CardTitle>
            <CardDescription>
              Vérification que les hooks fonctionnent correctement avec les composants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {integrationResults.map((result, index) => (
                <div key={index}>
                  <h4 className="font-medium mb-2">{result.idea}</h4>
                  <PreferenceCardWithImage 
                    label={result.idea}
                    showButton={false}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations de debug */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <strong>Pipeline v2:</strong> Hook usePreferenceImage → getImageByIdea → gift_idea_unsplash table → Fallback v1 si nécessaire
              <br />
              <strong>Critères de succès:</strong> Score ≥ 0.35, image non-fallback, URL valide
              <br />
              <strong>Rate limiting:</strong> 350ms base + backoff exponentiel sur erreurs
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}