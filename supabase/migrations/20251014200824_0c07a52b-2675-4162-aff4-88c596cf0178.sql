-- Migration 2025-10-14: Harden contacts & connections schema
-- Sécurisation et optimisation de la gestion des contacts bidirectionnels

-- 1) Contrainte d'unicité sur pair_key pour éviter les doublons bidirectionnels
do $$ 
begin
  alter table public.contacts 
    add constraint contacts_pair_key_unique unique (pair_key);
exception 
  when duplicate_object then 
    null; -- La contrainte existe déjà, ignorer
  when others then
    raise notice 'Erreur lors de la création de la contrainte: %', sqlerrm;
end $$;

-- 2) Index pour améliorer les performances des requêtes fréquentes
create index if not exists idx_connections_target_pending
  on public.connections (target_id, status) 
  where lower(status::text) = 'pending';

create index if not exists idx_connections_requester_pending
  on public.connections (requester_id, status) 
  where lower(status::text) = 'pending';

create index if not exists idx_contacts_owner_id 
  on public.contacts (owner_id);

create index if not exists idx_contacts_contact_user_id 
  on public.contacts (contact_user_id);

create index if not exists idx_contacts_pair_key 
  on public.contacts (pair_key);

-- 3) Supprimer l'ancienne vue my_contacts si elle existe
drop view if exists public.my_contacts cascade;

-- 4) Créer la nouvelle vue my_contacts
create view public.my_contacts as
select
  c.id,
  c.owner_id,
  c.contact_user_id as other_user_id,
  c.pair_key,
  c.created_at,
  c.alias,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.city,
  p.birthday
from public.contacts c
left join public.profiles p on p.user_id = c.contact_user_id
where c.owner_id = auth.uid();

-- 5) RLS: Assurer que les policies sont bien configurées sur contacts
alter table public.contacts enable row level security;

drop policy if exists "contacts_select_self" on public.contacts;
create policy "contacts_select_self"
  on public.contacts for select
  using (
    owner_id = auth.uid() or contact_user_id = auth.uid()
  );

drop policy if exists "contacts_insert_self" on public.contacts;
create policy "contacts_insert_self"
  on public.contacts for insert
  with check (owner_id = auth.uid());

drop policy if exists "contacts_update_self" on public.contacts;
create policy "contacts_update_self"
  on public.contacts for update
  using (owner_id = auth.uid() or contact_user_id = auth.uid())
  with check (owner_id = auth.uid() or contact_user_id = auth.uid());

drop policy if exists "contacts_delete_self" on public.contacts;
create policy "contacts_delete_self"
  on public.contacts for delete
  using (owner_id = auth.uid());

-- 6) RLS sur connections pour sécuriser les demandes
alter table public.connections enable row level security;

drop policy if exists "connections_select_self" on public.connections;
create policy "connections_select_self"
  on public.connections for select
  using (requester_id = auth.uid() or target_id = auth.uid());

drop policy if exists "connections_insert_requester" on public.connections;
create policy "connections_insert_requester"
  on public.connections for insert
  with check (requester_id = auth.uid());

drop policy if exists "connections_update_involved" on public.connections;
create policy "connections_update_involved"
  on public.connections for update
  using (requester_id = auth.uid() or target_id = auth.uid());

-- 7) Refresh du schéma pour PostgREST
notify pgrst, 'reload schema';