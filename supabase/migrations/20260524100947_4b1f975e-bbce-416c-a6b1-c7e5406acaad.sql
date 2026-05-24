
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_first_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_first_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "anyone can submit" ON public.contact_submissions;
CREATE POLICY "anon can submit" ON public.contact_submissions FOR INSERT TO anon WITH CHECK (length(name) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 320 AND length(message) BETWEEN 1 AND 5000);
CREATE POLICY "auth can submit" ON public.contact_submissions FOR INSERT TO authenticated WITH CHECK (length(name) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 320 AND length(message) BETWEEN 1 AND 5000);
