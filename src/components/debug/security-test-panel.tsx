import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  validateContactIntegrity, 
  validateGeneratedText, 
  safeDisplay,
  logSecurityCheck,
  AI_FEATURES_ENABLED 
} from '@/lib/strict-guards';
import { 
  VALID_CONTACT, 
  INVALID_CONTACT_GENERATED_NAME, 
  INVALID_CONTACT_GENERATED_PREFS,
  TEXT_VALIDATION_CASES,
  SAFE_DISPLAY_CASES 
} from '@/lib/test-fixtures';
import { CheckCircle, XCircle, AlertTriangle, Shield } from 'lucide-react';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

/**
 * Panel de test des garde-fous anti-hallucination
 * À utiliser en développement pour valider la sécurité
 */
export function SecurityTestPanel() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Test 1: Validation contact valide
    try {
      const validResult = validateContactIntegrity(VALID_CONTACT);
      testResults.push({
        name: 'Contact valide - devrait passer',
        passed: validResult.valid,
        details: validResult.valid ? 'OK' : validResult.errors.join(', ')
      });
    } catch (error) {
      testResults.push({
        name: 'Contact valide - devrait passer',
        passed: false,
        details: `Erreur: ${error}`
      });
    }

    // Test 2: Validation contact avec nom généré
    try {
      const invalidResult1 = validateContactIntegrity(INVALID_CONTACT_GENERATED_NAME);
      testResults.push({
        name: 'Contact nom généré - devrait échouer',
        passed: !invalidResult1.valid,
        details: invalidResult1.valid ? 'FAUX POSITIF!' : invalidResult1.errors.join(', ')
      });
    } catch (error) {
      testResults.push({
        name: 'Contact nom généré - devrait échouer',
        passed: false,
        details: `Erreur: ${error}`
      });
    }

    // Test 3: Validation contact avec préférences générées
    try {
      const invalidResult2 = validateContactIntegrity(INVALID_CONTACT_GENERATED_PREFS);
      testResults.push({
        name: 'Contact préfs générées - devrait échouer',
        passed: !invalidResult2.valid,
        details: invalidResult2.valid ? 'FAUX POSITIF!' : invalidResult2.errors.join(', ')
      });
    } catch (error) {
      testResults.push({
        name: 'Contact préfs générées - devrait échouer',
        passed: false,
        details: `Erreur: ${error}`
      });
    }

    // Tests de validation de texte
    for (const testCase of TEXT_VALIDATION_CASES) {
      try {
        const textResult = validateGeneratedText(
          testCase.text, 
          testCase.allowedValues, 
          'summary'
        );
        const passed = testCase.shouldPass === textResult.valid;
        testResults.push({
          name: `Texte: ${testCase.name}`,
          passed,
          details: passed 
            ? 'OK' 
            : `Attendu: ${testCase.shouldPass}, Obtenu: ${textResult.valid}. ${textResult.reason || ''}`
        });
      } catch (error) {
        testResults.push({
          name: `Texte: ${testCase.name}`,
          passed: false,
          details: `Erreur: ${error}`
        });
      }
    }

    // Tests d'affichage sécurisé
    for (const testCase of SAFE_DISPLAY_CASES) {
      try {
        const result = safeDisplay(testCase.input);
        const passed = result === testCase.expected;
        testResults.push({
          name: `SafeDisplay: "${testCase.input}"`,
          passed,
          details: passed 
            ? 'OK' 
            : `Attendu: "${testCase.expected}", Obtenu: "${result}"`
        });
      } catch (error) {
        testResults.push({
          name: `SafeDisplay: "${testCase.input}"`,
          passed: false,
          details: `Erreur: ${error}`
        });
      }
    }

    setResults(testResults);
    setIsRunning(false);

    // Log des résultats pour traçabilité
    logSecurityCheck('security_test_run', {
      total_tests: testResults.length,
      passed_tests: testResults.filter(r => r.passed).length,
      failed_tests: testResults.filter(r => !r.passed).length
    }, {
      valid: testResults.every(r => r.passed),
      errors: testResults.filter(r => !r.passed).map(r => r.name)
    });
  };

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Panel de Test Anti-Hallucination Pliiiz
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Validation des garde-fous pour éviter la génération de données fictives
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status des feature flags */}
        <div>
          <h3 className="font-semibold mb-3">Feature Flags (Kill Switches)</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(AI_FEATURES_ENABLED).map(([key, enabled]) => (
              <Badge 
                key={key}
                variant={enabled ? "destructive" : "secondary"}
                className="justify-between"
              >
                {key}: {enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                {enabled ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Bouton de test */}
        <div className="text-center">
          <Button 
            onClick={runAllTests}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Tests en cours...' : 'Lancer tous les tests de sécurité'}
          </Button>
        </div>

        {/* Résultats */}
        {results.length > 0 && (
          <>
            <Separator />
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Résultats des Tests</h3>
                <div className="flex gap-4">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    ✓ {passedCount} Réussis
                  </Badge>
                  <Badge variant="destructive">
                    ✗ {failedCount} Échoués
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.passed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {result.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{result.name}</p>
                          <p className="text-xs text-muted-foreground">{result.details}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Recommandations */}
        <Separator />
        
        <div>
          <h3 className="font-semibold mb-3">Recommandations de Sécurité</h3>
          <div className="text-sm space-y-2">
            <p>• ✅ Tous les features d'IA sont désactivés par défaut</p>
            <p>• ✅ Validation stricte des données avant affichage</p>
            <p>• ✅ Logging de sécurité pour traçabilité</p>
            <p>• ⚠️ Surveiller les taux d'invalidation en production</p>
            <p>• 🚨 Mettre en place des alertes si validation échoue &gt; 1%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}