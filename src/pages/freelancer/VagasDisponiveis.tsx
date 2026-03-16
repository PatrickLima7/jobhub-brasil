import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Calendar, Clock, DollarSign } from 'lucide-react';

export default function VagasDisponiveis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('jobs').select('*').eq('status', 'ativa').order('created_at', { ascending: false });

      const enriched = await Promise.all(
        (data ?? []).map(async (job) => {
          const { data: company } = await supabase.from('company_profiles').select('nome').eq('user_id', job.company_id).maybeSingle();
          return { ...job, empresa_nome: company?.nome ?? 'Empresa' };
        })
      );
      setJobs(enriched);
    };
    fetch();
  }, []);

  const filtered = jobs.filter(j =>
    j.funcao.toLowerCase().includes(search.toLowerCase()) ||
    j.empresa_nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleCandidatar = async (jobId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('applications').insert({
        job_id: jobId,
        freelancer_id: user.id,
      });
      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Você já se candidatou a esta vaga.', variant: 'destructive' });
        } else throw error;
      } else {
        toast({ title: 'Candidatura enviada!' });
        setDialogOpen(false);
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const tipoPagLabel: Record<string, string> = { diaria: 'Diária', hora: 'Por hora', combinar: 'A combinar' };

  return (
    <div className="space-y-8">
      <h1 className="text-display">Vagas Disponíveis</h1>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Buscar por função ou empresa..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((job) => (
          <div key={job.id} className="border rounded-lg p-4 md:p-6 hover:bg-secondary transition-colors cursor-pointer" onClick={() => { setSelectedJob(job); setDialogOpen(true); }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{job.funcao}</h3>
                <p className="text-[13px] text-muted-foreground">{job.empresa_nome}</p>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">{tipoPagLabel[job.tipo_pagamento] ?? job.tipo_pagamento}</Badge>
            </div>
            <div className="space-y-1.5 text-[13px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {new Date(job.data_evento).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {job.horario_inicio} — {job.horario_fim}
              </div>
            </div>
            <p className="mt-3 font-semibold text-lg">R$ {Number(job.valor).toFixed(2)}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">Nenhuma vaga encontrada.</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg border p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl">{selectedJob?.funcao}</DialogTitle>
            <p className="text-[13px] text-muted-foreground">{selectedJob?.empresa_nome}</p>
          </DialogHeader>
          {selectedJob && (
            <div className="px-6 pb-6 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-[13px]">Data</span><p className="font-medium">{new Date(selectedJob.data_evento).toLocaleDateString('pt-BR')}</p></div>
                <div><span className="text-muted-foreground text-[13px]">Horário</span><p className="font-medium">{selectedJob.horario_inicio} — {selectedJob.horario_fim}</p></div>
                <div><span className="text-muted-foreground text-[13px]">Valor</span><p className="font-medium">R$ {Number(selectedJob.valor).toFixed(2)}</p></div>
                <div><span className="text-muted-foreground text-[13px]">Pagamento</span><p className="font-medium">{tipoPagLabel[selectedJob.tipo_pagamento]}</p></div>
                <div><span className="text-muted-foreground text-[13px]">Vagas</span><p className="font-medium">{selectedJob.num_vagas}</p></div>
              </div>
              {selectedJob.descricao && (
                <div>
                  <p className="text-[13px] text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm">{selectedJob.descricao}</p>
                </div>
              )}
              {selectedJob.requisitos && (
                <div>
                  <p className="text-[13px] text-muted-foreground mb-1">Requisitos</p>
                  <p className="text-sm">{selectedJob.requisitos}</p>
                </div>
              )}
              <Button className="w-full" onClick={() => handleCandidatar(selectedJob.id)}>
                Candidatar-se
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
