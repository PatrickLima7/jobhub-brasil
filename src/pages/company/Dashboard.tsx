import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, CheckCircle, XCircle } from 'lucide-react';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ ativas: 0, candidaturas: 0, contratados: 0, encerradas: 0 });
  const [recentApps, setRecentApps] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
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
    };

    const fetchRecent = async () => {
      const { data: jobs } = await supabase.from('jobs').select('id, funcao').eq('company_id', user.id);
      const jobIds = jobs?.map(j => j.id) ?? [];
      if (jobIds.length === 0) return;

      const { data } = await supabase
        .from('applications')
        .select('id, status, created_at, freelancer_id, job_id')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false })
        .limit(5);

      const enriched = (data ?? []).map(app => ({
        ...app,
        funcao: jobs?.find(j => j.id === app.job_id)?.funcao ?? '',
      }));
      setRecentApps(enriched);
    };

    fetchStats();
    fetchRecent();
  }, [user]);

  const cards = [
    { title: 'VAGAS ATIVAS', value: stats.ativas, icon: Briefcase },
    { title: 'CANDIDATURAS', value: stats.candidaturas, icon: Users },
    { title: 'CONTRATADOS', value: stats.contratados, icon: CheckCircle },
    { title: 'ENCERRADAS', value: stats.encerradas, icon: XCircle },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-display">Dashboard</h1>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.title} className="border rounded-lg p-6">
            <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-3">{c.title}</p>
            <p className="text-[32px] font-bold leading-none">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="border rounded-lg">
        <div className="p-6 pb-4">
          <h2 className="text-heading">Atividade Recente</h2>
        </div>
        <div className="px-6 pb-6">
          {recentApps.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma candidatura recente.</p>
          ) : (
            <div className="space-y-0">
              {recentApps.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{app.funcao}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant={app.status === 'contratado' ? 'contratado' : app.status === 'aguardando' ? 'aguardando' : 'default'}>
                    {app.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
