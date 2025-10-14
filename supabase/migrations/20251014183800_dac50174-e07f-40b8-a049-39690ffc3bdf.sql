-- ===========================================
-- Policies RLS strictes "état par état" pour public.requests
-- But : n'autoriser que les transitions d'état valides
-- ===========================================

-- Nettoyage des anciennes policies
drop policy if exists "req_sel" on public.requests;
drop policy if exists "req_ins" on public.requests;
drop policy if exists "req_upd" on public.requests;
drop policy if exists "Users can view requests they sent or received" on public.requests;
drop policy if exists "Users can create requests" on public.requests;
drop policy if exists "Users can update requests they received" on public.requests;

-- SELECT : chacun voit ses demandes (envoyées ou reçues)
create policy "req_select_self"
on public.requests
for select
using (from_user_id = auth.uid() or to_user_id = auth.uid());

-- INSERT : seul le demandeur crée la ligne
create policy "req_insert_sender"
on public.requests
for insert
with check (from_user_id = auth.uid());

-- UPDATE par le DESTINATAIRE : accepter ou refuser une demande PENDING
create policy "req_update_recipient_accept_decline"
on public.requests
for update
using (
  to_user_id = auth.uid() and status = 'pending'
)
with check (
  to_user_id = auth.uid() and status in ('accepted', 'refused')
);

-- UPDATE par le DEMANDEUR : annuler une demande PENDING
create policy "req_update_sender_cancel"
on public.requests
for update
using (
  from_user_id = auth.uid() and status = 'pending'
)
with check (
  from_user_id = auth.uid() and status = 'refused'
);

-- ===========================================
-- Fonctions RPC sécurisées (alternative robuste)
-- ===========================================

-- Fonction pour accepter une demande
create or replace function public.accept_connection_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_to_user uuid;
  v_from_user uuid;
begin
  -- Vérifie que l'utilisateur courant est bien le destinataire d'une demande pending
  select to_user_id, from_user_id into v_to_user, v_from_user
  from public.requests
  where id = p_request_id and status = 'pending'
  for update; -- verrouille la ligne

  if v_to_user is null then
    raise exception 'Demande introuvable ou déjà traitée';
  end if;

  if v_to_user <> auth.uid() then
    raise exception 'Vous ne pouvez pas accepter cette demande';
  end if;

  -- Met à jour le statut
  update public.requests
  set status = 'accepted'
  where id = p_request_id;

  return jsonb_build_object(
    'ok', true,
    'request_id', p_request_id,
    'status', 'accepted'
  );
end $$;

-- Fonction pour refuser une demande
create or replace function public.reject_connection_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_to_user uuid;
begin
  -- Vérifie que l'utilisateur courant est bien le destinataire d'une demande pending
  select to_user_id into v_to_user
  from public.requests
  where id = p_request_id and status = 'pending'
  for update;

  if v_to_user is null then
    raise exception 'Demande introuvable ou déjà traitée';
  end if;

  if v_to_user <> auth.uid() then
    raise exception 'Vous ne pouvez pas refuser cette demande';
  end if;

  -- Met à jour le statut
  update public.requests
  set status = 'refused'
  where id = p_request_id;

  return jsonb_build_object(
    'ok', true,
    'request_id', p_request_id,
    'status', 'refused'
  );
end $$;