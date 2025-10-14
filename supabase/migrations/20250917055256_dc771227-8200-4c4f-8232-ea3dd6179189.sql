-- Helper deep merge (objet JSONB)
CREATE OR REPLACE FUNCTION jsonb_deep_merge(a jsonb, b jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
SELECT
  CASE
    WHEN a IS NULL OR a = 'null'::jsonb THEN b
    WHEN b IS NULL OR b = 'null'::jsonb THEN a
    WHEN jsonb_typeof(a) <> 'object' OR jsonb_typeof(b) <> 'object' THEN b
    ELSE (
      SELECT jsonb_object_agg(k,
        CASE
          WHEN jsonb_typeof(av)='object' AND jsonb_typeof(bv)='object'
            THEN jsonb_deep_merge(av, bv)
          ELSE COALESCE(bv, av)
        END)
      FROM (
        SELECT COALESCE(ka, kb) AS k,
               a->COALESCE(ka, kb) AS av,
               b->COALESCE(ka, kb) AS bv
        FROM (SELECT key AS ka FROM jsonb_object_keys(a)) aa
        FULL JOIN (SELECT key AS kb FROM jsonb_object_keys(b)) bb
          ON aa.ka = bb.kb
      ) s
    )
  END;
$$;

-- RPC PATCH unique (merge) couvrant TOUTES les préfs
CREATE OR REPLACE FUNCTION patch_preferences_deep_v1(
  p_user_id uuid,
  p_patch   jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_version bigint;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;

  -- s'assurer qu'une ligne existe
  INSERT INTO preferences (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- merge clés top-level, deep-merge pour occasions
  UPDATE preferences SET
    likes       = CASE WHEN p_patch ? 'likes' 
                       THEN (SELECT jsonb_agg(value) FROM jsonb_array_elements_text(p_patch->'likes'))
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

  -- Mise à jour des occasions dans le profil
  UPDATE profiles SET
    occasion_prefs = CASE WHEN p_patch ? 'occasions'
                          THEN jsonb_deep_merge(COALESCE(occasion_prefs, '{}'::jsonb), COALESCE(p_patch->'occasions','{}'::jsonb))
                          ELSE occasion_prefs
                     END,
    updated_at = now()
  WHERE user_id = p_user_id;

END;
$$;

-- Garde-fou anti "wipe total" (facultatif mais recommandé)
CREATE OR REPLACE FUNCTION preferences_no_total_wipe()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='UPDATE'
     AND coalesce(array_length(NEW.likes,1),0)=0
     AND coalesce(array_length(NEW.dislikes,1),0)=0
     AND coalesce(array_length(NEW.gift_ideas,1),0)=0
     AND NEW.sizes='{}'::jsonb
     AND (OLD.likes<>'{}' OR OLD.dislikes<>'{}' OR OLD.gift_ideas<>'{}' OR OLD.sizes<>'{}'::jsonb)
  THEN RAISE EXCEPTION 'patch would wipe all preferences';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_preferences_no_total_wipe ON preferences;
CREATE TRIGGER trg_preferences_no_total_wipe
BEFORE UPDATE ON preferences FOR EACH ROW EXECUTE FUNCTION preferences_no_total_wipe();