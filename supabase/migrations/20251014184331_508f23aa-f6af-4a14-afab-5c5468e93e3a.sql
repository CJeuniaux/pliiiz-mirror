-- ===========================================
-- RPC sécurisée pour accepter/refuser des demandes
-- Bypass RLS avec vérifications strictes côté DB
-- ===========================================

-- Fonction robuste pour accepter une demande
create or replace function public.accept_connection(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare 
  v_to_user uuid;
  v_status text;
begin
  -- Verrouille la ligne pour éviter les courses
  select to_user_id, status into v_to_user, v_status
  from public.requests
  where id = p_request_id
  for update;

  if v_to_user is null then
    raise exception 'Demande introuvable';
  end if;

  if v_to_user <> auth.uid() then
    raise exception 'Vous ne pouvez pas accepter cette demande';
  end if;

  if v_status is distinct from 'pending' then
    raise exception 'Cette demande a déjà été traitée (%)' , v_status;
  end if;

  update public.requests
  set status = 'accepted'
  where id = p_request_id;

  return jsonb_build_object('ok', true, 'id', p_request_id, 'status', 'accepted');
end $$;

-- Fonction robuste pour refuser une demande
create or replace function public.reject_connection(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare 
  v_to_user uuid;
  v_status text;
begin
  select to_user_id, status into v_to_user, v_status
  from public.requests
  where id = p_request_id
  for update;

  if v_to_user is null then
    raise exception 'Demande introuvable';
  end if;

  if v_to_user <> auth.uid() then
    raise exception 'Vous ne pouvez pas refuser cette demande';
  end if;

  if v_status is distinct from 'pending' then
    raise exception 'Cette demande a déjà été traitée (%)' , v_status;
  end if;

  update public.requests
  set status = 'refused'
  where id = p_request_id;

  return jsonb_build_object('ok', true, 'id', p_request_id, 'status', 'refused');
end $$;

-- Autorisations
revoke all on function public.accept_connection(uuid) from public;
grant execute on function public.accept_connection(uuid) to authenticated;
revoke all on function public.reject_connection(uuid) from public;
grant execute on function public.reject_connection(uuid) to authenticated;