import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StaggerContainer, StaggerItem, FloatingIcon } from '@/components/PageTransition';
import { FileText } from 'lucide-react';

interface AppData {
  id: string;
  status: string;
  created_at: string;
  funcao: string;
  data_evento: string | undefined;
  valor: number | undefined;
  empresa: string;
}

export default function MinhasCandidaturas() {
  const { user } = useAuth();
  const [apps, setApps] = useState<AppData[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('applications')
        .select('*')
        .eq('freelancer_id', user.id)
        .order('created_at', { ascending: false });

      const enriched: AppData[] = await Promise.all(
        (data ?? []).map(async (app) => {
          const { data: job } = await supabase.from('jobs').select('funcao, data_evento, valor, company_id').eq('id', app.job_id).single();
          let empresa = 'Empresa';
          if (job) {
            const { data: company } = await supabase.from('company_profiles').select('nome').eq('user_id', job.company_id).maybeSingle();
            empresa = company?.nome ?? 'Empresa';
          }
          return { ...app, funcao: job?.funcao ?? '', data_evento: job?.data_evento, valor: job?.valor, empresa };
        })
      );
      setApps(enriched);
    };
    fetch();
  }, [user]);

  const statusVariant = (status: string) => {
    if (status === 'contratado') return 'contratado' as const;
    if (status === 'recusado') return 'recusado' as const;
    return 'aguardando' as const;
  };

  return (
    <div className="space-y-8">
      <h1 className="text-display">Minhas Candidaturas</h1>

      {/* Mobile cards */}
      <StaggerContainer className="md:hidden space-y-3">
        {apps.map((app) => (
          <StaggerItem key={app.id}>
            <div className="border rounded-lg p-4 card-hover">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold">{app.funcao}</p>
                  <p className="text-[13px] text-muted-foreground">{app.empresa}</p>
                </div>
                <Badge variant={statusVariant(app.status)}>
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                <span>{app.data_evento && new Date(app.data_evento).toLocaleDateString('pt-BR')}</span>
                <span className="font-medium text-foreground">R$ {Number(app.valor ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </StaggerItem>
        ))}
        {apps.length === 0 && (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <FloatingIcon><FileText className="h-10 w-10 mb-3" /></FloatingIcon>
            <p className="text-sm">Nenhuma candidatura encontrada.</p>
          </div>
        )}
      </StaggerContainer>

      {/* Desktop table */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Função</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.id} className="transition-colors duration-150">
                <TableCell className="font-medium">{app.funcao}</TableCell>
                <TableCell>{app.empresa}</TableCell>
                <TableCell>{app.data_evento && new Date(app.data_evento).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>R$ {Number(app.valor ?? 0).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(app.status)}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {apps.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma candidatura encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
