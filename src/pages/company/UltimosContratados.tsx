import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function UltimosContratados() {
  const { user } = useAuth();
  const [contratados, setContratados] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: jobs } = await supabase.from('jobs').select('id, funcao, data_evento, valor').eq('company_id', user.id);
      const jobIds = jobs?.map(j => j.id) ?? [];
      if (jobIds.length === 0) return;

      const { data: apps } = await supabase
        .from('applications')
        .select('*')
        .in('job_id', jobIds)
        .eq('status', 'contratado')
        .order('created_at', { ascending: false })
        .limit(20);

      const enriched = await Promise.all(
        (apps ?? []).map(async (app) => {
          const { data: profile } = await supabase.from('freelancer_profiles').select('nome').eq('user_id', app.freelancer_id).single();
          const job = jobs?.find(j => j.id === app.job_id);
          return {
            ...app,
            nome: profile?.nome ?? 'Sem nome',
            funcao: job?.funcao ?? '',
            data_evento: job?.data_evento,
            valor: job?.valor,
          };
        })
      );
      setContratados(enriched);
    };
    fetch();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Últimos Contratados</h1>
      {contratados.length === 0 ? (
        <p className="text-muted-foreground">Nenhum freelancer contratado ainda.</p>
      ) : (
        <div className="space-y-3">
          {contratados.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{c.nome}</p>
                  <p className="text-sm text-muted-foreground">{c.funcao} • {c.data_evento && new Date(c.data_evento).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">R$ {Number(c.valor).toFixed(2)}</p>
                  <Badge className="mt-1">Contratado</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
