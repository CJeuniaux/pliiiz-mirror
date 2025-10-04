import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function StarLevelsMigrationTool() {
  const [migrating, setMigrating] = React.useState(false);
  const [migrationResult, setMigrationResult] = React.useState<any>(null);

  const runMigration = async () => {
    setMigrating(true);
    setMigrationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('migrate-star-levels', {
        method: 'POST'
      });

      if (error) {
        toast.error('Erreur lors de la migration: ' + error.message);
        console.error('Migration error:', error);
      } else {
        setMigrationResult(data);
        if (data.success) {
          toast.success(`Migration réussie! ${data.updatedCount} profils mis à jour sur ${data.totalProfiles}`);
        } else {
          toast.error('Migration échouée: ' + data.error);
        }
      }
    } catch (error) {
      toast.error('Erreur de connexion: ' + String(error));
      console.error('Migration exception:', error);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Card className="mx-4 my-6">
      <CardHeader>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <h2 className="mb-4 text-xl font-semibold">🎉 <strong>Nouveau : un assistant pour encoder tes préférences !</strong></h2>
          
          <p className="mb-3">On a rendu Pliiiz plus simple et plus précis. Tu peux maintenant noter tes "J'aime" et "Idées cadeaux" en 1–3★ et te laisser guider par notre assistant (thé → vert/vrac, chocolat → noir/70%/praliné, etc.).</p>
          
          <p className="mb-3"><strong>Important :</strong> nous avons prérempli à 2★ tes éléments déjà encodés. 👉 Merci de les valider (ou d'ajuster à 1★/3★) pour que tout s'affiche correctement.</p>
          
          <div className="mb-3">
            <p className="font-medium mb-2">En 30 secondes :</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Ouvre Mes préférences.</li>
              <li>Vérifie les éléments 2★ → laisse 2★ si OK, ou ajuste.</li>
              <li>Appuie sur "Enregistrer/Valider" (en haut ou en bas).</li>
              <li>(Optionnel) Personnalise par occasion (Dîner entre amis, Brunch, Anniversaires, Crémaillère).</li>
            </ol>
          </div>
        </div>

        <Button 
          onClick={runMigration} 
          disabled={migrating}
          className="btn btn-primary w-full"
        >
          {migrating ? 'Migration en cours...' : 'Valider mes préférences'}
        </Button>

        {migrationResult && (
          <div className={`p-4 rounded-lg ${migrationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h4 className={`font-medium ${migrationResult.success ? 'text-green-800' : 'text-red-800'}`}>
              Résultat de la migration
            </h4>
            <div className={`text-sm mt-2 ${migrationResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {migrationResult.success ? (
                <>
                  <p>✅ Migration terminée avec succès</p>
                  <p>📊 {migrationResult.updatedCount} profils mis à jour sur {migrationResult.totalProfiles} au total</p>
                  <p>💫 Les étoiles sont maintenant visibles sur tous les profils publics</p>
                </>
              ) : (
                <>
                  <p>❌ Migration échouée</p>
                  <p>Erreur: {migrationResult.error}</p>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}