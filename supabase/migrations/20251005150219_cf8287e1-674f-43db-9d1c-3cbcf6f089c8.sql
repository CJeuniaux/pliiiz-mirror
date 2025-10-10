-- Extensions pour recherche floue et accents
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Table des items de préférences
create table if not exists public.pref_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  tags text[] default '{}',
  synonyms text[] default '{}',
  usage_count int default 0,
  created_at timestamp with time zone default now()
);

-- Index simples pour recherche trigram
create index if not exists idx_pref_items_label_trgm
  on public.pref_items using gin (label gin_trgm_ops);

-- Fonction de recherche intelligente avec gestion des accents
create or replace function public.search_pref_items(q text, lim int default 8)
returns table(id uuid, label text, score real)
language plpgsql stable 
security definer
set search_path = public
as $$
declare
  normalized_q text;
begin
  normalized_q := unaccent(lower(coalesce(q, '')));
  
  return query
  select i.id, i.label,
    (greatest(
      case when unaccent(lower(i.label)) like normalized_q || '%' then 1.0 else 0 end,
      similarity(unaccent(lower(i.label)), normalized_q),
      case 
        when array_length(i.synonyms, 1) > 0 then
          similarity(unaccent(lower(array_to_string(i.synonyms,' '))), normalized_q)
        else 0.0
      end
    ) + least(0.3, coalesce(i.usage_count,0)*0.003))::real as score
  from public.pref_items i
  where (unaccent(lower(i.label)) % normalized_q)
     or (unaccent(lower(i.label)) like normalized_q || '%')
     or (array_length(i.synonyms, 1) > 0 and unaccent(lower(array_to_string(i.synonyms,' '))) % normalized_q)
  order by score desc, i.label asc
  limit lim;
end $$;

-- RLS pour pref_items
alter table public.pref_items enable row level security;

-- Tout le monde peut lire
create policy "Pref items are viewable by everyone"
  on public.pref_items for select
  using (true);

-- Les utilisateurs authentifiés peuvent créer
create policy "Authenticated users can create pref items"
  on public.pref_items for insert
  to authenticated
  with check (true);

-- Les utilisateurs authentifiés peuvent modifier
create policy "Authenticated users can update pref items"
  on public.pref_items for update
  to authenticated
  using (true);