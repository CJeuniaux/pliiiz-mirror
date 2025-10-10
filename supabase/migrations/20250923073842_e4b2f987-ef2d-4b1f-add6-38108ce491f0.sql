-- Corriger la contrainte de type pour permettre birthday_upcoming
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Ajouter la nouvelle contrainte avec le type birthday_upcoming
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('preferences_updated', 'contact_accepted', 'request_received', 'birthday_upcoming'));