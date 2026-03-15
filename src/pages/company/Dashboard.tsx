import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    { title: 'Vagas Ativas', value: stats.ativas, icon: Briefcase, color: 'text-primary' },
    { title: 'Candidaturas Recebidas', value: stats.candidaturas, icon: Users, color: 'text-blue-500' },
    { title: 'Freelancers Contratados', value: stats.contratados, icon: CheckCircle, color: 'text-green-500' },
    { title: 'Vagas Encerradas', value: stats.encerradas, icon: XCircle, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentApps.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma candidatura recente.</p>
          ) : (
            <div className="space-y-3">
              {recentApps.map((app) => (
                <div key={app.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{app.funcao}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant={app.status === 'contratado' ? 'default' : 'secondary'}>
                    {app.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
