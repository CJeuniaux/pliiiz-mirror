-- RPC PATCH simple pour les préférences
CREATE OR REPLACE FUNCTION patch_preferences_deep_v1(
  p_user_id uuid,
  p_patch   jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;

  -- s'assurer qu'une ligne existe dans preferences
  INSERT INTO preferences (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Mise à jour des préférences générales
  UPDATE preferences SET
    likes       = CASE WHEN p_patch ? 'likes' 
                       THEN (SELECT array_agg(value) FROM jsonb_array_elements_text(p_patch->'likes'))
                       ELSE likes END,
    dislikes    = CASE WHEN p_patch ? 'avoid'
                       THEN (SELECT array_agg(value) FROM jsonb_array_elements_text(p_patch->'avoid'))
                       ELSE dislikes END,
    gift_ideas  = CASE WHEN p_patch ? 'gift_ideas'
                       THEN (SELECT array_agg(value) FROM jsonb_array_elements_text(p_patch->'gift_ideas'))
                       ELSE gift_ideas END,
    sizes       = CASE WHEN p_patch ? 'sizes'
                       THEN COALESCE(p_patch->'sizes', sizes)
                       ELSE sizes END,
    updated_at  = now()
  WHERE user_id = p_user_id;

  -- Mise à jour des occasions dans le profil (simple merge)
  IF p_patch ? 'occasions' THEN
    UPDATE profiles SET
      occasion_prefs = COALESCE(occasion_prefs, '{}'::jsonb) || COALESCE(p_patch->'occasions', '{}'::jsonb),
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

END;
$$;