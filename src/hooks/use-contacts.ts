import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContactProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ContactRow {
  contact_id: string;
  status: string;
  contact: ContactProfile | null;
}

export function useContacts(options: { status?: string; search?: string } = {}) {
  const { status = 'accepted', search = '' } = options;
  const [data, setData] = useState<ContactRow[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    console.log('[RLS HINT] Vérifier policies RLS sur contacts et profiles');
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    let mounted = true;
    
    (async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) throw new Error('NO_SESSION');

        // Utiliser rpc ou une requête simplifiée pour éviter la récursion TypeScript
        const query = supabase.rpc('get_user_contacts', { user_uuid: user.id });
        
        const response = await query;
        
        if (response.error) throw response.error;

        const result: ContactRow[] = (response.data || [])
          .filter((r: any) => !status || r.status === status)
          .map((r: any) => ({
            contact_id: r.user_id,
            status: r.status || 'accepted',
            contact: {
              id: r.user_id,
              display_name: r.display_name || r.alias || 'Contact',
              avatar_url: r.avatar_url
            }
          }))
          .filter((row: ContactRow) => {
            if (!search) return true;
            return row.contact?.display_name?.toLowerCase().includes(search.toLowerCase()) ?? false;
          });

        if (mounted) setData(result);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [status, search]);

  return { 
    data, 
    error, 
    loading, 
    userId, 
    refresh: () => window.location.reload(),
    hasData: data.length > 0
  };
}
