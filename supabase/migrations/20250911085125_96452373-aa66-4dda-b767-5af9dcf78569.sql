-- Mettre à jour les profils existants avec des noms et regift activé
UPDATE profiles SET 
  display_name = CASE 
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 0) THEN 'Charlotte J.'
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 1) THEN 'Lina M.'
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 2) THEN 'Alex D.'
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 3) THEN 'Thomas L.'
    ELSE display_name
  END,
  first_name = CASE 
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 0) THEN 'Charlotte'
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 1) THEN 'Lina'
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 2) THEN 'Alex'
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 3) THEN 'Thomas'
    ELSE first_name
  END,
  last_name = CASE 
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 0) THEN 'Jeuniaux'
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 1) THEN 'Martin'
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 2) THEN 'Durand'
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 3) THEN 'Leblanc'
    ELSE last_name
  END,
  regift_enabled = CASE 
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 0) THEN true  -- Charlotte
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 1) THEN true  -- Lina
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 2) THEN false -- Alex
    WHEN user_id = (SELECT user_id FROM profiles LIMIT 1 OFFSET 3) THEN true  -- Thomas
    ELSE regift_enabled
  END;

-- Insérer des préférences pour les utilisateurs existants
DO $$
DECLARE
    charlotte_id uuid;
    lina_id uuid;
    alex_id uuid;
    thomas_id uuid;
BEGIN
    -- Récupérer les IDs des utilisateurs
    SELECT user_id INTO charlotte_id FROM profiles WHERE display_name = 'Charlotte J.' LIMIT 1;
    SELECT user_id INTO lina_id FROM profiles WHERE display_name = 'Lina M.' LIMIT 1;
    SELECT user_id INTO alex_id FROM profiles WHERE display_name = 'Alex D.' LIMIT 1;
    SELECT user_id INTO thomas_id FROM profiles WHERE display_name = 'Thomas L.' LIMIT 1;

    -- Insérer les préférences si les utilisateurs existent
    IF charlotte_id IS NOT NULL THEN
        INSERT INTO preferences (user_id, current_wants, likes, dislikes) VALUES
        (charlotte_id, 
         ARRAY['Livres de cuisine', 'Plantes d''intérieur', 'Bougies parfumées'], 
         ARRAY['Cuisine', 'Décoration', 'Lecture'],
         ARRAY['Parfums forts'])
        ON CONFLICT (user_id) DO UPDATE SET
          current_wants = EXCLUDED.current_wants,
          likes = EXCLUDED.likes,
          dislikes = EXCLUDED.dislikes;
    END IF;

    IF lina_id IS NOT NULL THEN
        INSERT INTO preferences (user_id, current_wants, likes, dislikes) VALUES
        (lina_id, 
         ARRAY['Matériel de peinture', 'Carnets de voyage', 'Thé premium'], 
         ARRAY['Art', 'Voyages', 'Thé'],
         ARRAY['Couleurs flashy'])
        ON CONFLICT (user_id) DO UPDATE SET
          current_wants = EXCLUDED.current_wants,
          likes = EXCLUDED.likes,
          dislikes = EXCLUDED.dislikes;
    END IF;

    IF alex_id IS NOT NULL THEN
        INSERT INTO preferences (user_id, current_wants, likes, dislikes) VALUES
        (alex_id, 
         ARRAY['Équipement sportif', 'Livres de science-fiction'], 
         ARRAY['Sport', 'Science-fiction', 'Technologie'],
         ARRAY['Objets fragiles'])
        ON CONFLICT (user_id) DO UPDATE SET
          current_wants = EXCLUDED.current_wants,
          likes = EXCLUDED.likes,
          dislikes = EXCLUDED.dislikes;
    END IF;

    IF thomas_id IS NOT NULL THEN
        INSERT INTO preferences (user_id, current_wants, likes, dislikes) VALUES
        (thomas_id, 
         ARRAY['Vinyles classiques', 'Accessoires de cuisine', 'Livres d''architecture'], 
         ARRAY['Musique', 'Architecture', 'Cuisine'],
         ARRAY['Objets en plastique'])
        ON CONFLICT (user_id) DO UPDATE SET
          current_wants = EXCLUDED.current_wants,
          likes = EXCLUDED.likes,
          dislikes = EXCLUDED.dislikes;
    END IF;
END $$;