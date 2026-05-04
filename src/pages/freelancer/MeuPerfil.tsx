import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { AvatarUpload } from '@/components/AvatarUpload';
import { toast } from 'sonner';
import { SectionShell } from '@/components/perfil/SectionShell';
import { DadosPessoaisSection } from '@/components/perfil/DadosPessoaisSection';
import { CursosSection } from '@/components/perfil/CursosSection';
import { ReferenciasSection } from '@/components/perfil/ReferenciasSection';
import { RedesSociaisSection } from '@/components/perfil/RedesSociaisSection';
import { CompatibilidadeSection } from '@/components/perfil/CompatibilidadeSection';
import { ResumoSection, computeCompletion } from '@/components/perfil/ResumoSection';
import type { Curso, DisponibilidadeGrid, NivelExperiencia, PerfilData, Referencia } from '@/components/perfil/types';

const initialForm: PerfilData = {
  nome: '', nome_social: '', genero: '', cidade_nascimento: '',
  cidade: '', estado: '', escolaridade: '', cpf: '', telefone: '',
  data_nascimento: '', bio: '', experiencia: 0,
  cursos: [], referencias: [],
  instagram: '', tiktok: '', linkedin: '',
  funcoes: [], niveis_experiencia: {},
  uniforme_status: '', uniforme_pecas: [], uniforme_apoio: false,
  transporte_tipo: '', transporte_apoio: false,
  sistemas_digitais: [], preferencia_comissao: '', tipos_trabalho: [],
  disponibilidade: {},
};

type SectionKey = 'dados' | 'cursos' | 'referencias' | 'redes' | 'compat' | 'resumo';

function parseDisponibilidade(raw: unknown): DisponibilidadeGrid {
  if (!Array.isArray(raw) || raw.length === 0) return {};
  const first = raw[0];
  if (typeof first !== 'string') return {};
  if (first.startsWith('{')) {
    try { return JSON.parse(first) as DisponibilidadeGrid; } catch { return {}; }
  }
  // legacy day strings
  const grid: DisponibilidadeGrid = {};
  (raw as string[]).forEach(d => {
    const k = d.toLowerCase().replace('á', 'a');
    grid[k] = ['diurno', 'noturno'];
  });
  return grid;
}

