-- Gift Accuracy RLS policies fix
begin;

drop policy if exists "pub_view_cat" on public.gift_categories;
drop policy if exists "pub_view_gifts" on public.gift_items;
drop policy if exists "pub_view_media" on public.gift_media;
drop policy if exists "srv_manage_cat" on public.gift_categories;
drop policy if exists "srv_manage_gifts" on public.gift_items;
drop policy if exists "srv_manage_media" on public.gift_media;

create policy "pub_view_cat" on public.gift_categories for select using (true);
create policy "pub_view_gifts" on public.gift_items for select using (true);
create policy "pub_view_media" on public.gift_media for select using (status='approved');
create policy "srv_manage_cat" on public.gift_categories for all using (auth.role()='service_role');
create policy "srv_manage_gifts" on public.gift_items for all using (auth.role()='service_role');
create policy "srv_manage_media" on public.gift_media for all using (auth.role()='service_role');

commit;