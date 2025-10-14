import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, TestTube } from 'lucide-react';
import { useGiftRegenJob } from '@/hooks/use-gift-regen-job';
import { toast } from '@/hooks/use-toast';

export function GiftRegenTestLauncher() {
  const { startTest, loading, currentJob } = useGiftRegenJob();

  const handleTestRegeneration = async () => {
    const jobId = await startTest();
    if (jobId) {
      toast({
        title: "🧪 Test de régénération lancé",
        description: `Job de test ${jobId} démarré avec la base sémantique`,
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Test de Régénération
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Lance la régénération sur un échantillon représentatif pour valider la base sémantique.
        </p>
        
        <Button 
          onClick={handleTestRegeneration}
          disabled={loading || (currentJob && currentJob.status === 'running')}
          className="w-full"
        >
          <Play className="w-4 h-4 mr-2" />
          Lancer le test
        </Button>

        {currentJob && currentJob.status === 'running' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span>{currentJob.processed_items} / {currentJob.total_items}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${(currentJob.processed_items / Math.max(currentJob.total_items, 1)) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}