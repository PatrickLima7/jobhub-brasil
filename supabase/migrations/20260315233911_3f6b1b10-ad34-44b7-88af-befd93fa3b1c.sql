
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('company', 'freelancer');

-- User roles table (per security best practices)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Security definer function to check role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Company profiles
CREATE TABLE public.company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT,
  cnpj TEXT,
  tipo TEXT,
  telefone TEXT,
  email TEXT,
  endereco_rua TEXT,
  endereco_numero TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_estado TEXT,
  endereco_cep TEXT,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Freelancer profiles
CREATE TABLE public.freelancer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT,
  cpf TEXT,
  telefone TEXT,
  cidade TEXT,
  estado TEXT,
  funcoes TEXT[] DEFAULT '{}',
  experiencia INTEGER DEFAULT 0,
  bio TEXT,
  disponibilidade TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  funcao TEXT NOT NULL,
  descricao TEXT,
  data_evento DATE NOT NULL,
  horario_inicio TEXT,
  horario_fim TEXT,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  tipo_pagamento TEXT NOT NULL DEFAULT 'diaria',
  num_vagas INTEGER NOT NULL DEFAULT 1,
  requisitos TEXT,
  status TEXT NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  freelancer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, freelancer_id)
);

-- RLS policies for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own role" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- RLS policies for company_profiles
CREATE POLICY "Companies can read own profile" ON public.company_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Companies can insert own profile" ON public.company_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Companies can update own profile" ON public.company_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS policies for freelancer_profiles
CREATE POLICY "Freelancers can read own profile" ON public.freelancer_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Freelancers can insert own profile" ON public.freelancer_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Freelancers can update own profile" ON public.freelancer_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS policies for jobs
CREATE POLICY "Companies can manage own jobs" ON public.jobs
  FOR ALL TO authenticated USING (auth.uid() = company_id) WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Anyone authenticated can view active jobs" ON public.jobs
  FOR SELECT TO authenticated USING (status = 'ativa');

-- RLS policies for applications
CREATE POLICY "Freelancers can insert own applications" ON public.applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = freelancer_id);
CREATE POLICY "Freelancers can view own applications" ON public.applications
  FOR SELECT TO authenticated USING (auth.uid() = freelancer_id);
CREATE POLICY "Companies can view applications for their jobs" ON public.applications
  FOR SELECT TO authenticated USING (
    job_id IN (SELECT id FROM public.jobs WHERE company_id = auth.uid())
  );
CREATE POLICY "Companies can update applications for their jobs" ON public.applications
  FOR UPDATE TO authenticated USING (
    job_id IN (SELECT id FROM public.jobs WHERE company_id = auth.uid())
  );

-- Trigger to auto-create profile on signup based on metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  _role := (NEW.raw_user_meta_data->>'role')::app_role;
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  
  IF _role = 'company' THEN
    INSERT INTO public.company_profiles (user_id, email) VALUES (NEW.id, NEW.email);
  ELSIF _role = 'freelancer' THEN
    INSERT INTO public.freelancer_profiles (user_id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow freelancer profiles to be read by companies (for candidate lists)
CREATE POLICY "Companies can read freelancer profiles" ON public.freelancer_profiles
  FOR SELECT TO authenticated USING (
    public.get_user_role(auth.uid()) = 'company'
  );
