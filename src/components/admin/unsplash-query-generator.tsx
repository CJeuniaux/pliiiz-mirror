import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, ExternalLink, Search } from 'lucide-react';

interface QueryResult {
  original: string;
  query: string;
  tips: {
    keywords_count: number;
    exclusions_count: number;
  };
}

export function UnsplashQueryGenerator() {
  const [giftIdea, setGiftIdea] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testResults, setTestResults] = useState<QueryResult[]>([]);

  const generateQuery = async () => {
    if (!giftIdea.trim()) {
      toast.error('Veuillez saisir une idée cadeau');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('unsplash-query-generator', {
        body: { giftIdea: giftIdea.trim() }
      });

      if (error) {
        throw new Error(error.message);
      }

      setResult(data);
      toast.success('Requête générée avec succès');

    } catch (error) {
      console.error('Error generating query:', error);
      toast.error('Erreur lors de la génération: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const testBatchQueries = async () => {
    const testIdeas = [
      'tasse artisanale',
      'bougie parfumée vanille', 
      'plaid en laine',
      'livre de cuisine',
      'plante succulente',
      'écharpe en cachemire',
      'chocolat noir premium',
      'carnet de voyage',
      'thé matcha bio',
      'savon naturel lavande'
    ];

    setTestResults([]);
    setIsGenerating(true);

    try {
      for (const idea of testIdeas) {
        const { data, error } = await supabase.functions.invoke('unsplash-query-generator', {
          body: { giftIdea: idea }
        });

        if (!error && data) {
          setTestResults(prev => [...prev, data]);
        }
      }
      toast.success('Tests batch terminés');
    } catch (error) {
      toast.error('Erreur lors des tests batch');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers');
  };

  const testOnUnsplash = (query: string) => {
    const unsplashUrl = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
    window.open(unsplashUrl, '_blank');
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Générateur de Requêtes Unsplash
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Transforme les idées cadeaux en requêtes optimisées pour l'API Unsplash
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: tasse artisanale, bougie parfumée, plaid cozy..."
              value={giftIdea}
              onChange={(e) => setGiftIdea(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && generateQuery()}
              className="flex-1"
            />
            <Button onClick={generateQuery} disabled={isGenerating}>
              {isGenerating ? 'Génération...' : 'Générer'}
            </Button>
          </div>

          <Button 
            variant="outline" 
            onClick={testBatchQueries} 
            disabled={isGenerating}
            className="w-full"
          >
            Tester 10 exemples d'idées cadeaux
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Résultat généré</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Idée originale:</label>
              <p className="text-sm text-muted-foreground">{result.original}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Requête Unsplash optimisée:</label>
              <div className="flex items-center gap-2 mt-1">
                <Textarea
                  value={result.query}
                  readOnly
                  className="flex-1 min-h-[80px] font-mono text-xs"
                />
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(result.query)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => testOnUnsplash(result.query)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 text-sm">
              <Badge variant="outline">
                {result.tips.keywords_count} mots-clés
              </Badge>
              <Badge variant="outline">
                {result.tips.exclusions_count} exclusions
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats des tests batch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((test, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{test.original}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(test.query)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testOnUnsplash(test.query)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded">
                    {test.query}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {test.tips.keywords_count} mots-clés
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {test.tips.exclusions_count} exclusions
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium">🎯 Objectif</h4>
            <p className="text-muted-foreground">
              Transformer une idée cadeau en requête Unsplash optimisée pour obtenir des images pertinentes et esthétiques.
            </p>
          </div>

          <div>
            <h4 className="font-medium">⚙️ Stratégie d'enrichissement</h4>
            <ul className="text-muted-foreground space-y-1 ml-4">
              <li>• Mapping français → anglais avec synonymes</li>
              <li>• Ajout systématique du contexte "gift, present, lifestyle"</li>
              <li>• Détection de catégorie pour contexte spécialisé</li>
              <li>• Exclusions pour éviter dessins/logos</li>
              <li>• Privilégier styles "photography, product, real"</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium">📋 Contraintes respectées</h4>
            <ul className="text-muted-foreground space-y-1 ml-4">
              <li>• Minimum 3 mots-clés (souvent 6-8)</li>
              <li>• Maximum 8 mots-clés pour éviter la sur-spécification</li>
              <li>• Exclusions systématiques des styles inadaptés</li>
              <li>• Dédoublonnage automatique</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}