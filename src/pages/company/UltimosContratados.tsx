import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/AvatarUpload';
import { StaggerContainer, StaggerItem, FloatingIcon } from '@/components/PageTransition';
import { Users } from 'lucide-react';

interface ContratadoData {
  id: string;
  freelancer_id: string;
  nome: string;
  funcao: string;
  data_evento: string | undefined;
  valor: number | undefined;
}

export default function UltimosContratados() {
  const { user } = useAuth();
  const [contratados, setContratados] = useState<ContratadoData[]>([]);

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

      const enriched: ContratadoData[] = await Promise.all(
        (apps ?? []).map(async (app) => {
          const { data: profile } = await supabase.from('freelancer_profiles').select('nome').eq('user_id', app.freelancer_id).maybeSingle();
          const job = jobs?.find(j => j.id === app.job_id);
          return {
            id: app.id,
            freelancer_id: app.freelancer_id,
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
    <div className="space-y-8">
      <h1 className="text-display">Últimos Contratados</h1>
      {contratados.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-muted-foreground">
          <FloatingIcon><Users className="h-10 w-10 mb-3" /></FloatingIcon>
          <p className="text-sm">Nenhum freelancer contratado ainda.</p>
        </div>
      ) : (
        <StaggerContainer className="space-y-3">
          {contratados.map((c) => (
            <StaggerItem key={c.id}>
              <div className="border rounded-lg p-4 md:p-6 flex items-center justify-between card-hover">
                <div className="flex items-center gap-3">
                  <UserAvatar type="freelancer" userId={c.freelancer_id} name={c.nome} size={40} />
                  <div>
                    <p className="font-medium">{c.nome}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{c.funcao} · {c.data_evento && new Date(c.data_evento).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">R$ {Number(c.valor ?? 0).toFixed(2)}</p>
                  <Badge variant="contratado" className="mt-1.5">Contratado</Badge>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
