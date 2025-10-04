-- Insérer des profils de test avec regift activé et des préférences
INSERT INTO profiles (user_id, display_name, regift_enabled, first_name, last_name) VALUES
('11111111-1111-1111-1111-111111111111', 'Charlotte J.', true, 'Charlotte', 'Jeuniaux'),
('22222222-2222-2222-2222-222222222222', 'Lina M.', true, 'Lina', 'Martin'),
('33333333-3333-3333-3333-333333333333', 'Alex D.', false, 'Alex', 'Durand'),
('44444444-4444-4444-4444-444444444444', 'Thomas L.', true, 'Thomas', 'Leblanc')
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  regift_enabled = EXCLUDED.regift_enabled,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Insérer des préférences avec current_wants (envies)
INSERT INTO preferences (user_id, current_wants, likes, dislikes) VALUES
('11111111-1111-1111-1111-111111111111', 
 ARRAY['Livres de cuisine', 'Plantes d''intérieur', 'Bougies parfumées'], 
 ARRAY['Cuisine', 'Décoration', 'Lecture'],
 ARRAY['Parfums forts']),
('22222222-2222-2222-2222-222222222222', 
 ARRAY['Matériel de peinture', 'Carnets de voyage', 'Thé premium'], 
 ARRAY['Art', 'Voyages', 'Thé'],
 ARRAY['Couleurs flashy']),
('33333333-3333-3333-3333-333333333333', 
 ARRAY['Équipement sportif', 'Livres de science-fiction'], 
 ARRAY['Sport', 'Science-fiction', 'Technologie'],
 ARRAY['Objets fragiles']),
('44444444-4444-4444-4444-444444444444', 
 ARRAY['Vinyles classiques', 'Accessoires de cuisine', 'Livres d''architecture'], 
 ARRAY['Musique', 'Architecture', 'Cuisine'],
 ARRAY['Objets en plastique'])
ON CONFLICT (user_id) DO UPDATE SET
  current_wants = EXCLUDED.current_wants,
  likes = EXCLUDED.likes,
  dislikes = EXCLUDED.dislikes;