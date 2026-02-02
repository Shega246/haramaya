-- Fix function search path warnings by adding SET search_path

-- Recreate update_updated_at_column with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Recreate check_student_expiry with search_path
CREATE OR REPLACE FUNCTION public.check_student_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.semester_expiry_date < CURRENT_DATE THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;