-- === RLS : PROFILES (lecture/écriture par le propriétaire) =========
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prof_sel_self ON profiles;
DROP POLICY IF EXISTS prof_ins_self ON profiles;
DROP POLICY IF EXISTS prof_upd_self ON profiles;

CREATE POLICY prof_sel_self ON profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY prof_ins_self ON profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY prof_upd_self ON profiles
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- === RLS : PREFERENCES (upsert par l'utilisateur) ===================
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pref_all_self ON preferences;
CREATE POLICY pref_all_self ON preferences
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'preferences_unique_user_cat_key'
  ) THEN
    CREATE UNIQUE INDEX preferences_unique_user_cat_key
      ON preferences(user_id, category, key);
  END IF;
END $$;

-- === RLS : EVENTS (proprio & invités) ===============================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS evt_sel ON events;
DROP POLICY IF EXISTS evt_ins ON events;
DROP POLICY IF EXISTS evt_upd ON events;

CREATE POLICY evt_sel ON events
FOR SELECT USING (
  auth.uid() = owner_id
  OR EXISTS (
    SELECT 1 FROM event_invites ei
     WHERE ei.event_id = events.id
       AND ei.user_id = auth.uid()
       AND ei.status <> 'declined'
  )
);

CREATE POLICY evt_ins ON events
FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY evt_upd ON events
FOR UPDATE USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- === RLS : EVENT_INVITES ===========================================
ALTER TABLE event_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invi_sel ON event_invites;
DROP POLICY IF EXISTS invi_ins_owner ON event_invites;
DROP POLICY IF EXISTS invi_upd_guest ON event_invites;

CREATE POLICY invi_sel ON event_invites
FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM events e
              WHERE e.id = event_invites.event_id
                AND e.owner_id = auth.uid())
);

CREATE POLICY invi_ins_owner ON event_invites
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events e
           WHERE e.id = event_invites.event_id
             AND e.owner_id = auth.uid())
);

CREATE POLICY invi_upd_guest ON event_invites
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- === RLS : CONTACTS (propriétaire du carnet) =======================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ctc_all_owner ON contacts;
CREATE POLICY ctc_all_owner ON contacts
FOR ALL USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- === RLS : REQUESTS (demande d'accès) ==============================
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS req_sel ON requests;
DROP POLICY IF EXISTS req_ins ON requests;
DROP POLICY IF EXISTS req_upd ON requests;

-- Voir si je suis emetteur OU destinataire
CREATE POLICY req_sel ON requests
FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Créer une demande : je dois être l'émetteur
CREATE POLICY req_ins ON requests
FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Mise à jour du statut :
-- - l'émetteur peut annuler (draft -> cancelled)
-- - le destinataire peut passer à accepted/declined
CREATE POLICY req_upd ON requests
FOR UPDATE USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
)
WITH CHECK (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);

-- === TRIGGER : si request.accepted => créer contacts (dans les 2 sens) ===
CREATE OR REPLACE FUNCTION make_contacts_on_accept()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'accepted'
     AND COALESCE(OLD.status,'') <> 'accepted' THEN

    INSERT INTO contacts(owner_id, contact_user_id, alias, created_at)
    VALUES (NEW.from_user_id, NEW.to_user_id, NULL, now())
    ON CONFLICT DO NOTHING;

    INSERT INTO contacts(owner_id, contact_user_id, alias, created_at)
    VALUES (NEW.to_user_id, NEW.from_user_id, NULL, now())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_requests_accept ON requests;
CREATE TRIGGER trg_requests_accept
AFTER UPDATE ON requests
FOR EACH ROW EXECUTE FUNCTION make_contacts_on_accept();

-- === VUE : annuaire (tous les inscrits, infos minimales) ===========
DROP VIEW IF EXISTS directory_profiles;
CREATE VIEW directory_profiles AS
SELECT
  p.user_id           AS user_id,
  COALESCE(p.first_name || ' ' || p.last_name, 'Utilisateur') AS name,
  p.regift_enabled    AS regift,
  p.bio,
  p.updated_at
FROM profiles p;

-- RLS : lecture libre pour les utilisateurs connectés
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_public_name ON auth.users;
CREATE POLICY users_public_name ON auth.users
FOR SELECT USING (true);