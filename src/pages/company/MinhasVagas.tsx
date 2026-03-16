import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function MinhasVagas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState('todas');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);

  const fetchJobs = async () => {
    if (!user) return;
    const { data } = await supabase.from('jobs').select('*').eq('company_id', user.id).order('created_at', { ascending: false });

    const jobsWithCounts = await Promise.all(
      (data ?? []).map(async (job) => {
        const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('job_id', job.id);
        return { ...job, candidaturas: count ?? 0 };
      })
    );
    setJobs(jobsWithCounts);
  };

  useEffect(() => { fetchJobs(); }, [user]);

  const filteredJobs = filter === 'todas' ? jobs : jobs.filter(j => j.status === filter);

  const handleEncerrar = async (jobId: string) => {
    await supabase.from('jobs').update({ status: 'encerrada' }).eq('id', jobId);
    toast({ title: 'Vaga encerrada' });
    fetchJobs();
  };

  const handleVerCandidatos = async (job: any) => {
    setSelectedJob(job);
    const { data } = await supabase.from('applications').select('*').eq('job_id', job.id);
    const apps = data ?? [];
    const enriched = await Promise.all(apps.map(async (app) => {
      const { data: profile } = await supabase.from('freelancer_profiles').select('nome').eq('user_id', app.freelancer_id).maybeSingle();
      return { ...app, freelancer_nome: profile?.nome ?? 'Sem nome' };
    }));
    setCandidates(enriched);
    setDrawerOpen(true);
  };

  const handleContratar = async (appId: string) => {
    await supabase.from('applications').update({ status: 'contratado' }).eq('id', appId);
    toast({ title: 'Freelancer contratado!' });
    if (selectedJob) handleVerCandidatos(selectedJob);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-display">Minhas Vagas</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 bg-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="ativa">Ativas</SelectItem>
            <SelectItem value="encerrada">Encerradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filteredJobs.map((job) => (
          <div key={job.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{job.funcao}</p>
                <p className="text-[13px] text-muted-foreground">{new Date(job.data_evento).toLocaleDateString('pt-BR')}</p>
              </div>
              <Badge variant={job.status === 'ativa' ? 'ativa' : 'encerrada'}>
                {job.status === 'ativa' ? 'Ativa' : 'Encerrada'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">R$ {Number(job.valor).toFixed(2)}</span>
              <span className="text-muted-foreground">{job.candidaturas} candidatura(s)</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleVerCandidatos(job)}>
                Ver Candidatos
              </Button>
              {job.status === 'ativa' && (
                <Button size="sm" variant="destructive" onClick={() => handleEncerrar(job.id)}>
                  Encerrar
                </Button>
              )}
            </div>
          </div>
        ))}
        {filteredJobs.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma vaga encontrada.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Função</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Candidaturas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.funcao}</TableCell>
                <TableCell>{new Date(job.data_evento).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>R$ {Number(job.valor).toFixed(2)}</TableCell>
                <TableCell>{job.candidaturas}</TableCell>
                <TableCell>
                  <Badge variant={job.status === 'ativa' ? 'ativa' : 'encerrada'}>
                    {job.status === 'ativa' ? 'Ativa' : 'Encerrada'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleVerCandidatos(job)}>
                      Ver Candidatos
                    </Button>
                    {job.status === 'ativa' && (
                      <Button size="sm" variant="destructive" onClick={() => handleEncerrar(job.id)}>
                        Encerrar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredJobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhuma vaga encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-[420px] border-l p-0">
          <SheetHeader className="p-6 border-b">
            <SheetTitle>Candidatos — {selectedJob?.funcao}</SheetTitle>
          </SheetHeader>
          <div className="p-6 space-y-3 overflow-auto max-h-[calc(100vh-80px)]">
            {candidates.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum candidato ainda.</p>
            ) : (
              candidates.map((c) => (
                <div key={c.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div>
                    <p className="font-medium text-sm">{c.freelancer_nome}</p>
                    <Badge variant={c.status === 'contratado' ? 'contratado' : 'aguardando'} className="mt-1.5">
                      {c.status}
                    </Badge>
                  </div>
                  {c.status === 'aguardando' && (
                    <Button size="sm" onClick={() => handleContratar(c.id)}>Contratar</Button>
                  )}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
