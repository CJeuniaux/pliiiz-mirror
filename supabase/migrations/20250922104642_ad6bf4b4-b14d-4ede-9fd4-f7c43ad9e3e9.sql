-- Update patch_preferences_deep_v1 to handle allergies
CREATE OR REPLACE FUNCTION public.patch_preferences_deep_v1(p_user_id uuid, p_patch jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_global jsonb;
  new_global jsonb;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='42501';
  END IF;

  -- Récupérer les préférences globales actuelles
  SELECT COALESCE(global_preferences, '{"avoid": [], "likes": [], "sizes": {}, "allergies": [], "giftIdeas": []}'::jsonb)
  INTO current_global
  FROM profiles 
  WHERE user_id = p_user_id;

  -- Construire les nouvelles préférences globales
  new_global := current_global;
  
  IF p_patch ? 'likes' THEN
    new_global := jsonb_set(new_global, '{likes}', p_patch->'likes');
  END IF;
  
  IF p_patch ? 'avoid' THEN
    new_global := jsonb_set(new_global, '{avoid}', p_patch->'avoid');
  END IF;
  
  IF p_patch ? 'allergies' THEN
    new_global := jsonb_set(new_global, '{allergies}', p_patch->'allergies');
  END IF;
  
  IF p_patch ? 'gift_ideas' THEN
    new_global := jsonb_set(new_global, '{giftIdeas}', p_patch->'gift_ideas');
  END IF;
  
  IF p_patch ? 'sizes' THEN
    new_global := jsonb_set(new_global, '{sizes}', p_patch->'sizes');
  END IF;

  -- Mettre à jour le profil avec les nouvelles préférences
  UPDATE profiles SET
    global_preferences = new_global,
    occasion_prefs = CASE 
      WHEN p_patch ? 'occasions' 
      THEN COALESCE(occasion_prefs, '{}'::jsonb) || COALESCE(p_patch->'occasions', '{}'::jsonb)
      ELSE occasion_prefs 
    END,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- S'assurer qu'un profil existe si pas encore créé
  IF NOT FOUND THEN
    INSERT INTO profiles (user_id, global_preferences, occasion_prefs)
    VALUES (
      p_user_id,
      new_global,
      COALESCE(p_patch->'occasions', '{}'::jsonb)
    );
  END IF;

END;
$function$;