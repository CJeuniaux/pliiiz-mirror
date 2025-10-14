import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MigrationStats {
  totalProfiles: number;
  profilesWithSlugs: number;
  profilesWithoutSlugs: number;
  percentageComplete: number;
}

export function SlugMigrationScreen() {
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);

  useEffect(() => {
    fetchMigrationStats();
  }, []);

  const fetchMigrationStats = async () => {
    try {
      setLoading(true);

      // Count total profiles
      const { count: totalProfiles, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Count profiles with active share links
      const { count: profilesWithSlugs, error: slugsError } = await supabase
        .from('share_links')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (slugsError) throw slugsError;

      const profilesWithoutSlugs = (totalProfiles || 0) - (profilesWithSlugs || 0);
      const percentageComplete = totalProfiles ? Math.round(((profilesWithSlugs || 0) / totalProfiles) * 100) : 0;

      setStats({
        totalProfiles: totalProfiles || 0,
        profilesWithSlugs: profilesWithSlugs || 0,
        profilesWithoutSlugs,
        percentageComplete
      });
    } catch (error) {
      console.error('Error fetching migration stats:', error);
      toast.error('Erreur lors de la récupération des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const generateSlugForUser = (firstName: string, lastName: string, userId: string): string => {
    const baseName = firstName || 'user';
    const random = Math.random().toString(36).substring(2, 8);
    const slug = `${baseName.toLowerCase()}-${random}`;
    
    return slug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  };

  const migrateProfilesSlugs = async () => {
    if (!stats || stats.profilesWithoutSlugs === 0) return;

    try {
      setMigrating(true);
      setMigrationProgress(0);

      // Get profiles without share links
      const { data: profilesNeedingSlugs, error: fetchError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .not('user_id', 'in', 
          `(SELECT user_id FROM share_links WHERE is_active = true)`
        );

      if (fetchError) throw fetchError;

      if (!profilesNeedingSlugs || profilesNeedingSlugs.length === 0) {
        toast.success('Tous les profils ont déjà des slugs');
        await fetchMigrationStats();
        return;
      }

      const totalToMigrate = profilesNeedingSlugs.length;
      let completed = 0;

      // Process in batches of 10
      const batchSize = 10;
      for (let i = 0; i < profilesNeedingSlugs.length; i += batchSize) {
        const batch = profilesNeedingSlugs.slice(i, i + batchSize);
        
        const shareLinksToInsert = batch.map(profile => ({
          user_id: profile.user_id,
          slug: generateSlugForUser(profile.first_name, profile.last_name, profile.user_id),
          is_active: true
        }));

        // Insert share links for this batch
        const { error: insertError } = await supabase
          .from('share_links')
          .insert(shareLinksToInsert);

        if (insertError) {
          console.error('Error inserting share links batch:', insertError);
          // Continue with next batch instead of failing completely
        } else {
          completed += batch.length;
        }

        // Update progress
        const progress = Math.round((completed / totalToMigrate) * 100);
        setMigrationProgress(progress);

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success(`Migration terminée : ${completed} slugs créés`);
      await fetchMigrationStats();
    } catch (error) {
      console.error('Error during migration:', error);
      toast.error('Erreur lors de la migration');
    } finally {
      setMigrating(false);
      setMigrationProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Migration des Slugs de Partage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.totalProfiles}</div>
                  <div className="text-sm text-muted-foreground">Profils totaux</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.profilesWithSlugs}</div>
                  <div className="text-sm text-muted-foreground">Avec slug</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.profilesWithoutSlugs}</div>
                  <div className="text-sm text-muted-foreground">Sans slug</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.percentageComplete}%</div>
                  <div className="text-sm text-muted-foreground">Complétés</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression de la migration</span>
                  <span>{stats.percentageComplete}%</span>
                </div>
                <Progress value={stats.percentageComplete} className="w-full" />
              </div>

              {migrating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Migration en cours...</span>
                    <span>{migrationProgress}%</span>
                  </div>
                  <Progress value={migrationProgress} className="w-full" />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={fetchMigrationStats}
                  variant="outline"
                  disabled={migrating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
                
                {stats.profilesWithoutSlugs > 0 && (
                  <Button
                    onClick={migrateProfilesSlugs}
                    disabled={migrating}
                  >
                    {migrating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Migration en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Migrer {stats.profilesWithoutSlugs} profils
                      </>
                    )}
                  </Button>
                )}
                
                {stats.profilesWithoutSlugs === 0 && (
                  <Button disabled variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Migration terminée
                  </Button>
                )}
              </div>

              {stats.profilesWithoutSlugs > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-orange-800">Migration requise</h3>
                      <p className="text-sm text-orange-700 mt-1">
                        {stats.profilesWithoutSlugs} profils n'ont pas encore de slug de partage. 
                        La migration créera automatiquement des slugs uniques pour ces comptes.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}