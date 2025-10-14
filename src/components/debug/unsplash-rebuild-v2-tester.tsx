import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useUnsplashRebuild } from '@/hooks/use-unsplash-rebuild';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Play, BarChart3, Image, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';

interface GiftIdeaTest {
  text: string;
  category?: string;
  occasion?: string;
}

export function UnsplashRebuildV2Tester() {
  const { 
    startRebuild, 
    getRebuildStats, 
    getGiftIdeasStats, 
    getImageByIdea,
    loading, 
    error, 
    result 
  } = useUnsplashRebuild();

  const [overallStats, setOverallStats] = useState<any>(null);
  const [recentMetrics, setRecentMetrics] = useState<any[]>([]);
  const [testIdeas, setTestIdeas] = useState<GiftIdeaTest[]>([
    { text: 'tasse artisanale', category: 'maison' },
    { text: 'bougie parfumée vanille', category: 'déco' },
    { text: 'livre science-fiction', category: 'livres' },
    { text: 'plaid cocooning', category: 'maison' },
    { text: 'vin rouge premium', category: 'gastronomie' }
  ]);
  const [customIdea, setCustomIdea] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [imageTests, setImageTests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les stats au démarrage
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setRefreshing(true);
    try {
      const [stats, metrics] = await Promise.all([
        getGiftIdeasStats(),
        getRebuildStats()
      ]);
      
      setOverallStats(stats);
      setRecentMetrics(metrics || []);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFullRebuild = async () => {
    await startRebuild();
    await loadStats(); // Refresh après rebuild
  };

  const handleTestRebuild = async () => {
    await startRebuild(testIdeas.map(idea => ({
      id: crypto.randomUUID(),
      text: idea.text,
      category: idea.category || null,
      occasion: idea.occasion || null,
      user_id: null
    })));
    await loadStats();
  };

  const addCustomIdea = () => {
    if (customIdea.trim()) {
      setTestIdeas([...testIdeas, {
        text: customIdea.trim(),
        category: customCategory.trim() || undefined
      }]);
      setCustomIdea('');
      setCustomCategory('');
    }
  };

  const removeTestIdea = (index: number) => {
    setTestIdeas(testIdeas.filter((_, i) => i !== index));
  };

  const testImageRetrieval = async () => {
    const results = [];
    for (const idea of testIdeas.slice(0, 3)) { // Test seulement les 3 premiers
      try {
        const imageData = await getImageByIdea(idea.text, idea.category);
        results.push({
          idea: idea.text,
          found: !!imageData,
          data: imageData
        });
      } catch (err) {
        results.push({
          idea: idea.text,
          found: false,
          error: err.message
        });
      }
    }
    setImageTests(results);
  };

  const formatNumber = (num: number | null | undefined) => {
    return num?.toLocaleString() || '0';
  };

  const getSuccessRate = () => {
    if (!overallStats || !overallStats.v2_success || !overallStats.v2_count) return 0;
    return Math.round((overallStats.v2_success / overallStats.v2_count) * 100);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Unsplash Rebuild v2 - Test & Monitor</h2>
          <p className="text-muted-foreground">
            Rebuild et test du système d'images Unsplash pour idées cadeaux
          </p>
        </div>
        <Button 
          onClick={loadStats} 
          disabled={refreshing} 
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Total v2
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overallStats?.v2_count)}</div>
            <p className="text-xs text-muted-foreground">Images générées v2</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Succès
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(overallStats?.v2_success)}
            </div>
            <p className="text-xs text-muted-foreground">
              Taux: {getSuccessRate()}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
              Fallback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatNumber(overallStats?.v2_fallback)}
            </div>
            <p className="text-xs text-muted-foreground">Placeholder utilisés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Image className="w-4 h-4 mr-2" />
              Score moy.
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.avg_v2_score ? overallStats.avg_v2_score.toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Pertinence moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions de rebuild */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Play className="w-5 h-5 mr-2" />
            Actions de Rebuild
          </CardTitle>
          <CardDescription>
            Démarrer un rebuild complet ou tester avec un échantillon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <Alert>
              <Clock className="w-4 h-4" />
              <AlertDescription>
                Rebuild en cours... Cela peut prendre plusieurs minutes.
                {result && (
                  <div className="mt-2">
                    <Progress value={(result.stats?.processed / result.stats?.total * 100) || 0} />
                    <p className="text-sm mt-1">
                      {result.stats?.processed || 0} / {result.stats?.total || 0} traités
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && !loading && (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Rebuild terminé!</strong>
                <br />
                {result.message}
                <div className="mt-2 space-x-2">
                  <Badge variant="outline">Session: {result.session_id}</Badge>
                  <Badge variant="secondary">Succès: {result.stats.success}</Badge>
                  <Badge variant="outline">Fallback: {result.stats.fallback}</Badge>
                  {result.stats.errors > 0 && (
                    <Badge variant="destructive">Erreurs: {result.stats.errors}</Badge>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button 
              onClick={handleFullRebuild} 
              disabled={loading}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Rebuild Complet (Tous Profils)
            </Button>
            <Button 
              onClick={handleTestRebuild} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Test Rebuild (Échantillon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration des tests */}
      <Card>
        <CardHeader>
          <CardTitle>Idées Cadeaux de Test</CardTitle>
          <CardDescription>
            Configurez les idées à utiliser pour les tests de rebuild
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {testIdeas.map((idea, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {idea.text}
                {idea.category && <span className="text-xs opacity-70">({idea.category})</span>}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeTestIdea(index)}
                />
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="custom-idea">Nouvelle idée</Label>
              <Input
                id="custom-idea"
                value={customIdea}
                onChange={(e) => setCustomIdea(e.target.value)}
                placeholder="Ex: chocolat artisanal"
                onKeyPress={(e) => e.key === 'Enter' && addCustomIdea()}
              />
            </div>
            <div className="w-32">
              <Label htmlFor="custom-category">Catégorie</Label>
              <Input
                id="custom-category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="gastronomie"
                onKeyPress={(e) => e.key === 'Enter' && addCustomIdea()}
              />
            </div>
            <div className="pt-6">
              <Button onClick={addCustomIdea} size="sm">
                Ajouter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test de récupération d'images */}
      <Card>
        <CardHeader>
          <CardTitle>Test de Récupération d'Images</CardTitle>
          <CardDescription>
            Testez la récupération d'images v2 pour les idées configurées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testImageRetrieval} variant="outline">
            <Image className="w-4 h-4 mr-2" />
            Tester Récupération (3 premiers)
          </Button>

          {imageTests.length > 0 && (
            <div className="space-y-2">
              {imageTests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">{test.idea}</span>
                    {test.found ? (
                      <div className="text-sm text-green-600">
                        ✓ Image trouvée (score: {test.data?.relevance_score?.toFixed(2) || 'N/A'})
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">
                        ✗ Aucune image {test.error && `(${test.error})`}
                      </div>
                    )}
                  </div>
                  {test.found && test.data?.image_url && (
                    <img 
                      src={test.data.image_url} 
                      alt={test.idea}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métriques récentes */}
      {recentMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Métriques Récentes</CardTitle>
            <CardDescription>
              Historique des dernières opérations de rebuild
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentMetrics.slice(0, 10).map((metric, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span>{metric.metric_name}</span>
                  <div className="text-right">
                    <span className="font-mono">{metric.metric_value}</span>
                    <div className="text-xs text-muted-foreground">
                      {new Date(metric.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}