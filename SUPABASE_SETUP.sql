-- Supabase Database Setup for Location Data Manager
-- Run this script in your Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  description TEXT NOT NULL,
  formatted_address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  place_id TEXT NOT NULL,
  form_data JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Enable RLS on submissions table
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 3. Create a private schema for helper functions
CREATE SCHEMA IF NOT EXISTS private;

-- 4. Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, private
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

-- 5. RLS Policies for profiles table

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
ON public.profiles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (private.is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (private.is_admin())
WITH CHECK (private.is_admin());

-- System can insert new profiles (via trigger)
CREATE POLICY "System can insert profiles"
ON public.profiles
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. RLS Policies for submissions table

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
ON public.submissions
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.submissions
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (private.is_admin());

-- Users can insert their own submissions
CREATE POLICY "Users can insert own submissions"
ON public.submissions
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own submissions
CREATE POLICY "Users can update own submissions"
ON public.submissions
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can update all submissions
CREATE POLICY "Admins can update all submissions"
ON public.submissions
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (private.is_admin())
WITH CHECK (private.is_admin());

-- Users can delete their own submissions
CREATE POLICY "Users can delete own submissions"
ON public.submissions
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can delete all submissions
CREATE POLICY "Admins can delete all submissions"
ON public.submissions
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (private.is_admin());

-- 7. Create a trigger to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_form_data_group ON public.submissions((form_data->>'group'));

-- 10. Create an admin user (OPTIONAL - replace with your email)
-- Uncomment the following lines and replace 'your-email@example.com' with your actual email
-- after signing up through the app

-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'your-email@example.com'
-- );

-- Verification queries (optional - run these to check if setup worked):
-- SELECT * FROM public.profiles;
-- SELECT * FROM public.submissions;
-- SELECT auth.uid(), private.is_admin();
