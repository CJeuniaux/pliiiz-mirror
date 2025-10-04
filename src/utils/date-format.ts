import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatEventDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMM', { locale: fr });
}

export function formatEventLabel(eventType: string, date: Date | string | null): string {
  if (!date) {
    return `${eventType} — à planifier`;
  }
  return `${eventType} — ${formatEventDate(date)}`;
}