export default function MeuPerfil() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<PerfilData>(initialForm);
  const [open, setOpen] = useState<SectionKey>('dados');
  const lastMilestoneRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;
    supabase.from('freelancer_profiles').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          const d = data as Record<string, unknown>;
          setForm({
            nome: (d.nome as string) ?? '',
            nome_social: (d.nome_social as string) ?? '',
            genero: (d.genero as string) ?? '',
            cidade_nascimento: (d.cidade_nascimento as string) ?? '',
            cidade: (d.cidade as string) ?? '',
            estado: (d.estado as string) ?? '',
            escolaridade: (d.escolaridade as string) ?? '',
            cpf: (d.cpf as string) ?? '',
            telefone: (d.telefone as string) ?? '',
            data_nascimento: (d.data_nascimento as string) ?? '',
            bio: (d.bio as string) ?? '',
            experiencia: (d.experiencia as number) ?? 0,
            cursos: (d.cursos as Curso[]) ?? [],
            referencias: (d.referencias as Referencia[]) ?? [],
            instagram: (d.instagram as string) ?? '',
            tiktok: (d.tiktok as string) ?? '',
            linkedin: (d.linkedin as string) ?? '',
            funcoes: (d.funcoes as string[]) ?? [],
            niveis_experiencia: (d.niveis_experiencia as Record<string, NivelExperiencia>) ?? {},
            uniforme_status: (d.uniforme_status as string) ?? '',
            uniforme_pecas: (d.uniforme_pecas as string[]) ?? [],
            uniforme_apoio: (d.uniforme_apoio as boolean) ?? false,
            transporte_tipo: (d.transporte_tipo as string) ?? '',
            transporte_apoio: (d.transporte_apoio as boolean) ?? false,
            sistemas_digitais: (d.sistemas_digitais as string[]) ?? [],
            preferencia_comissao: (d.preferencia_comissao as string) ?? '',
            tipos_trabalho: (d.tipos_trabalho as string[]) ?? [],
            disponibilidade: parseDisponibilidade(d.disponibilidade),
          });
        }
        setLoading(false);
      });
  }, [user]);

  const completion = useMemo(() => computeCompletion(form), [form]);

  // Milestone toasts
  useEffect(() => {
    const milestones = [50, 75, 100];
    const reached = milestones.filter(m => completion.percent >= m).pop() ?? 0;
    if (reached > lastMilestoneRef.current && lastMilestoneRef.current !== 0) {
      if (reached === 100) toast.success('🎉 Perfil 100% completo!');
      else toast.success(`Perfil ${reached}% completo!`);
    }
    lastMilestoneRef.current = reached;
  }, [completion.percent]);

  const sectionStatus = (k: SectionKey) => {
    switch (k) {
      case 'dados': return completion.dadosOk ? 'completo' : 'incompleto';
      case 'cursos': return completion.qualOk ? 'completo' : 'recomendado';
      case 'referencias': return completion.refOk ? 'completo' : 'recomendado';
      case 'redes': return completion.igOk ? 'muito-recomendado' : 'recomendado';
      case 'compat': return completion.compatOk ? 'completo' : 'recomendado';
      default: return undefined;
    }
  };

  const sectionStatusLabel = (k: SectionKey): string | undefined => {
    if (k === 'cursos' && !completion.qualOk) return 'Opcional mas recomendado';
    if (k === 'redes' && !completion.igOk) return 'Muito recomendado';
    return undefined;
  };

  const toggle = (k: SectionKey) => setOpen(prev => prev === k ? prev : k);

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.nome.trim()) { toast.error('Nome completo é obrigatório'); setOpen('dados'); return; }
    setSubmitting(true);
    try {
      const payload = {
        nome: form.nome,
        nome_social: form.nome_social || null,
        genero: form.genero || null,
        cidade_nascimento: form.cidade_nascimento || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        escolaridade: form.escolaridade || null,
        cpf: form.cpf || null,
        telefone: form.telefone || null,
        data_nascimento: form.data_nascimento || null,
        bio: form.bio || null,
        experiencia: form.experiencia,
        cursos: form.cursos as unknown as never,
        referencias: form.referencias as unknown as never,
        instagram: form.instagram || null,
        tiktok: form.tiktok || null,
        linkedin: form.linkedin || null,
        funcoes: form.funcoes,
        niveis_experiencia: form.niveis_experiencia as unknown as never,
        uniforme_status: form.uniforme_status || null,
        uniforme_pecas: form.uniforme_pecas,
        uniforme_apoio: form.uniforme_apoio,
        transporte_tipo: form.transporte_tipo || null,
        transporte_apoio: form.transporte_apoio,
        sistemas_digitais: form.sistemas_digitais,
        preferencia_comissao: form.preferencia_comissao || null,
        tipos_trabalho: form.tipos_trabalho,
        disponibilidade: [JSON.stringify(form.disponibilidade)],
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('freelancer_profiles').update(payload).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Perfil salvo!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao salvar', { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-display">Meu Perfil</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Construa um perfil profissional completo · {completion.percent}% completo
            </p>
          </div>
          {user && <AvatarUpload userId={user.id} type="freelancer" name={form.nome || 'F'} size={64} />}
        </div>

        <div className="space-y-3">
          <SectionShell
            title="Sobre você"
            status={sectionStatus('dados')}
            open={open === 'dados'}
            onToggle={() => toggle('dados')}
          >
            <DadosPessoaisSection form={form} setForm={setForm} />
          </SectionShell>

          <SectionShell
            title="Formação e cursos"
            subtitle="Até 3 cursos profissionalizantes"
            status={sectionStatus('cursos')}
            statusLabel={sectionStatusLabel('cursos')}
            open={open === 'cursos'}
            onToggle={() => toggle('cursos')}
          >
            <CursosSection form={form} setForm={setForm} />
          </SectionShell>

          <SectionShell
            title="Referências profissionais"
            subtitle="Últimas 3 empresas/estabelecimentos onde trabalhou"
            status={sectionStatus('referencias')}
            open={open === 'referencias'}
            onToggle={() => toggle('referencias')}
          >
            <ReferenciasSection form={form} setForm={setForm} />
          </SectionShell>

          <SectionShell
            title="Conecte-se"
            subtitle="Seu Instagram aumenta em 90% a chance de contratação"
            status={sectionStatus('redes')}
            statusLabel={sectionStatusLabel('redes')}
            open={open === 'redes'}
            onToggle={() => toggle('redes')}
          >
            <RedesSociaisSection form={form} setForm={setForm} />
          </SectionShell>

          <SectionShell
            title="Como você trabalha"
            status={sectionStatus('compat')}
            statusLabel={completion.compatOk ? undefined : 'Importante para match'}
            open={open === 'compat'}
            onToggle={() => toggle('compat')}
          >
            <CompatibilidadeSection form={form} setForm={setForm} />
          </SectionShell>

          <SectionShell
            title="Seu perfil"
            open={open === 'resumo'}
            onToggle={() => toggle('resumo')}
          >
            <ResumoSection form={form} />
          </SectionShell>
        </div>
      </motion.div>

      {/* Sticky save (mobile) + inline (desktop) */}
      <div className="md:mt-6 fixed md:static bottom-0 left-0 right-0 bg-white md:bg-transparent border-t md:border-0 border-[#E5E5E5] p-4 md:p-0 z-30">
        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  );
}
