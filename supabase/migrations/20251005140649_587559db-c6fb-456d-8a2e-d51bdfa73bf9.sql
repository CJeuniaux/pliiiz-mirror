-- Grant admin role to the provided email (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::public.app_role
FROM public.profiles p
WHERE lower(p.email) = lower('charlotte.j@kikk.be')
ON CONFLICT (user_id, role) DO NOTHING;