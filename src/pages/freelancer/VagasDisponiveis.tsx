import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { Search, Calendar, Clock, X, SlidersHorizontal, SearchX, MapPin, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { JobsMap } from '@/components/JobsMap';
import { Map as MapIcon, List as ListIcon } from 'lucide-react';
import { SwipeButton } from '@/components/SwipeButton';

const FUNCOES = ['Garçom', 'Garçonete', 'Bartender', 'Auxiliar de Cozinha', 'Auxiliar Geral', 'Recepcionista'];
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
  num_vagas: number;
  requisitos: string | null;
  empresa_nome: string;
  empresa_cidade: string;
  company_id: string;
  created_at: string;
  applicationStatus: string | null;
  tipo_vaga?: 'freelancer' | 'clt';
  lat?: number | null;
  lng?: number | null;
  empresa_endereco_completo?: string;
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
  const [filterTipo, setFilterTipo] = useState<'todas' | 'freelancer' | 'clt'>('todas');
  const [cidade, setCidade] = useState('');
  const [dataMinima, setDataMinima] = useState<Date>();
  const [sortBy, setSortBy] = useState('recentes');
  const [selectedJob, setSelectedJob] = useState<JobWithStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [profileAlert, setProfileAlert] = useState('');
  const [applying, setApplying] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Geolocation
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoActive, setGeoActive] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Single query for jobs - use * to get all fields including endereco and beneficios
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'ativa')
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
      }

      // Single query for user's applications
      const { data: myApps } = await supabase
        .from('applications')
        .select('job_id, status')
        .eq('freelancer_id', user.id);

      const appMap = new Map<string, string>();
      (myApps ?? []).forEach((a) => appMap.set(a.job_id, a.status));

      const jobs = jobsData ?? [];

      // Batch fetch all company profiles in ONE query (fix N+1)
      const companyIds = [...new Set(jobs.map(j => j.company_id))];
      const { data: companies } = companyIds.length > 0
        ? await supabase
            .from('company_profiles')
            .select('user_id, nome, endereco_cidade, endereco_rua, endereco_numero, endereco_bairro')
            .in('user_id', companyIds)
        : { data: [] };

      const companyMap = new Map(
        (companies ?? []).map(c => [c.user_id, c])
      );

      const enriched: JobWithStatus[] = jobs.map(job => {
        const company = companyMap.get(job.company_id);
        
        let enderecoFormatado = '';
        if (company) {
          const partes = [
            company.endereco_rua ? `${company.endereco_rua}, ${company.endereco_numero || 'S/N'}` : '',
            company.endereco_bairro,
            company.endereco_cidade
          ].filter(Boolean);
          enderecoFormatado = partes.join(' - ');
        }

        return {
          ...job,
          empresa_nome: company?.nome ?? 'Empresa',
          empresa_cidade: company?.endereco_cidade ?? '',
          empresa_endereco_completo: enderecoFormatado,
          applicationStatus: appMap.get(job.id) ?? null,
        };
      });

      setJobs(enriched);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRequestGeo = useCallback(() => {
    if (geoActive) {
      setGeoActive(false);
      if (sortBy === 'proximas') setSortBy('recentes');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeoActive(true);
        setGeoLoading(false);
        setSortBy('proximas');
      },
      () => {
        toast({ title: 'Permissão negada. Use o filtro de cidade.', variant: 'destructive' });
        setGeoLoading(false);
      }
    );
  }, [geoActive, sortBy, toast]);

  const hasActiveFilters = search || selectedFuncoes.length > 0 || cidade || dataMinima;

  const clearFilters = () => {
    setSearch('');
    setSelectedFuncoes([]);
    setCidade('');
    setDataMinima(undefined);
  };

  const sortOptions = useMemo(() => {
    const opts = [...SORT_OPTIONS];
    if (geoActive) opts.push({ value: 'proximas', label: 'Mais próximas' });
    return opts;
  }, [geoActive]);

  const filtered = useMemo(() => {
    let result = jobs;

    if (filterTipo !== 'todas') {
      result = result.filter((j) => j.tipo_vaga === filterTipo);
    }

    result = result.filter((j) => {
      if (search) {
        const s = search.toLowerCase();
        if (!j.funcao.toLowerCase().includes(s) && !j.empresa_nome.toLowerCase().includes(s)) return false;
      }
      if (selectedFuncoes.length > 0 && !selectedFuncoes.some((f) => j.funcao.toLowerCase().includes(f.toLowerCase()))) return false;
      // Fixed: filter by empresa_cidade, not empresa_nome
      if (cidade && !j.empresa_cidade.toLowerCase().includes(cidade.toLowerCase())) return false;
      if (dataMinima && new Date(j.data_evento) < dataMinima) return false;
      return true;
    });

    if (sortBy === 'valor') {
      result = [...result].sort((a, b) => b.valor - a.valor);
    }

    return result;
  }, [jobs, search, selectedFuncoes, cidade, dataMinima, sortBy]);

  const handleCandidatar = async (jobId: string) => {
    if (!user || applying) return;
    if (!checkSpamProtection()) return;

    const profileCheck = await checkFreelancerProfile(user.id);
    if (!profileCheck.valid) {
      setProfileAlert(profileCheck.message);
      setDialogOpen(false);
      toast({
        title: 'Complete seu perfil',
        description: 'Adicione cidade e funções no seu perfil para se candidatar.',
        variant: 'destructive',
      });
      return;
    }
    setProfileAlert('');
    setApplying(true);

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
        toast({ title: 'Candidatura enviada! ✅' });
        setDialogOpen(false);
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, applicationStatus: 'aguardando' } : j))
        );
        // Update selectedJob if open
        if (selectedJob?.id === jobId) {
          setSelectedJob(prev => prev ? { ...prev, applicationStatus: 'aguardando' } : null);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setApplying(false);
    }
  };

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

      <div className="space-y-2">
        <p className="text-[13px] font-medium text-muted-foreground">Ordenar por</p>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((opt) => (
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
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-display font-bold">Vagas Disponíveis</h1>

      {profileAlert && (
        <AlertBanner message={profileAlert} linkTo="/freelancer/perfil" linkLabel="Completar perfil" />
      )}

      {/* Tabs for Tipo de Vaga */}
      <div className="flex bg-secondary p-1 rounded-lg w-fit mb-2">
        <button
          onClick={() => setFilterTipo('todas')}
          className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", filterTipo === 'todas' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
        >
          Todas
        </button>
        <button
          onClick={() => setFilterTipo('freelancer')}
          className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", filterTipo === 'freelancer' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
        >
          Trampos
        </button>
        <button
          onClick={() => setFilterTipo('clt')}
          className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", filterTipo === 'clt' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
        >
          CLT
        </button>
      </div>

      {/* Search bar + geo + filter button */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar por função ou empresa..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button
          variant="outline"
          onClick={handleRequestGeo}
          disabled={geoLoading}
          className={cn(
            'shrink-0 gap-2 btn-press',
            geoActive && 'bg-accent-soft border-accent text-[hsl(26,90%,30%)]'
          )}
        >
          {geoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4 text-accent" />
          )}
          <span className="hidden sm:inline">
            {geoLoading ? 'Buscando...' : geoActive ? 'Usando localização' : 'Vagas perto de mim'}
          </span>
          {geoActive && <X className="h-3.5 w-3.5 ml-1" />}
        </Button>
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

      {/* Results info and View Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} vaga{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
        </p>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors duration-150">
            Limpar filtros
          </button>
        )}
        <div className="flex items-center gap-2 border rounded-lg p-1 bg-secondary ml-auto">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            title="Ver em Lista"
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === 'map' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            title="Ver no Mapa"
          >
            <MapIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'map' ? (
        <div className="w-full rounded-xl overflow-hidden border border-border" style={{ height: '65vh', minHeight: '400px' }}>
          <JobsMap 
            jobs={filtered} 
            onMarkerClick={(jobId) => {
              const job = filtered.find(j => j.id === jobId);
              if (job) {
                setSelectedJob(job);
                setDialogOpen(true);
              }
            }}
          />
        </div>
      ) : (
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
                  {job.empresa_cidade && (
                    <p className="text-[12px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />{job.empresa_cidade}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 text-[13px] text-muted-foreground">
                {job.tipo_vaga === 'clt' ? (
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider mb-2 font-semibold">
                    Vaga CLT
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider mb-2 font-semibold bg-accent/10 text-accent hover:bg-accent/20">
                    Trampo (Freelancer)
                  </Badge>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  {job.tipo_vaga === 'clt' ? 'Vaga Efetiva' : new Date(job.data_evento).toLocaleDateString('pt-BR')}
                </div>
                {(job.horario_inicio || job.horario_fim) && job.tipo_vaga === 'freelancer' && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {job.horario_inicio} — {job.horario_fim}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="font-semibold text-lg">
                  {job.tipo_vaga === 'clt' ? (
                    job.valor > 0 ? `R$ ${Number(job.valor).toFixed(2)}/mês` : 'Salário a combinar'
                  ) : (
                    `R$ ${Number(job.valor).toFixed(2)}`
                  )}
                </p>
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
      )}

      {/* Job Details Drawer */}
      <Drawer open={dialogOpen} onOpenChange={setDialogOpen}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader className="p-6 pb-4 text-left">
              <DrawerTitle className="text-xl">{selectedJob?.funcao}</DrawerTitle>
              <p className="text-[13px] text-muted-foreground">{selectedJob?.empresa_nome}</p>
              {selectedJob?.empresa_cidade && (
                <p className="text-[12px] text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />{selectedJob.empresa_cidade}
                </p>
              )}
            </DrawerHeader>
            {selectedJob && (
              <div className="px-6 pb-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedJob.tipo_vaga !== 'clt' && (
                    <div className="bg-secondary/50 p-3 rounded-lg">
                      <span className="text-muted-foreground text-[12px] block mb-1">Data</span>
                      <p className="font-semibold">{new Date(selectedJob.data_evento).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                  {(selectedJob.horario_inicio || selectedJob.horario_fim) && selectedJob.tipo_vaga !== 'clt' && (
                    <div className="bg-secondary/50 p-3 rounded-lg">
                      <span className="text-muted-foreground text-[12px] block mb-1">Horário</span>
                      <p className="font-semibold">{selectedJob.horario_inicio} — {selectedJob.horario_fim}</p>
                    </div>
                  )}
                  <div className="bg-secondary/50 p-3 rounded-lg">
                    <span className="text-muted-foreground text-[12px] block mb-1">
                      {selectedJob.tipo_vaga === 'clt' ? 'Salário' : 'Valor da Diária'}
                    </span>
                    <p className="font-semibold text-accent">
                      {selectedJob.tipo_vaga === 'clt' 
                        ? (selectedJob.valor > 0 ? `R$ ${Number(selectedJob.valor).toFixed(2)}/mês` : 'A combinar')
                        : `R$ ${Number(selectedJob.valor).toFixed(2)}`}
                    </p>
                  </div>
                  <div className="bg-secondary/50 p-3 rounded-lg">
                    <span className="text-muted-foreground text-[12px] block mb-1">Vagas totais</span>
                    <p className="font-semibold">{selectedJob.num_vagas}</p>
                  </div>
                </div>
                {/* Address */}
                {selectedJob.empresa_endereco_completo && (
                  <div className="flex items-start gap-2 p-3 bg-secondary/50 rounded-lg">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[12px] text-muted-foreground mb-0.5">Endereço da Empresa</p>
                      <p className="text-sm font-medium">{selectedJob.empresa_endereco_completo}</p>
                    </div>
                  </div>
                )}

                {/* Benefits */}
                {(selectedJob as any).beneficios && (selectedJob as any).beneficios.length > 0 && (
                  <div>
                    <p className="text-[13px] font-semibold mb-2">Benefícios incluídos</p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedJob as any).beneficios.map((b: string) => (
                        <span key={b} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-[12px] font-medium text-accent border border-accent/20">
                          ✓ {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.descricao && (
                  <div>
                    <p className="text-[13px] font-semibold mb-2">Descrição</p>
                    <div className="text-sm prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: selectedJob.descricao }} />
                  </div>
                )}
                {selectedJob.requisitos && (
                  <div>
                    <p className="text-[13px] font-semibold mb-2">Requisitos</p>
                    <div className="text-sm prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: selectedJob.requisitos }} />
                  </div>
                )}

                <div className="pt-2">
                  {selectedJob.applicationStatus === 'aguardando' && (
                    <Button className="w-full h-[52px] rounded-full" disabled>Candidatura enviada</Button>
                  )}
                  {selectedJob.applicationStatus === 'contratado' && (
                    <Button variant="outline" className="w-full h-[52px] rounded-full" onClick={() => setDialogOpen(false)}>
                      Ver detalhes
                    </Button>
                  )}
                  {selectedJob.applicationStatus === 'recusado' && (
                    <Button className="w-full h-[52px] rounded-full" disabled>Não selecionado</Button>
                  )}
                  {!selectedJob.applicationStatus && (
                    selectedJob.tipo_vaga === 'clt' ? (
                      <Button 
                        className="w-full h-[52px] rounded-full text-md font-semibold btn-press" 
                        onClick={() => handleCandidatar(selectedJob.id)}
                      >
                        Me Candidatar (CLT)
                      </Button>
                    ) : (
                      <SwipeButton 
                        onConfirm={() => handleCandidatar(selectedJob.id)} 
                        resetDelay={1500}
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
