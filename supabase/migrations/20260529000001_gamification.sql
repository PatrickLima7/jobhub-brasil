-- Fase 3: Gamificação (Contador de Trampos Concluídos)

ALTER TABLE public.freelancer_profiles ADD COLUMN IF NOT EXISTS completed_jobs INTEGER DEFAULT 0;
