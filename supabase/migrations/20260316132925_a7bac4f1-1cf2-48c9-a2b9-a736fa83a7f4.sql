CREATE POLICY "Freelancers can read company profiles"
ON public.company_profiles FOR SELECT
TO authenticated
USING (get_user_role(auth.uid()) = 'freelancer'::app_role);