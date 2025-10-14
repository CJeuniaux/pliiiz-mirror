-- Créer une notification de test d'anniversaire pour Charlotte
INSERT INTO public.notifications (
  user_id,
  type,
  message,
  payload,
  created_at
) VALUES (
  'ce48c3ea-3224-4763-945d-849f45d7a6ce',
  'birthday_upcoming',
  'Anniversaire de Pliiiz App dans 21 jours',
  jsonb_build_object(
    'contact_user_id', 'test-contact-id',
    'contact_name', 'Pliiiz App',
    'days_until', 21,
    'date', (CURRENT_DATE + INTERVAL '21 days')::text,
    'year', EXTRACT(YEAR FROM CURRENT_DATE + INTERVAL '21 days'),
    'milestone', 21
  ),
  NOW()
);