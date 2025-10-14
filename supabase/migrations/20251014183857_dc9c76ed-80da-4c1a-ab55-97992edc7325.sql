-- ===========================================
-- Policies RLS strictes "état par état" pour public.requests
-- Nettoyage complet puis recréation
-- ===========================================

-- 1) Supprimer TOUTES les policies existantes sur requests
do $$
declare
  r record;
begin
  for r in 
    select policyname 
    from pg_policies 
    where schemaname = 'public' and tablename = 'requests'
  loop
    execute format('drop policy if exists %I on public.requests', r.policyname);
  end loop;
end $$;

-- 2) Recréer les policies strictes

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
-- Fonctions RPC sécurisées
-- ===========================================

-- Accepter une demande
create or replace function public.accept_connection_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_to_user uuid;
begin
  select to_user_id into v_to_user
  from public.requests
  where id = p_request_id and status = 'pending'
  for update;

  if v_to_user is null then
    raise exception 'Demande introuvable ou déjà traitée';
  end if;

  if v_to_user <> auth.uid() then
    raise exception 'Non autorisé';
  end if;

  update public.requests set status = 'accepted' where id = p_request_id;

  return jsonb_build_object('ok', true, 'status', 'accepted');
end $$;

-- Refuser une demande
create or replace function public.reject_connection_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_to_user uuid;
begin
  select to_user_id into v_to_user
  from public.requests
  where id = p_request_id and status = 'pending'
  for update;

  if v_to_user is null then
    raise exception 'Demande introuvable ou déjà traitée';
  end if;

  if v_to_user <> auth.uid() then
    raise exception 'Non autorisé';
  end if;

  update public.requests set status = 'refused' where id = p_request_id;

  return jsonb_build_object('ok', true, 'status', 'refused');
end $$;