-- Create partners table with sample data for testing
INSERT INTO partners (name, address, lat, lng, regift_compatible, url, google_place_id) VALUES
('Chocolaterie Artisanale', '123 Rue des Délices, 75001 Paris, France', 48.8566, 2.3522, true, 'https://chocolaterie-artisanale.fr', 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ'),
('Maison du Chocolat', '456 Avenue Gourmande, 75002 Paris, France', 48.8698, 2.3388, false, 'https://maisonchocolat.fr', 'ChIJL3oGaO1v5kcR8BcUnKwCCwE'),
('Café des Amis', '789 Place du Marché, 75003 Paris, France', 48.8630, 2.3292, true, 'https://cafedesamis.fr', 'ChIJFzNKsO1v5kcRYJ8MaMOCCwF')
ON CONFLICT (name) DO UPDATE SET
  address = EXCLUDED.address,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  regift_compatible = EXCLUDED.regift_compatible,
  url = EXCLUDED.url,
  google_place_id = EXCLUDED.google_place_id;

-- Add more sample data for different categories
INSERT INTO partners (name, address, lat, lng, regift_compatible, url, google_place_id) VALUES
('Librairie du Monde', '12 Boulevard Saint-Germain, 75005 Paris, France', 48.8499, 2.3486, true, 'https://librairie-monde.fr', 'ChIJZ7fiBh9u5kcRYJSMaMOCCwZ'),
('Boutique Fleurs & Co', '34 Rue de Rivoli, 75004 Paris, France', 48.8568, 2.3554, false, 'https://fleursco.fr', 'ChIJF3oGaO1v5kcR8BcUnKwCCwB'),
('Maison de Thé', '56 Avenue des Champs, 75008 Paris, France', 48.8738, 2.2950, true, 'https://maisonthe.fr', 'ChIJMzNKsO1v5kcRYJ8MaMOCCwM')
ON CONFLICT (name) DO UPDATE SET
  address = EXCLUDED.address,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  regift_compatible = EXCLUDED.regift_compatible,
  url = EXCLUDED.url,
  google_place_id = EXCLUDED.google_place_id;