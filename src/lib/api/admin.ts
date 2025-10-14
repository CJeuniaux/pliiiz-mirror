import { supabase } from "@/integrations/supabase/client";

export async function getDiagCounters() {
  const { data, error } = await supabase.rpc("fn_diag_counters");
  return { data, error };
}

/* Contacts & demandes */
export async function fetchContactsFull(page = 1, pageSize = 50, q = "") {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("vw_contacts_full")
    .select("*", { count: "exact" })
    .range(from, to)
    .order("created_at", { ascending: false });
  
  if (q) {
    query = query.or(`owner_name.ilike.%${q}%,contact_name.ilike.%${q}%`);
  }
  return query;
}

export async function fetchRequestsFull(status?: string, page = 1, pageSize = 50) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("vw_requests_full")
    .select("*", { count: "exact" })
    .range(from, to)
    .order("created_at", { ascending: false });
  
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  return query;
}

export async function fetchAcceptedWithoutContact() {
  return supabase.from("vw_accepted_without_contact").select("*");
}

/* Resync contacts - appelle la fonction Supabase existante */
export async function resyncAllContacts() {
  return supabase.rpc("resync_all_contacts");
}

/* Alertes — gaps détaillés accepted sans contact */
export async function fetchAcceptedContactGaps(page = 1, pageSize = 50) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return supabase
    .from("vw_accepted_contact_gaps")
    .select("*", { count: "exact" })
    .range(from, to)
    .order("created_at", { ascending: false });
}

/* Actions admin via RPC direct (pas d'Edge Function nécessaire) */
export async function resyncAllContactsViaRPC() {
  return supabase.rpc("resync_all_contacts");
}

export async function resyncContactPairViaRPC(
  from_id: string, 
  to_id: string, 
  a_to_b = true, 
  b_to_a = true
) {
  return supabase.rpc("resync_contact_pair", {
    from_id,
    to_id,
    create_a_to_b: a_to_b,
    create_b_to_a: b_to_a
  });
}

export async function resyncAllContactsAdmin() {
  return resyncAllContactsViaRPC();
}

export async function resyncContactPairAdmin(
  from_id: string, 
  to_id: string, 
  a_to_b = true, 
  b_to_a = true
) {
  return resyncContactPairViaRPC(from_id, to_id, a_to_b, b_to_a);
}

/* Mots-clés & enseignes */
export async function fetchQueryTerms(page = 1, pageSize = 50, q = "") {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("vw_gift_query_terms")
    .select("*", { count: "exact" })
    .range(from, to);
  
  if (q) {
    query = query.ilike("term", `%${q}%`);
  }
  return query;
}

export async function fetchQueryDetails(term: string, page = 1, pageSize = 50) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return supabase
    .from("vw_gift_query_details")
    .select("*", { count: "exact" })
    .eq("term", term)
    .range(from, to);
}

export async function listMerchants(q = "") {
  let query = supabase.from("merchants").select("*").order("name");
  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  return query;
}

export async function upsertMerchant(payload: {
  id?: string;
  slug: string;
  name: string;
  external_url?: string;
  logo_url?: string;
  active?: boolean;
}) {
  return supabase.from("merchants").upsert(payload).select().single();
}

/* Log de recherche gift */
export async function logGiftQuery(
  query_text: string,
  matched_gift_id?: string,
  merchant_id?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from("gift_query_logs").insert({
    user_id: user?.id ?? null,
    query_text,
    matched_gift_id: matched_gift_id ?? null,
    merchant_id: merchant_id ?? null,
  });
}
