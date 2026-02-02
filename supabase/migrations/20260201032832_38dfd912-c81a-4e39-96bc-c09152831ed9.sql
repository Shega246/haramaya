-- Add a policy to allow unauthenticated student lookup during login
-- This is necessary because students log in with first_name + student_id, not email/password
CREATE POLICY "Allow student lookup for login"
ON public.students
FOR SELECT
USING (true);

-- Note: This makes student basic info readable, but sensitive data should be protected
-- The alternative is using a database function with SECURITY DEFINER