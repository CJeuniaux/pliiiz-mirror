-- Fonction pour envoyer un push quand une notification est créée
CREATE OR REPLACE FUNCTION public.send_push_on_notification_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id TEXT;
  v_contact_name TEXT;
  v_days_before INT;
  v_link TEXT;
  v_title TEXT;
  v_content TEXT;
  v_function_url TEXT;
BEGIN
  -- Traiter uniquement les notifications d'anniversaire
  IF NEW.type = 'birthday_reminder' THEN
    v_contact_id := (NEW.payload->>'contact_id');
    v_contact_name := (NEW.payload->>'contact_name');
    v_days_before := (NEW.payload->>'days_before')::int;
    v_title := v_contact_name || ' fête bientôt son anniversaire';
    v_content := 'J-' || v_days_before::text;
    v_link := '/profil/' || v_contact_id;

    -- URL de l'edge function (à adapter selon votre projet)
    v_function_url := 'https://afyxwaprjecyormhnncl.supabase.co/functions/v1/send-push';

    -- Appeler l'edge function pour envoyer le push
    PERFORM
      net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'sub'
        ),
        body := jsonb_build_object(
          'user_ids', jsonb_build_array(NEW.user_id),
          'heading', v_title,
          'content', v_content,
          'url', v_link
        )
      );

    RAISE NOTICE 'Push notification triggered for user % (% J-%)', NEW.user_id, v_contact_name, v_days_before;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trg_push_on_notification ON public.notifications;

CREATE TRIGGER trg_push_on_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_push_on_notification_insert();