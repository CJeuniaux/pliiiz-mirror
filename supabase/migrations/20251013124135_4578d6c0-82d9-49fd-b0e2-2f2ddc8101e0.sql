-- Gift Accuracy System: canonical media, scoring, audit (v3 - simplified array logic)
begin;

-- 1) Categories
create table if not exists public.gift_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  created_at timestamptz default now()
);

insert into public.gift_categories (slug, label) values
  ('carte-cadeau','Carte cadeau'),('massage','Expérience massage'),('bien-etre','Bien-être'),
  ('vin','Vin & spiritueux'),('champagne','Champagne'),('biere','Bière'),('cafe','Café'),
  ('the','Thé'),('chocolat','Chocolat'),('patisserie','Pâtisserie'),('restaurant','Restaurant'),
  ('cuisine-accessoires','Cuisine - accessoires'),('epicerie-fine','Épicerie fine'),('fleurs','Fleurs'),
  ('plantes','Plantes'),('livre','Livre'),('papeterie','Papeterie'),('jeux-de-societe','Jeux de société'),
  ('puzzle','Puzzle'),('gaming','Gaming'),('musique','Musique'),('cinema','Cinéma'),('photo','Photo'),
  ('tech-accessoires','Tech - accessoires'),('audio-ecouteurs','Audio - écouteurs'),
  ('montre-connectee','Montre connectée'),('beaute-soins','Beauté & soins'),('parfum','Parfum'),
  ('coffret-cadeau','Coffret cadeau'),('bougies','Bougies'),('deco-maison','Décoration'),
  ('arts-creatifs','Arts créatifs'),('poterie-cours','Poterie / cours'),('yoga','Yoga'),
  ('running','Running'),('fitness-maison','Fitness maison'),('randonnee','Randonnée'),
  ('camping','Camping'),('voyage','Voyage'),('cuisine-couteaux','Cuisine - couteaux'),
  ('bar-cocktails','Bar & cocktails'),('fromage','Fromage'),('charcuterie','Charcuterie'),
  ('petit-dejeuner','Petit déjeuner'),('enfants-jouets','Enfants - jouets'),
  ('bebe-naissance','Bébé / naissance'),('animaux-accessoires','Animaux - accessoires'),
  ('jardinage','Jardinage'),('abonnement','Abonnement'),('don-caritatif','Don caritatif')
on conflict (slug) do nothing;

-- 2) Gift items
create table if not exists public.gift_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category_id uuid not null references public.gift_categories(id) on delete restrict,
  expected_tags text[] default '{}',
  canonical_media_id uuid,
  accuracy_score int default 0,
  last_scored timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_gift_items_category on public.gift_items(category_id);

-- 3) Media library
create table if not exists public.gift_media (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.gift_categories(id) on delete cascade,
  title text,
  alt text,
  source_type text not null,
  source_ref text not null,
  width int, height int,
  tags text[] default '{}',
  quality_score int default 80,
  status text not null default 'approved',
  created_at timestamptz default now()
);
create index if not exists idx_gift_media_category on public.gift_media(category_id);
create index if not exists idx_gift_media_status on public.gift_media(status);
create index if not exists idx_gift_media_tags_gin on public.gift_media using gin (tags);

-- 4) Helper: count array overlaps
create or replace function public.fn_array_overlap_count(a text[], b text[])
returns int 
language sql immutable
set search_path = public
as $$
  select count(*)::int from unnest(a) x where x = any(b);
$$;

-- 5) Scoring function
create or replace function public.fn_score_media_for_gift(p_gift_id uuid)
returns table(media_id uuid, score int, matched_tags text[]) 
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cat_id uuid;
  v_expected text[];
begin
  select category_id, expected_tags into v_cat_id, v_expected
  from public.gift_items where id = p_gift_id;

  return query
  select gm.id,
         least(100,
           case when gm.category_id = v_cat_id then 50 else 0 end
           + 5 * public.fn_array_overlap_count(gm.tags, v_expected)
           + greatest(0, least(10, round((gm.quality_score::numeric - 70)/3)::int))
         ) as calc_score,
         (select coalesce(array_agg(t), array[]::text[]) 
          from unnest(gm.tags) t where t = any(v_expected)) as tags_match
  from public.gift_media gm
  where gm.status = 'approved'
  order by calc_score desc, gm.id;
end;
$$;

-- 6) Pick canonical
create or replace function public.fn_pick_canonical_media(p_gift_id uuid)
returns void 
language plpgsql
security definer
set search_path = public
as $$
declare rec record;
begin
  select media_id, score into rec
  from public.fn_score_media_for_gift(p_gift_id) limit 1;
  
  if rec.media_id is null then
    update public.gift_items set canonical_media_id=null, accuracy_score=0, last_scored=now()
    where id=p_gift_id;
  else
    update public.gift_items set canonical_media_id=rec.media_id, accuracy_score=rec.score, last_scored=now()
    where id=p_gift_id;
  end if;
end;
$$;

-- 7) Rescore all
create or replace function public.fn_rescore_all_gifts()
returns void language plpgsql security definer set search_path=public
as $$
declare gid uuid;
begin
  for gid in select id from public.gift_items loop
    perform public.fn_pick_canonical_media(gid);
  end loop;
end;
$$;

-- 8) View
create or replace view public.vw_gift_with_media as
select gi.id as gift_id, gi.title, gi.description, gi.accuracy_score, gi.expected_tags,
       gc.slug as category_slug, gc.label as category_label,
       gm.id as media_id, gm.source_ref, gm.alt, gm.width, gm.height, gm.tags as media_tags
from public.gift_items gi
join public.gift_categories gc on gc.id=gi.category_id
left join public.gift_media gm on gm.id=gi.canonical_media_id;

-- 9) Triggers
create or replace function public.tg_rescore_on_gift_change()
returns trigger language plpgsql security definer set search_path=public
as $$begin perform public.fn_pick_canonical_media(new.id); return new; end;$$;

drop trigger if exists trg_rescore_on_gift_change on public.gift_items;
create trigger trg_rescore_on_gift_change
after insert or update of expected_tags, category_id on public.gift_items
for each row execute function public.tg_rescore_on_gift_change();

create or replace function public.tg_rescore_on_media_change()
returns trigger language plpgsql security definer set search_path=public
as $$declare r record;
begin
  if new.status<>'approved' then return new; end if;
  for r in select gi.id from public.gift_items gi
    where gi.category_id=new.category_id and (gi.expected_tags && new.tags)
  loop perform public.fn_pick_canonical_media(r.id); end loop;
  return new;
end;$$;

drop trigger if exists trg_rescore_on_media_change on public.gift_media;
create trigger trg_rescore_on_media_change
after insert or update of tags, quality_score, status, category_id on public.gift_media
for each row execute function public.tg_rescore_on_media_change();

-- 10) RLS
alter table public.gift_categories enable row level security;
alter table public.gift_items enable row level security;
alter table public.gift_media enable row level security;

create policy "pub_view_cat" on public.gift_categories for select using (true);
create policy "pub_view_gifts" on public.gift_items for select using (true);
create policy "pub_view_media" on public.gift_media for select using (status='approved');
create policy "srv_manage_cat" on public.gift_categories for all using (auth.role()='service_role');
create policy "srv_manage_gifts" on public.gift_items for all using (auth.role()='service_role');
create policy "srv_manage_media" on public.gift_media for all using (auth.role()='service_role');

commit;