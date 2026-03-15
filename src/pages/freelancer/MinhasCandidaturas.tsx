import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function MinhasCandidaturas() {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('applications')
        .select('*')
        .eq('freelancer_id', user.id)
        .order('created_at', { ascending: false });

      const enriched = await Promise.all(
        (data ?? []).map(async (app) => {
          const { data: job } = await supabase.from('jobs').select('funcao, data_evento, valor, company_id').eq('id', app.job_id).single();
          let empresa = 'Empresa';
          if (job) {
            const { data: company } = await supabase.from('company_profiles').select('nome').eq('user_id', job.company_id).single();
            empresa = company?.nome ?? 'Empresa';
          }
          return { ...app, funcao: job?.funcao ?? '', data_evento: job?.data_evento, valor: job?.valor, empresa };
        })
      );
      setApps(enriched);
    };
    fetch();
  }, [user]);

  const statusColor: Record<string, string> = {
    aguardando: 'bg-yellow-100 text-yellow-800',
    contratado: 'bg-green-100 text-green-800',
    recusado: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Minhas Candidaturas</h1>
      <Card>
        <CardContent className="p-0">
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
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.funcao}</TableCell>
                  <TableCell>{app.empresa}</TableCell>
                  <TableCell>{app.data_evento && new Date(app.data_evento).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>R$ {Number(app.valor ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={statusColor[app.status] ?? ''}>
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
        </CardContent>
      </Card>
    </div>
  );
}
