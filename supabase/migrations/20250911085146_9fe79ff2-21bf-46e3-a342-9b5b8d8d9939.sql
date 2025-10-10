-- Créer des contacts de test entre les utilisateurs existants
-- (Simule des demandes d'accès acceptées qui créent automatiquement des contacts)

DO $$
DECLARE
    charlotte_id uuid;
    lina_id uuid;
    alex_id uuid;
    thomas_id uuid;
    current_user_id uuid;
BEGIN
    -- Récupérer les IDs des utilisateurs créés
    SELECT user_id INTO charlotte_id FROM profiles WHERE display_name = 'Charlotte J.' LIMIT 1;
    SELECT user_id INTO lina_id FROM profiles WHERE display_name = 'Lina M.' LIMIT 1;
    SELECT user_id INTO alex_id FROM profiles WHERE display_name = 'Alex D.' LIMIT 1;
    SELECT user_id INTO thomas_id FROM profiles WHERE display_name = 'Thomas L.' LIMIT 1;
    
    -- Prendre le premier utilisateur comme utilisateur courant
    SELECT user_id INTO current_user_id FROM profiles LIMIT 1;

    -- Créer des contacts bidirectionnels si les utilisateurs existent
    IF charlotte_id IS NOT NULL AND current_user_id IS NOT NULL AND charlotte_id != current_user_id THEN
        -- Charlotte comme contact de l'utilisateur courant
        INSERT INTO contacts(owner_id, contact_user_id, created_at)
        VALUES (current_user_id, charlotte_id, now())
        ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
        
        -- L'utilisateur courant comme contact de Charlotte
        INSERT INTO contacts(owner_id, contact_user_id, created_at)
        VALUES (charlotte_id, current_user_id, now())
        ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
    END IF;

    IF lina_id IS NOT NULL AND current_user_id IS NOT NULL AND lina_id != current_user_id THEN
        -- Lina comme contact de l'utilisateur courant
        INSERT INTO contacts(owner_id, contact_user_id, created_at)
        VALUES (current_user_id, lina_id, now())
        ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
        
        -- L'utilisateur courant comme contact de Lina
        INSERT INTO contacts(owner_id, contact_user_id, created_at)
        VALUES (lina_id, current_user_id, now())
        ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
    END IF;

    IF alex_id IS NOT NULL AND current_user_id IS NOT NULL AND alex_id != current_user_id THEN
        -- Alex comme contact de l'utilisateur courant
        INSERT INTO contacts(owner_id, contact_user_id, created_at)
        VALUES (current_user_id, alex_id, now())
        ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
        
        -- L'utilisateur courant comme contact d'Alex
        INSERT INTO contacts(owner_id, contact_user_id, created_at)
        VALUES (alex_id, current_user_id, now())
        ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
    END IF;

    IF thomas_id IS NOT NULL AND current_user_id IS NOT NULL AND thomas_id != current_user_id THEN
        -- Thomas comme contact de l'utilisateur courant
        INSERT INTO contacts(owner_id, contact_user_id, created_at)
        VALUES (current_user_id, thomas_id, now())
        ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
        
        -- L'utilisateur courant comme contact de Thomas
        INSERT INTO contacts(owner_id, contact_user_id, created_at)
        VALUES (thomas_id, current_user_id, now())
        ON CONFLICT (owner_id, contact_user_id) DO NOTHING;
    END IF;
    
END $$;