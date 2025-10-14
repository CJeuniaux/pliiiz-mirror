-- ===== Pipeline de recherche magasins avec pgvector =====

-- Extension pgvector pour embeddings sémantiques
create extension if not exists vector;

-- Table des magasins
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  country text default 'FR',
  price_min int,
  price_max int,
  tags text[] default '{}',        -- ex: {livre,bd,manga,ado,culture}
  banned_tags text[] default '{}', -- ex: {auto,bricolage}
  popularity float default 0,
  embedding vector(1536),          -- embedding OpenAI pour recherche sémantique
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index pour performance
create index if not exists idx_stores_tags on stores using gin(tags);
create index if not exists idx_stores_country on stores(country);
create index if not exists idx_stores_price on stores(price_min, price_max);
create index if not exists idx_stores_embedding on stores using ivfflat(embedding vector_cosine_ops) with (lists = 100);

-- Table taxonomie/ontologie cadeaux
create table if not exists gift_taxonomy (
  tag text primary key,
  parents text[] default '{}',     -- hiérarchie: ex: "manga" -> {"livre","bd"}
  created_at timestamp with time zone default now()
);

-- Table synonymes
create table if not exists synonyms (
  term text primary key,
  variants text[] not null,        -- ex: ("livre", {"bouquin","roman","book"})
  created_at timestamp with time zone default now()
);

-- RLS policies pour les magasins (lecture publique)
alter table stores enable row level security;
create policy "Stores are viewable by everyone" on stores for select using (true);
create policy "Service role can manage stores" on stores for all using (auth.role() = 'service_role');

alter table gift_taxonomy enable row level security;
create policy "Taxonomy is viewable by everyone" on gift_taxonomy for select using (true);
create policy "Service role can manage taxonomy" on gift_taxonomy for all using (auth.role() = 'service_role');

alter table synonyms enable row level security;
create policy "Synonyms are viewable by everyone" on synonyms for select using (true);
create policy "Service role can manage synonyms" on synonyms for all using (auth.role() = 'service_role');

-- Seed: Synonymes
insert into synonyms (term, variants) values
  ('livre', array['bouquin','roman','book','lecture']),
  ('running', array['course','footing','jogging','sport-course']),
  ('high-tech', array['tech','gadget','électronique','technologie']),
  ('chocolat', array['cacao','chocolate','praline']),
  ('bijoux', array['bijou','joaillerie','jewelry']),
  ('beauté', array['beaute','cosmétique','cosmetique','maquillage']),
  ('sport', array['sportif','fitness','entrainement']),
  ('vêtement', array['vetement','mode','fashion','habit']),
  ('jeux', array['jeu','game','jouet']),
  ('plante', array['plantes','végétal','vegetal','fleur'])
on conflict (term) do nothing;

-- Seed: Taxonomie
insert into gift_taxonomy (tag, parents) values
  ('manga', array['livre','bd']),
  ('bd', array['livre']),
  ('roman', array['livre']),
  ('livre', array['culture']),
  ('running', array['sport']),
  ('fitness', array['sport']),
  ('bijoux', array['mode','accessoire']),
  ('parfum', array['beaute']),
  ('cosmetique', array['beaute']),
  ('jeux-video', array['jeux','high-tech'])
on conflict (tag) do nothing;

