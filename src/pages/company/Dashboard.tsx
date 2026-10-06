import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, CheckCircle, XCircle, Wallet, Activity } from 'lucide-react';
import { StaggerContainer, StaggerItem } from '@/components/PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_LABELS: Record<string, string> = {
  aguardando: 'Aguardando',
  contratado: 'Contratado',
  recusado: 'Recusado',
  concluido: 'Concluído',
  aguardando_freelancer: 'Confirmação Pendente',
};

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ ativas: 0, candidaturas: 0, contratados: 0, encerradas: 0 });
  const [recentApps, setRecentApps] = useState<Array<{
    id: string;
    status: string;
    created_at: string;
    funcao: string;
    isNew?: boolean;
  }>>([]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const { data: jobs } = await supabase.from('jobs').select('id, status').eq('company_id', user.id);
    const ativas = jobs?.filter(j => j.status === 'ativa').length ?? 0;
    const encerradas = jobs?.filter(j => j.status === 'encerrada').length ?? 0;
    const jobIds = jobs?.map(j => j.id) ?? [];

    let candidaturas = 0;
    let contratados = 0;
    if (jobIds.length > 0) {
      const { data: apps } = await supabase.from('applications').select('id, status').in('job_id', jobIds);
      candidaturas = apps?.length ?? 0;
      contratados = apps?.filter(a => a.status === 'contratado').length ?? 0;
    }

    setStats({ ativas, candidaturas, contratados, encerradas });
  }, [user]);

  const fetchRecent = useCallback(async () => {
    if (!user) return;
    const { data: jobs } = await supabase.from('jobs').select('id, funcao').eq('company_id', user.id);
    const jobIds = jobs?.map(j => j.id) ?? [];
    if (jobIds.length === 0) return;

    const { data } = await supabase
      .from('applications')
      .select('id, status, created_at, freelancer_id, job_id')
      .in('job_id', jobIds)
      .order('created_at', { ascending: false })
      .limit(8);

    const enriched = (data ?? []).map(app => ({
      ...app,
      funcao: jobs?.find(j => j.id === app.job_id)?.funcao ?? '',
      isNew: false,
    }));
    setRecentApps(enriched);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    fetchStats();
    fetchRecent();

    // Realtime subscription for this company's job applications
    const setupRealtime = async () => {
      const { data: jobs } = await supabase.from('jobs').select('id').eq('company_id', user.id);
      const jobIds = jobs?.map(j => j.id) ?? [];
      if (jobIds.length === 0) return;

      const channel = supabase
        .channel(`dashboard-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'applications', filter: `job_id=in.(${jobIds.join(',')})` },
          (payload) => {
            // Refresh stats and recent on any application change
            fetchStats();
            
            if (payload.eventType === 'INSERT') {
              // Add new application to top of list with "isNew" flag
              const newApp = payload.new as { id: string; status: string; created_at: string; job_id: string; freelancer_id: string };
              const funcao = jobs?.find(j => j.id === newApp.job_id)?.funcao ?? '';
              setRecentApps(prev => {
                const exists = prev.find(a => a.id === newApp.id);
                if (exists) return prev;
                return [{ ...newApp, funcao, isNew: true }, ...prev].slice(0, 8);
              });
            } else if (payload.eventType === 'UPDATE') {
              setRecentApps(prev =>
                prev.map(a => a.id === (payload.new as any).id ? { ...a, status: (payload.new as any).status } : a)
              );
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    const cleanup = setupRealtime();
    return () => { cleanup.then(fn => fn && fn()); };
  }, [user, fetchStats, fetchRecent]);

  const cards = [
    { title: 'Vagas Ativas', value: stats.ativas, icon: Briefcase, color: 'text-accent' },
    { title: 'Candidaturas', value: stats.candidaturas, icon: Users, color: 'text-blue-500' },
    { title: 'Contratados', value: stats.contratados, icon: CheckCircle, color: 'text-success' },
    { title: 'Encerradas', value: stats.encerradas, icon: XCircle, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-xl md:text-display font-bold">Dashboard</h1>

      <StaggerContainer className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StaggerItem key={c.title}>
            <div className="border rounded-lg p-4 md:p-6 hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <p className="text-[11px] md:text-[13px] font-medium text-muted-foreground uppercase tracking-wider">{c.title}</p>
              </div>
              <p className="text-2xl md:text-[32px] font-bold leading-none">{c.value}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Saldo card */}
      <StaggerItem>
        <div className="border rounded-lg p-4 md:p-6">
          <div className="flex items-center gap-3 mb-2 md:mb-3">
            <Wallet className="h-5 w-5 text-accent" />
            <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">Saldo disponível</p>
          </div>
          <p className="text-2xl md:text-[32px] font-bold leading-none">R$ 0,00</p>
          <p className="text-[12px] text-muted-foreground mt-2">Disponível para próximas contratações</p>
        </div>
      </StaggerItem>

      <div className="border rounded-lg overflow-hidden">
        <div className="p-4 md:p-6 pb-3 md:pb-4 flex items-center gap-2 border-b">
          <Activity className="h-4 w-4 text-success" />
          <h2 className="text-sm md:text-heading font-semibold">Atividade Recente</h2>
          <span className="ml-auto text-[11px] text-success font-medium flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Tempo Real
          </span>
        </div>
        <div className="divide-y">
          {recentApps.length === 0 ? (
            <p className="text-muted-foreground text-sm p-4 md:p-6">Nenhuma candidatura recente.</p>
          ) : (
            <AnimatePresence initial={false}>
              {recentApps.map((app) => (
                <motion.div
                  key={app.id}
                  initial={app.isNew ? { opacity: 0, y: -12, backgroundColor: 'hsl(var(--accent-soft))' } : false}
                  animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center justify-between px-4 md:px-6 py-3"
                >
                  <div>
                    <p className="font-medium text-sm">{app.funcao}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString('pt-BR')} às {new Date(app.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge variant={
                    app.status === 'contratado' ? 'contratado' :
                    app.status === 'aguardando' ? 'aguardando' :
                    app.status === 'recusado' ? 'recusado' :
                    'default'
                  }>
                    {STATUS_LABELS[app.status] ?? app.status}
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
