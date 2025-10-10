-- Create functions to fetch requests with user profile data
CREATE OR REPLACE FUNCTION public.get_user_sent_requests(user_uuid uuid)
RETURNS TABLE(
  id uuid,
  from_user_id uuid,
  to_user_id uuid,
  event_id uuid,
  message text,
  status text,
  created_at timestamp with time zone,
  to_user_name text,
  to_user_avatar text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    r.id,
    r.from_user_id,
    r.to_user_id,
    r.event_id,
    r.message,
    r.status,
    r.created_at,
    COALESCE(p.first_name || ' ' || COALESCE(p.last_name, ''), p.first_name, 'Utilisateur') as to_user_name,
    p.avatar_url as to_user_avatar
  FROM requests r
  LEFT JOIN profiles p ON p.user_id = r.to_user_id
  WHERE r.from_user_id = user_uuid
  ORDER BY r.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_user_received_requests(user_uuid uuid)
RETURNS TABLE(
  id uuid,
  from_user_id uuid,
  to_user_id uuid,
  event_id uuid,
  message text,
  status text,
  created_at timestamp with time zone,
  from_user_name text,
  from_user_avatar text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    r.id,
    r.from_user_id,
    r.to_user_id,
    r.event_id,
    r.message,
    r.status,
    r.created_at,
    COALESCE(p.first_name || ' ' || COALESCE(p.last_name, ''), p.first_name, 'Utilisateur') as from_user_name,
    p.avatar_url as from_user_avatar
  FROM requests r
  LEFT JOIN profiles p ON p.user_id = r.from_user_id
  WHERE r.to_user_id = user_uuid
  ORDER BY r.created_at DESC;
$$;