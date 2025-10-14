import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ContactsDemandsStats {
  pending_count: number;
  contacts_count: number;
}

export function ContactsDemandsCard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ContactsDemandsStats | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Appel de accept_and_sync_v2 en lecture seule (dry-run)
      // On passe notre propre user_id pour simuler une acceptation
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        toast.error('Utilisateur non connecté');
        return;
      }

      // Compter les demandes pending et contacts directement
      const { count: pendingCount, error: pendingError } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('to_user_id', userData.user.id)
        .eq('status', 'pending');

      const { count: contactsCount, error: contactsError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userData.user.id);

      if (pendingError || contactsError) {
        console.error('Erreur stats:', { pendingError, contactsError });
        toast.error('Erreur de chargement');
        return;
      }

      setStats({
        pending_count: pendingCount || 0,
        contacts_count: contactsCount || 0
      });

      toast.success('Stats chargées');
    } catch (error) {
      console.error('Exception loading stats:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Contacts & Demandes</h2>
        <Button
          onClick={loadStats}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {stats ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="font-medium">Demandes pending</span>
            </div>
            <span className="text-2xl font-bold">{stats.pending_count}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              <span className="font-medium">Contacts actifs</span>
            </div>
            <span className="text-2xl font-bold">{stats.contacts_count}</span>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Reflète la vérité DB en temps réel
          </p>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Cliquez sur le bouton pour charger les statistiques</p>
        </div>
      )}
    </Card>
  );
}
