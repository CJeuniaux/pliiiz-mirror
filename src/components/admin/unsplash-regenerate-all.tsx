import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Play, CheckCircle, AlertCircle } from 'lucide-react';

export function UnsplashRegenerateAll() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const startRegeneration = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('unsplash-rebuild-v2', {
        body: {
          action: 'rebuild_all',
          session_id: crypto.randomUUID()
        }
      });

      if (error) {
        throw error;
      }

      setResult(data);
      toast({
        title: "Régénération terminée",
        description: data.message || "Toutes les images ont été régénérées avec la nouvelle logique.",
      });

    } catch (error: any) {
      console.error('Error during regeneration:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la régénération des images.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Régénération Images Unsplash
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">
            🎯 Nouvelle logique améliorée
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ Requêtes de recherche plus précises et ciblées</li>
            <li>✅ Dictionnaire étendu français → anglais</li>
            <li>✅ Filtres optimisés pour éviter les illustrations</li>
            <li>✅ Meilleure correspondance image ↔ description</li>
          </ul>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={startRegeneration}
            disabled={isRunning}
            className="flex items-center gap-2 px-8 py-3"
            size="lg"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Régénération en cours...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Démarrer la régénération
              </>
            )}
          </Button>
        </div>

        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Traitement en cours...</span>
              <span>Veuillez patienter</span>
            </div>
            <Progress value={50} className="w-full" />
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Régénération terminée !</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium">Total traité</div>
                <div className="text-2xl font-bold text-blue-600">
                  {result.stats?.processed || 0}
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded">
                <div className="font-medium">Succès</div>
                <div className="text-2xl font-bold text-green-600">
                  {result.stats?.success || 0}
                </div>
              </div>
              
              {result.stats?.fallback > 0 && (
                <div className="bg-orange-50 p-3 rounded">
                  <div className="font-medium">Fallback</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {result.stats.fallback}
                  </div>
                </div>
              )}
              
              {result.stats?.errors > 0 && (
                <div className="bg-red-50 p-3 rounded">
                  <div className="font-medium">Erreurs</div>
                  <div className="text-2xl font-bold text-red-600">
                    {result.stats.errors}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded text-sm">
              <div className="font-medium mb-1">Message :</div>
              <div className="text-gray-700">{result.message}</div>
            </div>

            <div className="bg-gray-50 p-3 rounded text-sm">
              <div className="font-medium mb-1">Session ID :</div>
              <div className="text-gray-700 font-mono">{result.session_id}</div>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <div className="font-medium mb-1">Attention :</div>
              <div>
                Cette opération peut prendre plusieurs minutes selon le nombre d'idées cadeaux à traiter. 
                Les images existantes en version v2 seront conservées.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}