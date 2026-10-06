
-- 1) Harden handle_new_user trigger: only allow 'company' or 'freelancer' from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
  _meta_role text;
BEGIN
  _meta_role := NEW.raw_user_meta_data->>'role';
  IF _meta_role IN ('company', 'freelancer') THEN
    _role := _meta_role::app_role;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Restrict company_profiles read for freelancers to only companies they applied to
DROP POLICY IF EXISTS "Freelancers can read company profiles" ON public.company_profiles;
CREATE POLICY "Freelancers can read applied company profiles"
  ON public.company_profiles FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'freelancer'::app_role
    AND user_id IN (
      SELECT j.company_id FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.freelancer_id = auth.uid()
    )
  );

-- 3) Restrict freelancer_profiles read for companies to only those who applied to their jobs
DROP POLICY IF EXISTS "Companies can read freelancer profiles" ON public.freelancer_profiles;
CREATE POLICY "Companies can read applied freelancer profiles"
  ON public.freelancer_profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      public.get_user_role(auth.uid()) = 'company'::app_role
      AND EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE a.freelancer_id = freelancer_profiles.user_id
          AND j.company_id = auth.uid()
      )
    )
  );

-- 4) Explicitly block direct INSERT into user_roles by clients (defense in depth)
CREATE POLICY "No direct user_roles inserts"
  ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (false);

-- 5) Make avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Allow authenticated users to read avatars (signed URLs also work; this keeps in-app reads working)
DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
CREATE POLICY "Authenticated can read avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
