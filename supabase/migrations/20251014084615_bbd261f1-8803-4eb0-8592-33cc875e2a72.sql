-- Ajouter contrainte unique pour éviter les doublons de notifications d'anniversaire
-- (1 notif par an/contact/jalon)
CREATE UNIQUE INDEX IF NOT EXISTS unique_birthday_reminder_per_year_milestone
ON notifications (user_id, type, (payload->>'contact_id'), (payload->>'year'), (payload->>'days_before'))
WHERE type = 'birthday_reminder';