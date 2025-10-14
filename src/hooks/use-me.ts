import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

interface MeData {
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    city?: string;
    country?: string;
    birthday?: string;
  };
  shareUrl: string | null;
  shareLink: {
    slug: string | null;
    is_active: boolean;
  };
}

export function useMe() {
  const { user } = useAuth();
  const [data, setData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: meData, error: meError } = await supabase.functions.invoke('me');

        if (meError) {
          throw meError;
        }

        setData(meData);
      } catch (err: any) {
        console.error('Error fetching /me:', err);
        setError(err.message || 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [user]);

  return { data, loading, error };
}
