-- Purge de tous les partenaires existants pour permettre un réenrichissement complet
TRUNCATE TABLE partners RESTART IDENTITY CASCADE;