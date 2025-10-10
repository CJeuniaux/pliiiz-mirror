-- Corriger le search_path de la fonction search_pref_items
create or replace function search_pref_items(q text, lim int default 8)
returns table(id uuid, label text, score real)
language plpgsql stable
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
      similarity(unaccent(lower(array_to_string(i.synonyms,' '))), normalized_q)
    ) + least(0.3, coalesce(i.usage_count,0)*0.003))::real as score
  from pref_items i
  where (unaccent(lower(i.label)) % normalized_q)
     or (unaccent(lower(i.label)) like normalized_q || '%')
     or (unaccent(lower(array_to_string(i.synonyms,' '))) % normalized_q)
  order by score desc, i.label asc
  limit lim;
end $$;