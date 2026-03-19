import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { AlertBanner } from '@/components/AlertBanner';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { StaggerContainer, StaggerItem, FloatingIcon } from '@/components/PageTransition';
import { SkeletonCard } from '@/components/SkeletonCard';
import { Search, Calendar, Clock, X, SlidersHorizontal, SearchX } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const FUNCOES = ['Garçom', 'Garçonete', 'Bartender', 'Cozinheiro', 'Auxiliar de Cozinha', 'Recepcionista', 'Copeiro'];
const TIPO_PAG_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'diaria', label: 'Diária' },
  { value: 'hora', label: 'Por hora' },
  { value: 'combinar', label: 'A combinar' },
];
const SORT_OPTIONS = [
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'valor', label: 'Maior valor' },
];

interface JobWithStatus {
  id: string;
  funcao: string;
  descricao: string | null;
  data_evento: string;
  horario_inicio: string | null;
  horario_fim: string | null;
  valor: number;
  tipo_pagamento: string;
  num_vagas: number;
  requisitos: string | null;
  empresa_nome: string;
  company_id: string;
  created_at: string;
  applicationStatus: string | null;
}

export default function VagasDisponiveis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { checkFreelancerProfile, checkSpamProtection } = useSystemAlerts();

  const [jobs, setJobs] = useState<JobWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFuncoes, setSelectedFuncoes] = useState<string[]>([]);
  const [cidade, setCidade] = useState('');
  const [dataMinima, setDataMinima] = useState<Date>();
  const [valorMinimo, setValorMinimo] = useState('');
  const [tipoPagamento, setTipoPagamento] = useState('todos');
  const [sortBy, setSortBy] = useState('recentes');
  const [selectedJob, setSelectedJob] = useState<JobWithStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [profileAlert, setProfileAlert] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'ativa')
        .order('created_at', { ascending: false });

      const { data: myApps } = await supabase
        .from('applications')
        .select('job_id, status')
        .eq('freelancer_id', user.id);

      const appMap = new Map<string, string>();
      (myApps ?? []).forEach((a) => appMap.set(a.job_id, a.status));

      const enriched = await Promise.all(
        (data ?? []).map(async (job) => {
          const { data: company } = await supabase
            .from('company_profiles')
            .select('nome')
            .eq('user_id', job.company_id)
            .maybeSingle();
          return {
            ...job,
            empresa_nome: company?.nome ?? 'Empresa',
            applicationStatus: appMap.get(job.id) ?? null,
          } as JobWithStatus;
        })
      );
      setJobs(enriched);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const hasActiveFilters = search || selectedFuncoes.length > 0 || cidade || dataMinima || valorMinimo || tipoPagamento !== 'todos';

  const clearFilters = () => {
    setSearch('');
    setSelectedFuncoes([]);
    setCidade('');
    setDataMinima(undefined);
    setValorMinimo('');
    setTipoPagamento('todos');
  };

  const filtered = useMemo(() => {
    let result = jobs.filter((j) => {
      if (search) {
        const s = search.toLowerCase();
        if (!j.funcao.toLowerCase().includes(s) && !j.empresa_nome.toLowerCase().includes(s)) return false;
      }
      if (selectedFuncoes.length > 0 && !selectedFuncoes.some((f) => j.funcao.toLowerCase().includes(f.toLowerCase()))) return false;
      if (cidade && !j.empresa_nome.toLowerCase().includes(cidade.toLowerCase())) return false;
      if (dataMinima && new Date(j.data_evento) < dataMinima) return false;
      if (valorMinimo && j.valor < parseFloat(valorMinimo)) return false;
      if (tipoPagamento !== 'todos' && j.tipo_pagamento !== tipoPagamento) return false;
      return true;
    });

    if (sortBy === 'valor') {
      result = [...result].sort((a, b) => b.valor - a.valor);
    }

    return result;
  }, [jobs, search, selectedFuncoes, cidade, dataMinima, valorMinimo, tipoPagamento, sortBy]);

  const handleCandidatar = async (jobId: string) => {
    if (!user) return;

    if (!checkSpamProtection()) return;

    const profileCheck = await checkFreelancerProfile(user.id);
    if (!profileCheck.valid) {
      setProfileAlert(profileCheck.message);
      return;
    }
    setProfileAlert('');

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
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, applicationStatus: 'aguardando' } : j))
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    }
  };

  const tipoPagLabel: Record<string, string> = { diaria: 'Diária', hora: 'Por hora', combinar: 'A combinar' };

  const toggleFuncao = (f: string) => {
    setSelectedFuncoes((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const getCardBorderClass = (status: string | null) => {
    if (status === 'contratado') return 'border-l-[3px] border-l-success';
    if (status === 'aguardando') return 'border-l-[3px] border-l-accent';
    if (status === 'recusado') return 'opacity-55';
    return '';
  };

  const renderFilters = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-[13px] font-medium text-muted-foreground">Função</p>
        <div className="flex flex-wrap gap-2">
          {FUNCOES.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggleFuncao(f)}
              className={cn(
                'inline-flex items-center rounded-pill px-3 py-1.5 text-xs font-medium border transition-colors duration-150 cursor-pointer',
                selectedFuncoes.includes(f)
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-foreground border-border hover:bg-secondary'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[13px] font-medium text-muted-foreground">Cidade</p>
        <div className="relative">
          <Input placeholder="Ex: São Paulo" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          {cidade && (
            <button
              onClick={() => setCidade('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[13px] font-medium text-muted-foreground">A partir de</p>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn('w-full justify-start text-left font-normal bg-secondary', !dataMinima && 'text-muted-foreground')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {dataMinima ? format(dataMinima, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent mode="single" selected={dataMinima} onSelect={setDataMinima} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1.5">
        <p className="text-[13px] font-medium text-muted-foreground">Valor mínimo</p>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
          <Input
            type="number"
            min="0"
            step="10"
            className="pl-10"
            placeholder="0"
            value={valorMinimo}
            onChange={(e) => setValorMinimo(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-medium text-muted-foreground">Tipo de pagamento</p>
        <div className="flex flex-wrap gap-2">
          {TIPO_PAG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTipoPagamento(opt.value)}
              className={cn(
                'inline-flex items-center rounded-pill px-3 py-1.5 text-xs font-medium border transition-colors duration-150 cursor-pointer',
                tipoPagamento === opt.value
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-foreground border-border hover:bg-secondary'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-medium text-muted-foreground">Ordenar por</p>
        <div className="flex gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSortBy(opt.value)}
              className={cn(
                'inline-flex items-center rounded-pill px-3 py-1.5 text-xs font-medium border transition-colors duration-150 cursor-pointer',
                sortBy === opt.value
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-foreground border-border hover:bg-secondary'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-display">Vagas Disponíveis</h1>
        <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-display">Vagas Disponíveis</h1>

      {profileAlert && (
        <AlertBanner message={profileAlert} linkTo="/freelancer/perfil" linkLabel="Completar perfil" />
      )}

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar por função ou empresa..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {isMobile && (
          <Button variant="outline" onClick={() => setFilterDrawerOpen(true)} className="shrink-0 btn-press">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Desktop filters inline */}
      {!isMobile && <div className="border rounded-lg p-6">{renderFilters()}</div>}

      {/* Mobile filter drawer */}
      <Drawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Filtros</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-auto">{renderFilters()}</div>
          <div className="px-4 pb-6">
            <Button className="w-full btn-press" onClick={() => setFilterDrawerOpen(false)}>
              Aplicar
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Results info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} vaga{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
        </p>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors duration-150">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Job cards grid */}
      <StaggerContainer className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((job) => (
          <StaggerItem key={job.id}>
            <div
              className={cn(
                'border rounded-lg p-4 md:p-6 hover:bg-secondary transition-colors duration-150 cursor-pointer relative card-hover',
                getCardBorderClass(job.applicationStatus)
              )}
              onClick={() => {
                setSelectedJob(job);
                setDialogOpen(true);
              }}
            >
              {/* Application status badge */}
              {job.applicationStatus === 'aguardando' && (
                <Badge variant="ativa" className="absolute top-3 right-3 text-[11px]">Candidatura enviada</Badge>
              )}
              {job.applicationStatus === 'contratado' && (
                <Badge variant="contratado" className="absolute top-3 right-3 text-[11px]">Contratado ✓</Badge>
              )}
              {job.applicationStatus === 'recusado' && (
                <Badge variant="encerrada" className="absolute top-3 right-3 text-[11px]">Não selecionado</Badge>
              )}

              <div className="flex items-start justify-between mb-3 pr-24">
                <div>
                  <h3 className="font-semibold">{job.funcao}</h3>
                  <p className="text-[13px] text-muted-foreground">{job.empresa_nome}</p>
                </div>
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
              <div className="flex items-center justify-between mt-3">
                <p className="font-semibold text-lg">R$ {Number(job.valor).toFixed(2)}</p>
                <Badge variant="secondary" className="text-xs">{tipoPagLabel[job.tipo_pagamento] ?? job.tipo_pagamento}</Badge>
              </div>
            </div>
          </StaggerItem>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FloatingIcon><SearchX className="h-10 w-10 mb-3" /></FloatingIcon>
            <p className="text-sm">Nenhuma vaga encontrada no momento.</p>
            <p className="text-[13px]">Ajuste os filtros ou volte mais tarde.</p>
          </div>
        )}
      </StaggerContainer>

      {/* Job detail dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg border p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl">{selectedJob?.funcao}</DialogTitle>
            <p className="text-[13px] text-muted-foreground">{selectedJob?.empresa_nome}</p>
          </DialogHeader>
          {selectedJob && (
            <div className="px-6 pb-6 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-[13px]">Data</span>
                  <p className="font-medium">{new Date(selectedJob.data_evento).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[13px]">Horário</span>
                  <p className="font-medium">{selectedJob.horario_inicio} — {selectedJob.horario_fim}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[13px]">Valor</span>
                  <p className="font-medium">R$ {Number(selectedJob.valor).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[13px]">Pagamento</span>
                  <p className="font-medium">{tipoPagLabel[selectedJob.tipo_pagamento]}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[13px]">Vagas</span>
                  <p className="font-medium">{selectedJob.num_vagas}</p>
                </div>
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

              {selectedJob.applicationStatus === 'aguardando' && (
                <Button className="w-full" disabled>
                  Candidatura enviada
                </Button>
              )}
              {selectedJob.applicationStatus === 'contratado' && (
                <Button variant="outline" className="w-full btn-press" onClick={() => setDialogOpen(false)}>
                  Ver detalhes
                </Button>
              )}
              {selectedJob.applicationStatus === 'recusado' && (
                <Button className="w-full" disabled>
                  Não selecionado
                </Button>
              )}
              {!selectedJob.applicationStatus && (
                <Button className="w-full btn-press" onClick={() => handleCandidatar(selectedJob.id)}>
                  Candidatar-se
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
