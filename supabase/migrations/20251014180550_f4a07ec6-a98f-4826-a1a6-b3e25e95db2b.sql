-- Créer la table connections si elle n'existe pas
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint different_users check (requester_id != target_id),
  constraint unique_connection unique (requester_id, target_id)
);

-- CONNECTIONS RLS
alter table public.connections enable row level security;

drop policy if exists "conn_select_self" on public.connections;
drop policy if exists "conn_insert_requester" on public.connections;
drop policy if exists "conn_update_owner_or_target" on public.connections;

create policy "conn_select_self"
on public.connections
for select
using (requester_id = auth.uid() or target_id = auth.uid());

create policy "conn_insert_requester"
on public.connections
for insert
with check (requester_id = auth.uid());

create policy "conn_update_owner_or_target"
on public.connections
for update
using (requester_id = auth.uid() or target_id = auth.uid())
with check (
  (target_id = auth.uid()) -- accepter/refuser par la cible
  or (requester_id = auth.uid()) -- annuler par le demandeur
);

-- PREFERENCES RLS
alter table if exists public.preferences enable row level security;

drop policy if exists "prefs_select_owner" on public.preferences;
drop policy if exists "prefs_upsert_owner" on public.preferences;
drop policy if exists "prefs_update_owner" on public.preferences;

create policy "prefs_select_owner"
on public.preferences
for select
using (user_id = auth.uid());

create policy "prefs_upsert_owner"
on public.preferences
for insert
with check (user_id = auth.uid());

create policy "prefs_update_owner"
on public.preferences
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());