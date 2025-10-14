-- Activer l'extension pg_cron pour les tâches planifiées
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer la tâche cron pour générer les notifications d'anniversaire
-- Tous les jours à 6h00 du matin (Europe/Paris)
SELECT cron.schedule(
  'birthday-notifications-daily',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://afyxwaprjecyormhnncl.supabase.co/functions/v1/birthday-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmeXh3YXByamVjeW9ybWhubmNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgxOTgzMSwiZXhwIjoyMDcyMzk1ODMxfQ.xYlGcBgzKx03bWdNIIr6pNNu21bTpCW0HYJZzRWCjrw"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);