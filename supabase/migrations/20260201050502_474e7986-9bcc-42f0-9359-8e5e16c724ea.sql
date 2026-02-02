-- Allow authenticated users to read their own roles (this policy may already exist, but ensure it's correct)
-- First drop if exists, then recreate
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);