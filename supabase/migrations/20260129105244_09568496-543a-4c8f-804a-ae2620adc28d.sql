-- Create enum for meal categories
CREATE TYPE public.meal_category AS ENUM ('breakfast', 'lunch', 'dinner');

-- Create enum for student status
CREATE TYPE public.student_status AS ENUM ('active', 'expired');

-- Create enum for days of week
CREATE TYPE public.day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  photo_url TEXT,
  department VARCHAR(200) NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1 AND year <= 7),
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 2),
  semester_expiry_date DATE NOT NULL,
  status student_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create meals table
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  day_of_week day_of_week NOT NULL,
  category meal_category NOT NULL,
  food_name VARCHAR(200) NOT NULL,
  food_image TEXT,
  food_description TEXT,
  likes_count INTEGER NOT NULL DEFAULT 0,
  dislikes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, category)
);

-- Enable RLS on meals
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Create meal_logs table for tracking served meals
CREATE TABLE public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  category meal_category NOT NULL,
  served_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  qr_validation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, meal_id)
);

-- Enable RLS on meal_logs
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- Create meal_reactions table for likes/dislikes
CREATE TABLE public.meal_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, meal_id)
);

-- Enable RLS on meal_reactions
ALTER TABLE public.meal_reactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS (Security Definer)
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Function to check if current user owns the student record
CREATE OR REPLACE FUNCTION public.is_student_owner(_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students
    WHERE id = _student_id
      AND user_id = auth.uid()
  )
$$;

-- Function to get student_id from user_id
CREATE OR REPLACE FUNCTION public.get_student_id_from_user()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- User roles policies (only admins can manage)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin());

-- Students policies
CREATE POLICY "Admins can view all students"
  ON public.students FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Students can view own profile"
  ON public.students FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert students"
  ON public.students FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update students"
  ON public.students FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete students"
  ON public.students FOR DELETE
  USING (public.is_admin());

-- Meals policies (everyone authenticated can view, only admins can modify)
CREATE POLICY "Anyone can view meals"
  ON public.meals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert meals"
  ON public.meals FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update meals"
  ON public.meals FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete meals"
  ON public.meals FOR DELETE
  USING (public.is_admin());

-- Meal logs policies
CREATE POLICY "Admins can view all logs"
  ON public.meal_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Students can view own logs"
  ON public.meal_logs FOR SELECT
  USING (public.is_student_owner(student_id));

CREATE POLICY "Admins can insert logs"
  ON public.meal_logs FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update logs"
  ON public.meal_logs FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete logs"
  ON public.meal_logs FOR DELETE
  USING (public.is_admin());

-- Meal reactions policies
CREATE POLICY "Anyone can view reactions"
  ON public.meal_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can add reactions"
  ON public.meal_reactions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_student_owner(student_id) OR public.is_admin());

CREATE POLICY "Students can update own reactions"
  ON public.meal_reactions FOR UPDATE
  USING (public.is_student_owner(student_id) OR public.is_admin());

CREATE POLICY "Students can delete own reactions"
  ON public.meal_reactions FOR DELETE
  USING (public.is_student_owner(student_id) OR public.is_admin());

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for students
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for meals
CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON public.meals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-expire students
CREATE OR REPLACE FUNCTION public.check_student_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.semester_expiry_date < CURRENT_DATE THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check expiry on update
CREATE TRIGGER check_student_expiry_trigger
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.check_student_expiry();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true);

-- Create storage bucket for meal images
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-images', 'meal-images', true);

-- Storage policies for student photos
CREATE POLICY "Public can view student photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'student-photos');

CREATE POLICY "Admins can upload student photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'student-photos' AND public.is_admin());

CREATE POLICY "Admins can update student photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'student-photos' AND public.is_admin());

CREATE POLICY "Admins can delete student photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'student-photos' AND public.is_admin());

-- Storage policies for meal images
CREATE POLICY "Public can view meal images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'meal-images');

CREATE POLICY "Admins can upload meal images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'meal-images' AND public.is_admin());

CREATE POLICY "Admins can update meal images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'meal-images' AND public.is_admin());

CREATE POLICY "Admins can delete meal images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'meal-images' AND public.is_admin());