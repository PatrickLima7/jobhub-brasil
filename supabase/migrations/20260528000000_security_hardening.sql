-- =====================================================================
-- Migration: Security hardening & feature improvements
-- Date: 2026-05-28
-- Changes:
--   1. Add 'admin' to app_role enum
--   2. Harden handle_new_user trigger (validate role, handle errors)
--   3. Add RLS policies for messages table
--   4. Add RLS policies for reviews table
--   5. Add DB-level rate limiting for applications (anti-spam)
-- =====================================================================

-- 1. Add 'admin' to the app_role enum
-- NOTE: In Postgres you cannot remove values from an enum, only add.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- 2. Harden handle_new_user trigger
-- - Validates role is only 'company' or 'freelancer' (never 'admin' via signup)
-- - Falls back to 'freelancer' if role metadata is missing or invalid
-- - Catches exceptions to prevent orphaned auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role_raw TEXT;
  _role app_role;
BEGIN
  -- Extract role from metadata
  _role_raw := NEW.raw_user_meta_data->>'role';

  -- Only allow 'company' or 'freelancer' via self-signup.
  -- 'admin' must be assigned manually by a super admin.
  IF _role_raw = 'company' THEN
    _role := 'company';
  ELSE
    -- Default to 'freelancer' for any unknown/missing role
    _role := 'freelancer';
  END IF;

  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log but don't fail user creation
    RAISE WARNING 'handle_new_user: could not insert user_role for %: %', NEW.id, SQLERRM;
    RETURN NEW;
  END;

  BEGIN
    IF _role = 'company' THEN
      INSERT INTO public.company_profiles (user_id, email)
      VALUES (NEW.id, NEW.email)
      ON CONFLICT (user_id) DO NOTHING;
    ELSIF _role = 'freelancer' THEN
      INSERT INTO public.freelancer_profiles (user_id)
      VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: could not insert profile for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Recreate the trigger (drop + create to ensure it's up to date)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Enable RLS on messages table and add policies
-- (Table must exist — created by prior migrations)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Participants can read their messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;

-- Participants can read messages of their conversations
-- A participant is: the sender OR the freelancer/company of the application
CREATE POLICY "Participants can read their messages" ON public.messages
  FOR SELECT TO authenticated USING (
    sender_id = auth.uid()
    OR application_id IN (
      SELECT a.id FROM public.applications a
      WHERE a.freelancer_id = auth.uid()
         OR a.job_id IN (
           SELECT j.id FROM public.jobs j WHERE j.company_id = auth.uid()
         )
    )
  );

-- Only participants can insert messages into their conversations
CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid()
    AND application_id IN (
      SELECT a.id FROM public.applications a
      WHERE a.freelancer_id = auth.uid()
         OR a.job_id IN (
           SELECT j.id FROM public.jobs j WHERE j.company_id = auth.uid()
         )
    )
  );

-- Only the recipient can mark messages as read (update read_at)
CREATE POLICY "Recipients can mark messages as read" ON public.messages
  FOR UPDATE TO authenticated USING (
    sender_id != auth.uid()
    AND application_id IN (
      SELECT a.id FROM public.applications a
      WHERE a.freelancer_id = auth.uid()
         OR a.job_id IN (
           SELECT j.id FROM public.jobs j WHERE j.company_id = auth.uid()
         )
    )
  ) WITH CHECK (true);

-- 4. Enable RLS on reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read reviews" ON public.reviews;
CREATE POLICY "Anyone authenticated can read reviews" ON public.reviews
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Companies can write reviews for freelancers they hired" ON public.reviews;
CREATE POLICY "Companies can write reviews for freelancers they hired" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    reviewer_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'company'
  );


-- 5. DB-level rate limiting for applications
-- Prevent more than 10 applications per user per hour
CREATE OR REPLACE FUNCTION public.check_application_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO _recent_count
  FROM public.applications
  WHERE freelancer_id = NEW.freelancer_id
    AND created_at > NOW() - INTERVAL '1 hour';

  IF _recent_count >= 10 THEN
    RAISE EXCEPTION 'Limite de candidaturas atingido. Aguarde antes de se candidatar novamente.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_application_rate_limit ON public.applications;
CREATE TRIGGER enforce_application_rate_limit
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.check_application_rate_limit();

-- 6. Allow admin to read all profiles (useful for admin dashboard)
DROP POLICY IF EXISTS "Admins can read all company profiles" ON public.company_profiles;
CREATE POLICY "Admins can read all company profiles" ON public.company_profiles
  FOR SELECT TO authenticated USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can read all freelancer profiles" ON public.freelancer_profiles;
CREATE POLICY "Admins can read all freelancer profiles" ON public.freelancer_profiles
  FOR SELECT TO authenticated USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can read all jobs" ON public.jobs;
CREATE POLICY "Admins can read all jobs" ON public.jobs
  FOR SELECT TO authenticated USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can read all applications" ON public.applications;
CREATE POLICY "Admins can read all applications" ON public.applications
  FOR SELECT TO authenticated USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

-- Update get_user_role function to handle admin role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;
