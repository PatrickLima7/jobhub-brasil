import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StaggerContainer, StaggerItem, FloatingIcon } from '@/components/PageTransition';
import { SkeletonCard } from '@/components/SkeletonCard';
import { RatingModal } from '@/components/RatingModal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, CheckCircle2 } from 'lucide-react';

interface AppData {
  id: string;
  status: string;
  created_at: string;
  funcao: string;
  data_evento: string | undefined;
  valor: number | undefined;
  empresa: string;
  company_id: string;
}

const STATUS_LABELS: Record<string, string> = {
  aguardando: 'Aguardando',
  contratado: 'Contratado',
  recusado: 'Recusado',
  aguardando_freelancer: 'Aguardando Confirmação',
  concluido: 'Concluído',
};

export default function MinhasCandidaturas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmAppId, setConfirmAppId] = useState<string | null>(null);
  const [confirmCompanyId, setConfirmCompanyId] = useState<string | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Single query for all applications
        const { data: applicationsData } = await supabase
          .from('applications')
          .select('id, status, created_at, job_id, jobs ( company_id )')
          .eq('freelancer_id', user.id)
          .order('created_at', { ascending: false });

        const applications = applicationsData ?? [];
        if (applications.length === 0) {
          setApps([]);
          return;
        }

        // Batch fetch all jobs in ONE query
        const jobIds = applications.map(a => a.job_id);
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, funcao, data_evento, valor, company_id')
          .in('id', jobIds);

        const jobMap = new Map((jobs ?? []).map(j => [j.id, j]));

        // Batch fetch all company profiles in ONE query
        const companyIds = [...new Set((jobs ?? []).map(j => j.company_id))];
        const { data: companies } = companyIds.length > 0
          ? await supabase
              .from('company_profiles')
              .select('user_id, nome')
              .in('user_id', companyIds)
          : { data: [] };

        const companyMap = new Map((companies ?? []).map(c => [c.user_id, c]));

        const enriched: AppData[] = applications.map(app => {
          const job = jobMap.get(app.job_id);
          const company = job ? companyMap.get(job.company_id) : null;
          return {
            id: app.id,
            status: app.status,
            created_at: app.created_at,
            funcao: job?.funcao ?? '',
            data_evento: job?.data_evento,
            valor: job?.valor,
            empresa: company?.nome ?? 'Empresa',
            company_id: job?.company_id ?? '',
          };
        });

        setApps(enriched);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Realtime: when company updates application status (ex: aguardando_freelancer or concluido),
    // update the freelancer's view immediately so the button appears/disappears correctly.
    const channel = supabase
      .channel(`candidaturas-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `freelancer_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as { id: string; status: string };
          setApps(prev =>
            prev.map(a => a.id === updated.id ? { ...a, status: updated.status } : a)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleOpenConfirm = (appId: string, companyId: string) => {
    setConfirmAppId(appId);
    setConfirmCompanyId(companyId);
    setRatingModalOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!confirmAppId || !user) return;
    try {
      // Simple, direct update by ID only - no extra filters that cause silent failures
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'concluido' })
        .eq('id', confirmAppId);

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw new Error(updateError.message);
      }

      // Increment completed_jobs
      const { data: profile } = await supabase
        .from('freelancer_profiles')
        .select('completed_jobs')
        .eq('user_id', user.id)
        .single();
      
      const currentJobs = profile?.completed_jobs ?? 0;
      await supabase
        .from('freelancer_profiles')
        .update({ completed_jobs: currentJobs + 1 })
        .eq('user_id', user.id);

      toast({ title: 'Serviço concluído! 🎉', description: `Você tem agora ${currentJobs + 1} trampos concluídos.` });

      // Update local state immediately to hide the confirm button
      setApps(prev => prev.map(a => a.id === confirmAppId ? { ...a, status: 'concluido' } : a));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      console.error('handleConfirmComplete error:', e);
      toast({ title: 'Erro ao confirmar serviço', description: message, variant: 'destructive' });
    }
  };

  const statusVariant = (status: string) => {
    if (status === 'contratado' || status === 'concluido') return 'contratado' as const;
    if (status === 'recusado') return 'recusado' as const;
    if (status === 'aguardando_freelancer') return 'outline' as const;
    return 'aguardando' as const;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-xl md:text-display font-bold">Minhas Candidaturas</h1>
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl md:text-display font-bold">Minhas Candidaturas</h1>

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
                  {STATUS_LABELS[app.status] ?? app.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[13px] text-muted-foreground mt-3 pt-3 border-t">
                <span>{app.data_evento && new Date(app.data_evento).toLocaleDateString('pt-BR')}</span>
                <span className="font-medium text-foreground">R$ {Number(app.valor ?? 0).toFixed(2)}</span>
              </div>
              {app.status === 'aguardando_freelancer' && (
                <div className="mt-3">
                  <Button 
                    className="w-full gap-2 bg-success text-success-foreground hover:bg-success/90" 
                    onClick={() => handleOpenConfirm(app.id, (app as any).company_id || '')}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Confirmar Conclusão
                  </Button>
                </div>
              )}
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
                  <div className="flex items-center gap-3">
                    <Badge variant={statusVariant(app.status)}>
                      {STATUS_LABELS[app.status] ?? app.status}
                    </Badge>
                    {app.status === 'aguardando_freelancer' && (
                      <Button 
                        size="sm" 
                        className="gap-1.5 h-7 text-xs bg-success text-success-foreground hover:bg-success/90" 
                        onClick={() => handleOpenConfirm(app.id, (app as any).company_id || '')}
                      >
                        <CheckCircle2 className="h-3 w-3" /> Confirmar
                      </Button>
                    )}
                  </div>
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

      {/* Rating Modal for freelancer confirming completion */}
      {confirmAppId && confirmCompanyId && user && (
        <RatingModal
          open={ratingModalOpen}
          onOpenChange={setRatingModalOpen}
          title="Avaliar Empresa"
          applicationId={confirmAppId}
          reviewerId={user.id}
          revieweeId={confirmCompanyId}
          reviewerRole="freelancer"
          onComplete={handleConfirmComplete}
        />
      )}
    </div>
  );
}
