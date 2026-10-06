-- Fase 2: Segurança RLS (Restringir GETs anônimos) e Integração de Mapas (lat/lng)

-- 1. Adicionar colunas de coordenadas reais na tabela jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 6);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS lng NUMERIC(10, 6);

-- 2. Restringir políticas de leitura (SELECT) apenas para usuários autenticados
-- Vamos recriar as políticas públicas (se existirem) para exigir auth.role() = 'authenticated'

-- Tabela: jobs
DROP POLICY IF EXISTS "Public can view active jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can view active jobs" ON public.jobs;

CREATE POLICY "Authenticated users can view active jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (status = 'ativa' AND auth.role() = 'authenticated');

-- Tabela: company_profiles
DROP POLICY IF EXISTS "Public can view company profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Authenticated users can view company profiles" ON public.company_profiles;

CREATE POLICY "Authenticated users can view company profiles"
ON public.company_profiles
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- Tabela: freelancer_profiles
DROP POLICY IF EXISTS "Public can view freelancer profiles" ON public.freelancer_profiles;
DROP POLICY IF EXISTS "Authenticated users can view freelancer profiles" ON public.freelancer_profiles;

CREATE POLICY "Authenticated users can view freelancer profiles"
ON public.freelancer_profiles
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- Tabela: reviews
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;

CREATE POLICY "Authenticated users can view reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

-- As demais políticas (INSERT/UPDATE/DELETE) normalmente já verificam auth.uid()
