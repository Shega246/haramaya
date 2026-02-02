-- Create function to check if user is ticker
CREATE OR REPLACE FUNCTION public.is_ticker()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'ticker')
$$;

-- RLS policies for verification_logs
CREATE POLICY "Admins can view all verification logs"
ON public.verification_logs
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert verification logs"
ON public.verification_logs
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Tickers can view verification logs"
ON public.verification_logs
FOR SELECT
USING (is_ticker());

CREATE POLICY "Tickers can insert verification logs"
ON public.verification_logs
FOR INSERT
WITH CHECK (is_ticker());

-- Function to check if student already received this meal today
CREATE OR REPLACE FUNCTION public.check_duplicate_meal(
    _student_id uuid,
    _meal_category public.meal_category,
    _date date
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.verification_logs
        WHERE student_id = _student_id
          AND meal_category = _meal_category
          AND verification_date = _date
          AND verification_result = true
    )
$$;

-- Function to get daily cheating count for a student
CREATE OR REPLACE FUNCTION public.get_daily_cheating_count(
    _student_id uuid,
    _date date
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COUNT(*)::integer
    FROM public.verification_logs
    WHERE student_id = _student_id
      AND verification_date = _date
      AND verification_result = false
      AND result_reason = 'duplicate'
$$;

-- Function to auto-block student after 2 cheating attempts
CREATE OR REPLACE FUNCTION public.auto_block_cheater()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cheating_count integer;
BEGIN
    IF NEW.result_reason = 'duplicate' AND NEW.student_id IS NOT NULL THEN
        SELECT COUNT(*) INTO cheating_count
        FROM public.verification_logs
        WHERE student_id = NEW.student_id
          AND verification_date = NEW.verification_date
          AND result_reason = 'duplicate';
        
        NEW.cheating_count := cheating_count + 1;
        
        IF cheating_count + 1 >= 2 THEN
            UPDATE public.students
            SET status = 'blocked',
                blocked_at = now(),
                blocked_reason = 'Auto-blocked: 2 cheating attempts on ' || NEW.verification_date,
                daily_cheating_count = cheating_count + 1,
                last_cheating_date = NEW.verification_date
            WHERE id = NEW.student_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for auto-blocking
DROP TRIGGER IF EXISTS trigger_auto_block_cheater ON public.verification_logs;
CREATE TRIGGER trigger_auto_block_cheater
    BEFORE INSERT ON public.verification_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_block_cheater();

-- Update students RLS to allow tickers to view students for verification
CREATE POLICY "Tickers can view students for verification"
ON public.students
FOR SELECT
USING (is_ticker());

-- Allow tickers to view meals
CREATE POLICY "Tickers can view meals"
ON public.meals
FOR SELECT
USING (is_ticker());