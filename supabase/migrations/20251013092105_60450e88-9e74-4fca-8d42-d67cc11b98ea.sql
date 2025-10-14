-- ====== Vues pour Contacts & Demandes ======
CREATE OR REPLACE VIEW public.vw_contacts_full AS
SELECT
  c.owner_id,
  po.first_name || ' ' || COALESCE(po.last_name, '') as owner_name,
  c.contact_user_id as contact_id,
  pc.first_name || ' ' || COALESCE(pc.last_name, '') as contact_name,
  c.created_at
FROM public.contacts c
LEFT JOIN public.profiles po ON po.user_id = c.owner_id
LEFT JOIN public.profiles pc ON pc.user_id = c.contact_user_id;

CREATE OR REPLACE VIEW public.vw_requests_full AS
SELECT
  r.id,
  r.from_user_id,
  pf.first_name || ' ' || COALESCE(pf.last_name, '') as from_name,
  r.to_user_id,
  pt.first_name || ' ' || COALESCE(pt.last_name, '') as to_name,
  r.status,
  r.created_at,
  r.created_at as updated_at
FROM public.requests r
LEFT JOIN public.profiles pf ON pf.user_id = r.from_user_id
LEFT JOIN public.profiles pt ON pt.user_id = r.to_user_id;

CREATE OR REPLACE VIEW public.vw_accepted_without_contact AS
WITH pairs AS (
  SELECT from_user_id as a, to_user_id as b, created_at as updated_at
  FROM public.requests WHERE status = 'accepted'
),
links AS (
  SELECT owner_id as a, contact_user_id as b FROM public.contacts
)
SELECT p.*
FROM pairs p
LEFT JOIN links l ON l.a = p.a AND l.b = p.b
WHERE l.a IS NULL;

-- ====== Tables pour logs de requêtes gifts ======
CREATE TABLE IF NOT EXISTS public.gift_query_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  query_text text NOT NULL,
  normalized text GENERATED ALWAYS AS (lower(trim(query_text))) STORED,
  matched_gift_id uuid,
  merchant_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gql_created ON public.gift_query_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gql_norm ON public.gift_query_logs USING gin (to_tsvector('simple', normalized));

-- ====== Table des enseignes ======
CREATE TABLE IF NOT EXISTS public.merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  external_url text,
  logo_url text,
  active bool DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ====== Association Gift ↔ Enseigne ======
CREATE TABLE IF NOT EXISTS public.gift_item_merchants (
  gift_id uuid NOT NULL,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  relevance int DEFAULT 50,
  PRIMARY KEY (gift_id, merchant_id)
);

-- ====== Vues pour les requêtes gifts ======
CREATE OR REPLACE VIEW public.vw_gift_query_terms AS
SELECT
  normalized as term,
  count(*)::int as hits,
  count(DISTINCT user_id)::int as users,
  min(created_at) as first_seen,
  max(created_at) as last_seen
FROM public.gift_query_logs
GROUP BY normalized
ORDER BY hits DESC;

CREATE OR REPLACE VIEW public.vw_gift_query_details AS
SELECT
  l.id,
  l.created_at,
  l.user_id,
  p.first_name || ' ' || COALESCE(p.last_name, '') as user_name,
  l.query_text,
  l.normalized as term,
  l.matched_gift_id,
  l.merchant_id
FROM public.gift_query_logs l
LEFT JOIN public.profiles p ON p.user_id = l.user_id
ORDER BY l.created_at DESC;

-- ====== RPC pour compteurs ======
CREATE OR REPLACE FUNCTION public.fn_diag_counters()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE res json;
BEGIN
  res := json_build_object(
    'contacts', (SELECT count(*) FROM public.contacts),
    'accepted_requests', (SELECT count(*) FROM public.requests WHERE status='accepted'),
    'accepted_without_contact', (SELECT count(*) FROM public.vw_accepted_without_contact),
    'query_terms', (SELECT count(*) FROM public.vw_gift_query_terms)
  );
  RETURN res;
END;
$$;

-- ====== RLS Policies ======
ALTER TABLE public.gift_query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_item_merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage gift_query_logs" ON public.gift_query_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage merchants" ON public.merchants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage gift_item_merchants" ON public.gift_item_merchants FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public read merchants" ON public.merchants FOR SELECT USING (true);