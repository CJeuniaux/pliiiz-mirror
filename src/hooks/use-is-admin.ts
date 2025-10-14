import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAdminRole() {
      // Wait for auth to finish before deciding
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Exception checking admin role:', err);
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkAdminRole();

    return () => { cancelled = true; };
  }, [user, authLoading]);

  return { isAdmin, loading };
}
