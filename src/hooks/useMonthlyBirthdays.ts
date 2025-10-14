import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, isWithinInterval, differenceInCalendarDays } from 'date-fns';

export interface MonthlyBirthdayContact {
  contact_id: string;
  user_id: string;
  contact_user_id: string;
  first_name: string;
  last_name: string | null;
  birthday: string;
  avatar_url: string | null;
  timezone: string;
  next_birthday: string;
  upcoming_age: number | null;
  days_until: number;
}

export function useMonthlyBirthdays(userId?: string) {
  const [data, setData] = useState<MonthlyBirthdayContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchBirthdays = async () => {
      try {
        setLoading(true);
        const { data: birthdays, error: fetchError } = await supabase
          .from('v_contacts_next_birthday')
          .select('*')
          .eq('user_id', userId);

        if (fetchError) throw fetchError;

        if (!birthdays) {
          setData([]);
          return;
        }

        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());

        // Filtrer les anniversaires du mois et calculer les jours restants
        const inMonth = birthdays
          .filter((c) => {
            if (!c.next_birthday) return false;
            const nextDate = new Date(c.next_birthday);
            return isWithinInterval(nextDate, { start, end });
          })
          .map((c) => {
            const nextDate = new Date(c.next_birthday);
            const days = differenceInCalendarDays(nextDate, new Date());
            return {
              ...c,
              days_until: days,
            };
          })
          .sort((a, b) => a.days_until - b.days_until);

        setData(inMonth as MonthlyBirthdayContact[]);
      } catch (err) {
        console.error('Error fetching monthly birthdays:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchBirthdays();
  }, [userId]);

  return { data, loading, error };
}
