-- Mettre à jour la notification de test pour inclure l'avatar et les données d'acteur
UPDATE public.notifications 
SET 
  actor_user_id = 'test-contact-id',
  actor_name = 'Pliiiz App',
  actor_avatar_url = '/placeholder.svg',
  message = '🎂 Anniversaire de Pliiiz App dans 21 jours'
WHERE type = 'birthday_upcoming' 
  AND user_id = 'ce48c3ea-3224-4763-945d-849f45d7a6ce';