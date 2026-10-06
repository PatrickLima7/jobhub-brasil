
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS tipo_vaga text NOT NULL DEFAULT 'freelancer',
  ADD COLUMN IF NOT EXISTS regime_trabalho text,
  ADD COLUMN IF NOT EXISTS salario_tipo text,
  ADD COLUMN IF NOT EXISTS atividades text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS beneficios text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requisitos_checklist text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS informacoes_adicionais text,
  ADD COLUMN IF NOT EXISTS posicionamento_valor text DEFAULT 'padrao',
  ADD COLUMN IF NOT EXISTS destaque boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS urgente boolean NOT NULL DEFAULT false;
