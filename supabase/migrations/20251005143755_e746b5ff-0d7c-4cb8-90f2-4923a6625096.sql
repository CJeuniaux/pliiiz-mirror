-- Enable RLS on the log table
alter table public.gift_image_regen_log enable row level security;

-- Policy: authenticated admins can view logs
create policy "Admins can view regen logs"
on public.gift_image_regen_log
for select
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));

-- Policy: service role can manage logs
create policy "Service role can manage regen logs"
on public.gift_image_regen_log
for all
to service_role
using (true)
with check (true);