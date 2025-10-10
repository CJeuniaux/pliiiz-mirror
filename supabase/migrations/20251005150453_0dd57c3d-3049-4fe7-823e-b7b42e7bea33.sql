-- Extensions pour recherche floue et accents
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Table des items de préférences
create table if not exists pref_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  tags text[] default '{}',
  synonyms text[] default '{}',
  usage_count int default 0,
  created_at timestamp with time zone default now()
);

-- Index trigram simple sur le label
create index if not exists idx_pref_items_label_trgm
  on pref_items using gin (label gin_trgm_ops);

-- Fonction de recherche intelligente avec gestion des accents
create or replace function search_pref_items(q text, lim int default 8)
returns table(id uuid, label text, score real)
language plpgsql stable as $$
declare
  normalized_q text;
begin
  normalized_q := unaccent(lower(coalesce(q, '')));
  
  return query
  select i.id, i.label,
    (greatest(
      case when unaccent(lower(i.label)) like normalized_q || '%' then 1.0 else 0 end,
      similarity(unaccent(lower(i.label)), normalized_q),
      similarity(unaccent(lower(array_to_string(i.synonyms,' '))), normalized_q)
    ) + least(0.3, coalesce(i.usage_count,0)*0.003))::real as score
  from pref_items i
  where (unaccent(lower(i.label)) % normalized_q)
     or (unaccent(lower(i.label)) like normalized_q || '%')
     or (unaccent(lower(array_to_string(i.synonyms,' '))) % normalized_q)
  order by score desc, i.label asc
  limit lim;
end $$;

-- RLS pour pref_items
alter table pref_items enable row level security;