-- Seed: Magasins français populaires
insert into stores (name, url, tags, price_min, price_max, popularity, country) values
  ('FNAC', 'https://www.fnac.com', array['livre','bd','jeux-video','high-tech','manga','musique'], 5, 500, 0.85, 'FR'),
  ('Decathlon', 'https://www.decathlon.fr', array['running','sport','fitness','velo','outdoor'], 5, 300, 0.9, 'FR'),
  ('Sephora', 'https://www.sephora.fr', array['beaute','parfum','cosmetique','maquillage'], 10, 500, 0.85, 'FR'),
  ('Amazon', 'https://www.amazon.fr', array['livre','high-tech','mode','jeux','maison'], 5, 999, 0.95, 'FR'),
  ('Cultura', 'https://www.cultura.com', array['livre','loisirs-creatifs','papeterie','jeux','bd'], 3, 200, 0.75, 'FR'),
  ('Nature & Découvertes', 'https://www.natureetdecouvertes.com', array['bien-etre','nature','jeux-educatifs','decoration'], 10, 300, 0.7, 'FR'),
  ('Yves Rocher', 'https://www.yves-rocher.fr', array['beaute','cosmetique','parfum','bio'], 5, 150, 0.8, 'FR'),
  ('Marionnaud', 'https://www.marionnaud.fr', array['beaute','parfum','cosmetique'], 10, 400, 0.75, 'FR'),
  ('GO Sport', 'https://www.go-sport.com', array['sport','running','fitness','outdoor'], 10, 350, 0.8, 'FR'),
  ('Boulanger', 'https://www.boulanger.com', array['high-tech','electromenager','informatique'], 20, 999, 0.85, 'FR'),
  ('Micromania', 'https://www.micromania.fr', array['jeux-video','gaming','mangas','goodies'], 10, 500, 0.75, 'FR'),
  ('La Boutique du Chocolat', 'https://www.chocolat.fr', array['chocolat','gourmand','patisserie'], 5, 200, 0.65, 'FR'),
  ('Etsy France', 'https://www.etsy.com/fr', array['artisanat','fait-main','bijoux','decoration','unique'], 5, 500, 0.8, 'FR'),
  ('Truffaut', 'https://www.truffaut.com', array['plante','jardinage','decoration','animaux'], 5, 300, 0.7, 'FR')
on conflict (id) do nothing;

-- Fonction RPC de recherche intelligente
create or replace function search_stores(
  q text default '',
  gift_tags text[] default '{}',
  budget_min int default 0,
  budget_max int default 999999,
  country_pref text default 'FR'
)
returns table(
  id uuid,
  name text,
  url text,
  score float,
  why jsonb
) language plpgsql stable as $$
declare
  expanded_tags text[];
begin
  -- Étendre les tags avec synonymes et parents taxonomiques
  with expanded as (
    select array_agg(distinct t) as terms
    from (
      -- Tags d'origine
      select unnest(gift_tags) as t
      union
      -- Synonymes
      select unnest(s.variants)
      from synonyms s
      where s.term = any(gift_tags)
      union
      -- Parents taxonomiques
      select unnest(gt.parents)
      from gift_taxonomy gt
      where gt.tag = any(gift_tags)
    ) all_terms
  )
  select terms into expanded_tags from expanded;

  -- Recherche et scoring
  return query
  with filtered as (
    select 
      s.id,
      s.name,
      s.url,
      s.price_min,
      s.price_max,
      s.popularity,
      s.country,
      -- Nombre de tags communs
      cardinality(
        array(
          select unnest(s.tags) 
          intersect 
          select unnest(expanded_tags)
        )
      ) as common_tags,
      -- Budget compatible
      (s.price_min <= budget_max and s.price_max >= budget_min) as budget_ok,
      -- Pays préféré
      (coalesce(s.country, 'FR') = country_pref) as country_ok
    from stores s
    where 
      -- Au moins un tag commun
      exists (
        select 1 
        from unnest(s.tags) st 
        where st = any(expanded_tags)
      )
      -- Budget compatible
      and (s.price_min <= budget_max and s.price_max >= budget_min)
      -- Pas de tags bannis
      and not exists (
        select 1 
        from unnest(s.banned_tags) b 
        where b = any(expanded_tags)
      )
  )
  select 
    f.id,
    f.name,
    f.url,
    -- Score pondéré
    (
      f.common_tags * 0.5 +
      (case when f.country_ok then 0.2 else 0 end) +
      least(1.0, greatest(0, (budget_max - coalesce(f.price_min, 0))::float / nullif(budget_max, 0))) * 0.1 +
      f.popularity * 0.3
    )::float as score,
    jsonb_build_object(
      'common_tags', f.common_tags,
      'country_ok', f.country_ok,
      'price_range', jsonb_build_object('min', f.price_min, 'max', f.price_max),
      'popularity', f.popularity
    ) as why
  from filtered f
  order by score desc
  limit 12;
end;
$$;

-- Trigger pour updated_at
create or replace function update_stores_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger stores_updated_at
  before update on stores
  for each row
  execute function update_stores_updated_at();