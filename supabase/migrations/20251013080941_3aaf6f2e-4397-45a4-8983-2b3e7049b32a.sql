-- Function to fetch current user's requests with other user's profile data
CREATE OR REPLACE FUNCTION public.get_my_requests_enhanced()
RETURNS TABLE(
  id uuid,
  from_user_id uuid,
  to_user_id uuid,
  event_id uuid,
  message text,
  status text,
  created_at timestamptz,
  other_user_id uuid,
  other_first_name text,
  other_last_name text,
  other_avatar_url text,
  other_city text,
  other_birthday date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    r.id,
    r.from_user_id,
    r.to_user_id,
    r.event_id,
    r.message,
    r.status,
    r.created_at,
    CASE WHEN r.from_user_id = auth.uid() THEN r.to_user_id ELSE r.from_user_id END AS other_user_id,
    p.first_name AS other_first_name,
    p.last_name AS other_last_name,
    p.avatar_url AS other_avatar_url,
    p.city AS other_city,
    p.birthday AS other_birthday
  FROM requests r
  LEFT JOIN profiles p 
    ON p.user_id = CASE WHEN r.from_user_id = auth.uid() THEN r.to_user_id ELSE r.from_user_id END
  WHERE r.from_user_id = auth.uid() OR r.to_user_id = auth.uid()
  ORDER BY r.created_at DESC;
$$;