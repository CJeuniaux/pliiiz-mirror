-- Ajouter le champ timezone à la table profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Paris';

-- Modifier la table notifications existante pour les rappels d'anniversaires
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS fire_at timestamptz,
ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE;

-- Supprimer l'ancienne contrainte
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Ajouter la contrainte unique pour éviter les doublons
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS unique_birthday_reminder;
ALTER TABLE public.notifications
ADD CONSTRAINT unique_birthday_reminder UNIQUE (user_id, contact_id, type, fire_at);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_fire ON public.notifications(user_id, fire_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_pending ON public.notifications(fire_at) WHERE read_at IS NULL;

-- Vue pour calculer les prochaines dates d'anniversaire
CREATE OR REPLACE VIEW public.v_contacts_next_birthday AS
SELECT
  c.id as contact_id,
  c.owner_id as user_id,
  c.contact_user_id,
  p.first_name,
  p.last_name,
  p.birthday,
  p.avatar_url,
  COALESCE(p.timezone, 'Europe/Paris') as timezone,
  -- Calculer la prochaine date d'anniversaire
  CASE
    WHEN p.birthday IS NULL THEN NULL
    WHEN EXTRACT(MONTH FROM p.birthday) = 2 AND EXTRACT(DAY FROM p.birthday) = 29 THEN
      CASE
        WHEN MAKE_DATE(
          EXTRACT(YEAR FROM CURRENT_DATE)::int,
          2,
          CASE 
            WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int % 4 = 0 
              AND (EXTRACT(YEAR FROM CURRENT_DATE)::int % 100 != 0 OR EXTRACT(YEAR FROM CURRENT_DATE)::int % 400 = 0)
            THEN 29 
            ELSE 28 
          END
        ) < CURRENT_DATE THEN
          MAKE_DATE(
            (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::int,
            2,
            CASE 
              WHEN (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::int % 4 = 0 
                AND ((EXTRACT(YEAR FROM CURRENT_DATE) + 1)::int % 100 != 0 OR (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::int % 400 = 0)
              THEN 29 
              ELSE 28 
            END
          )
        ELSE
          MAKE_DATE(
            EXTRACT(YEAR FROM CURRENT_DATE)::int,
            2,
            CASE 
              WHEN EXTRACT(YEAR FROM CURRENT_DATE)::int % 4 = 0 
                AND (EXTRACT(YEAR FROM CURRENT_DATE)::int % 100 != 0 OR EXTRACT(YEAR FROM CURRENT_DATE)::int % 400 = 0)
              THEN 29 
              ELSE 28 
            END
          )
      END
    ELSE
      CASE
        WHEN MAKE_DATE(
          EXTRACT(YEAR FROM CURRENT_DATE)::int,
          EXTRACT(MONTH FROM p.birthday)::int,
          EXTRACT(DAY FROM p.birthday)::int
        ) < CURRENT_DATE THEN
          MAKE_DATE(
            (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::int,
            EXTRACT(MONTH FROM p.birthday)::int,
            EXTRACT(DAY FROM p.birthday)::int
          )
        ELSE
          MAKE_DATE(
            EXTRACT(YEAR FROM CURRENT_DATE)::int,
            EXTRACT(MONTH FROM p.birthday)::int,
            EXTRACT(DAY FROM p.birthday)::int
          )
      END
  END as next_birthday,
  -- Calculer l'âge à venir
  CASE
    WHEN p.birthday IS NOT NULL AND EXTRACT(YEAR FROM p.birthday) > 1900 THEN
      CASE
        WHEN MAKE_DATE(
          EXTRACT(YEAR FROM CURRENT_DATE)::int,
          EXTRACT(MONTH FROM p.birthday)::int,
          LEAST(EXTRACT(DAY FROM p.birthday)::int, 28)
        ) < CURRENT_DATE THEN
          (EXTRACT(YEAR FROM CURRENT_DATE) + 1)::int - EXTRACT(YEAR FROM p.birthday)::int
        ELSE
          EXTRACT(YEAR FROM CURRENT_DATE)::int - EXTRACT(YEAR FROM p.birthday)::int
      END
    ELSE NULL
  END as upcoming_age
FROM public.contacts c
LEFT JOIN public.profiles p ON p.user_id = c.contact_user_id
WHERE p.birthday IS NOT NULL;