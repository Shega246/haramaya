-- First migration: Add enum values and basic table structure
-- Add 'blocked' to student status enum
ALTER TYPE public.student_status ADD VALUE IF NOT EXISTS 'blocked';

-- Add 'ticker' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ticker';

-- Add blocked_at and blocked_reason to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS blocked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS blocked_reason text,
ADD COLUMN IF NOT EXISTS daily_cheating_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_cheating_date date;

-- Create verification_logs table for ticker system
CREATE TABLE IF NOT EXISTS public.verification_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
    student_id_text varchar NOT NULL,
    student_name varchar NOT NULL,
    meal_category public.meal_category NOT NULL,
    meal_id uuid REFERENCES public.meals(id) ON DELETE SET NULL,
    verification_date date NOT NULL DEFAULT CURRENT_DATE,
    verification_time time with time zone NOT NULL DEFAULT CURRENT_TIME,
    verification_result boolean NOT NULL,
    result_reason varchar NOT NULL,
    ticker_id uuid NOT NULL,
    verification_method varchar NOT NULL,
    cheating_count integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on verification_logs
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_verification_logs_date ON public.verification_logs(verification_date);
CREATE INDEX IF NOT EXISTS idx_verification_logs_student ON public.verification_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_ticker ON public.verification_logs(ticker_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_result ON public.verification_logs(verification_result);