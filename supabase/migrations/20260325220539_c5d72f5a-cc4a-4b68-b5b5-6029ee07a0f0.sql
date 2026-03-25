
ALTER TABLE public.freelancer_profiles ADD COLUMN IF NOT EXISTS data_nascimento date;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS vale_transporte numeric DEFAULT 0;
