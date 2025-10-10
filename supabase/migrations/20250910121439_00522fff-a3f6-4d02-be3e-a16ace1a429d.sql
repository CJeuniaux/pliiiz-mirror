-- Correction des problèmes de sécurité pour la vue public_profiles

-- Ajout de RLS sur la vue public_profiles
ALTER VIEW public_profiles SET (security_barrier = true);

-- Politique RLS pour la vue public_profiles (même logique que les profiles)
CREATE POLICY public_profiles_sel_self_or_ctc ON public_profiles
FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM requests r 
    WHERE ((r.to_user_id = auth.uid() AND r.from_user_id = public_profiles.user_id)
           OR (r.from_user_id = auth.uid() AND r.to_user_id = public_profiles.user_id))
    AND r.status = 'accepted'
  )
);

-- Activer RLS sur la vue
ALTER VIEW public_profiles ENABLE ROW LEVEL SECURITY;