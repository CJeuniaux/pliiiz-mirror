import React from 'react';
import { useUnsplashGiftImages } from '@/hooks/use-auth-v2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export function UnsplashGiftImagesTester() {
  const { getGiftImage, loading, error } = useUnsplashGiftImages();
  const [ideaText, setIdeaText] = useState('');
  const [category, setCategory] = useState('');
  const [occasion, setOccasion] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSearch = async () => {
    if (!ideaText.trim()) return;

    const response = await getGiftImage({
      idea_text: ideaText.trim(),
      category: category.trim() || undefined,
      occasion: occasion.trim() || undefined,
      per_page: 3
    });

    setResult(response);
  };

  const testCases = [
    { idea: 'chocolat noir', category: 'food', occasion: 'anniversaire' },
    { idea: 'livre de science-fiction', category: 'books', occasion: '' },
    { idea: 'plante verte', category: 'home', occasion: 'cremaillere' },
    { idea: 'bijoux artisanaux', category: 'fashion', occasion: '' },
    { idea: 'café de spécialité', category: 'food', occasion: 'brunch' }
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Test des Images d'Idées Cadeaux</h1>
        <p className="text-muted-foreground">
          Testez la nouvelle API Unsplash pour les images d'idées cadeaux
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recherche d'image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Idée cadeau *</label>
              <Input
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder="Ex: chocolat noir, livre sci-fi..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Catégorie (optionnel)</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: food, books, tech..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Occasion (optionnel)</label>
              <Input
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="Ex: anniversaire, brunch..."
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={loading || !ideaText.trim()}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Image className="h-4 w-4 mr-2" />
            )}
            Rechercher l'image
          </Button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <strong>Erreur:</strong> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Cas de test rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {testCases.map((testCase, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  setIdeaText(testCase.idea);
                  setCategory(testCase.category);
                  setOccasion(testCase.occasion);
                }}
                disabled={loading}
              >
                {testCase.idea}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Résultat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant={result.cached ? "secondary" : "default"}>
                  {result.cached ? "Cache" : "API"}
                </Badge>
                {result.relevance_score && (
                  <Badge variant="outline">
                    Score: {result.relevance_score}
                  </Badge>
                )}
                {result.total_results && (
                  <Badge variant="outline">
                    {result.total_results} résultats
                  </Badge>
                )}
              </div>

              {result.query_used && (
                <div className="text-sm">
                  <strong>Query utilisée:</strong> <code className="bg-muted px-2 py-1 rounded text-xs">
                    {result.query_used}
                  </code>
                </div>
              )}

              {result.image ? (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={result.image.url}
                    alt={result.image.description || 'Gift idea image'}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Par {result.image.author}</span>
                      {result.image.unsplash_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(result.image.unsplash_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Voir sur Unsplash
                        </Button>
                      )}
                    </div>
                    {result.image.description && (
                      <p className="text-sm text-muted-foreground">
                        {result.image.description}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-muted rounded-lg text-center">
                  <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <div className="font-medium">Aucune image trouvée</div>
                  {result.message && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {result.message}
                    </p>
                  )}
                  {result.suggestion && (
                    <p className="text-sm text-blue-600 mt-2">
                      💡 {result.suggestion}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}