import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, MapPin, Clock, DollarSign } from 'lucide-react';

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
          const { data: company } = await supabase.from('company_profiles').select('nome').eq('user_id', job.company_id).single();
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vagas Disponíveis</h1>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Buscar por função ou empresa..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((job) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{job.funcao}</CardTitle>
              <p className="text-sm text-muted-foreground">{job.empresa_nome}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {new Date(job.data_evento).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {job.horario_inicio} — {job.horario_fim}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="h-3.5 w-3.5" />
                R$ {Number(job.valor).toFixed(2)}
                <Badge variant="secondary" className="ml-auto text-xs">{tipoPagLabel[job.tipo_pagamento] ?? job.tipo_pagamento}</Badge>
              </div>
              <Button className="w-full mt-2" variant="outline" onClick={() => { setSelectedJob(job); setDialogOpen(true); }}>
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">Nenhuma vaga encontrada.</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedJob?.funcao}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedJob.empresa_nome}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Data:</strong> {new Date(selectedJob.data_evento).toLocaleDateString('pt-BR')}</div>
                <div><strong>Horário:</strong> {selectedJob.horario_inicio} — {selectedJob.horario_fim}</div>
                <div><strong>Valor:</strong> R$ {Number(selectedJob.valor).toFixed(2)}</div>
                <div><strong>Pagamento:</strong> {tipoPagLabel[selectedJob.tipo_pagamento]}</div>
                <div><strong>Vagas:</strong> {selectedJob.num_vagas}</div>
              </div>
              {selectedJob.descricao && (
                <div>
                  <h4 className="font-medium mb-1">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{selectedJob.descricao}</p>
                </div>
              )}
              {selectedJob.requisitos && (
                <div>
                  <h4 className="font-medium mb-1">Requisitos</h4>
                  <p className="text-sm text-muted-foreground">{selectedJob.requisitos}</p>
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
