-- Fix safe_upsert_preferences to correctly handle JSONB -> text[] conversions
CREATE OR REPLACE FUNCTION public.safe_upsert_preferences(
  p_user_id UUID,
  p_updates JSONB
) RETURNS SETOF preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_likes text[];
  v_dislikes text[];
  v_allergies text[];
  v_current_wants text[];
  v_gift_ideas text[];
  v_sizes jsonb;
BEGIN
  -- Safely convert JSONB arrays to text[] when provided
  IF p_updates ? 'likes' THEN
    v_likes := ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_updates->'likes', '[]'::jsonb)));
  END IF;
  IF p_updates ? 'dislikes' THEN
    v_dislikes := ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_updates->'dislikes', '[]'::jsonb)));
  END IF;
  IF p_updates ? 'allergies' THEN
    v_allergies := ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_updates->'allergies', '[]'::jsonb)));
  END IF;
  IF p_updates ? 'current_wants' THEN
    v_current_wants := ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_updates->'current_wants', '[]'::jsonb)));
  END IF;
  IF p_updates ? 'gift_ideas' THEN
    v_gift_ideas := ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_updates->'gift_ideas', '[]'::jsonb)));
  END IF;
  IF p_updates ? 'sizes' THEN
    v_sizes := p_updates->'sizes';
  END IF;

  RETURN QUERY
  INSERT INTO preferences (
    user_id,
    likes,
    dislikes,
    allergies,
    current_wants,
    gift_ideas,
    sizes,
    updated_at
  )
  VALUES (
    p_user_id,
    COALESCE(v_likes, '{}'::text[]),
    COALESCE(v_dislikes, '{}'::text[]),
    COALESCE(v_allergies, '{}'::text[]),
    COALESCE(v_current_wants, '{}'::text[]),
    COALESCE(v_gift_ideas, '{}'::text[]),
    COALESCE(v_sizes, '{}'::jsonb),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    likes = COALESCE(v_likes, preferences.likes),
    dislikes = COALESCE(v_dislikes, preferences.dislikes),
    allergies = COALESCE(v_allergies, preferences.allergies),
    current_wants = COALESCE(v_current_wants, preferences.current_wants),
    gift_ideas = COALESCE(v_gift_ideas, preferences.gift_ideas),
    sizes = COALESCE(v_sizes, preferences.sizes),
    updated_at = now()
  RETURNING *;
END;
$$;