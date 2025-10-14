-- Ajouter contrainte unique sur gift_idea_hash pour permettre l'upsert
ALTER TABLE gift_idea_unsplash 
ADD CONSTRAINT gift_idea_hash_unique UNIQUE (gift_idea_hash);