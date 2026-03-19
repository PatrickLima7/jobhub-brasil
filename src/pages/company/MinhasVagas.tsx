import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StarRating } from '@/components/StarRating';
import { UserAvatar } from '@/components/AvatarUpload';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { StaggerContainer, StaggerItem, FloatingIcon } from '@/components/PageTransition';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ChevronDown, ChevronUp, X, MapPin, Briefcase, SearchX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CandidateData {
  id: string;
  status: string;
  freelancer_id: string;
  freelancer_nome: string;
  freelancer_funcoes: string[];
  freelancer_cidade: string;
  freelancer_experiencia: number;
  freelancer_disponibilidade: string[];
  avgRating: number;
  reviewCount: number;
}

interface JobData {
  id: string;
  funcao: string;
  data_evento: string;
  valor: number;
  status: string;
  candidaturas: number;
  created_at: string;
  noCandidateAlert: boolean;
}

export default function MinhasVagas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [candidateSort, setCandidateSort] = useState<'rating' | 'recent'>('rating');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedJobFuncao, setSelectedJobFuncao] = useState('');

  const fetchJobs = async () => {
    if (!user) return;
    const { data } = await supabase.from('jobs').select('*').eq('company_id', user.id).order('created_at', { ascending: false });

    const jobsWithCounts = await Promise.all(
      (data ?? []).map(async (job) => {
        const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('job_id', job.id);
        const candidaturas = count ?? 0;
        const createdAt = new Date(job.created_at);
        const hoursAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        const noCandidateAlert = job.status === 'ativa' && hoursAgo > 48 && candidaturas === 0;
        return { ...job, candidaturas, noCandidateAlert } as JobData;
      })
    );
    setJobs(jobsWithCounts);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, [user]);

  const filteredJobs = filter === 'todas' ? jobs : jobs.filter((j) => j.status === filter);

  const handleEncerrar = async (jobId: string) => {
    await supabase.from('jobs').update({ status: 'encerrada' }).eq('id', jobId);
    toast({ title: 'Vaga encerrada' });
    fetchJobs();
  };

  const fetchCandidates = async (jobId: string) => {
    const { data } = await supabase.from('applications').select('*').eq('job_id', jobId);
    const apps = data ?? [];
    const enriched: CandidateData[] = await Promise.all(
      apps.map(async (app) => {
        const { data: profile } = await supabase
          .from('freelancer_profiles')
          .select('nome, funcoes, cidade, experiencia, disponibilidade')
          .eq('user_id', app.freelancer_id)
          .maybeSingle();

        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('reviewee_id', app.freelancer_id);

        const ratings = (reviews as Array<{ rating: number }>) ?? [];
        const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

        return {
          id: app.id,
          status: app.status,
          freelancer_id: app.freelancer_id,
          freelancer_nome: profile?.nome ?? 'Sem nome',
          freelancer_funcoes: profile?.funcoes ?? [],
          freelancer_cidade: profile?.cidade ?? '',
          freelancer_experiencia: profile?.experiencia ?? 0,
          freelancer_disponibilidade: profile?.disponibilidade ?? [],
          avgRating,
          reviewCount: ratings.length,
        };
      })
    );
    setCandidates(enriched);
  };

  const handleToggleCandidates = async (job: JobData) => {
    if (isMobile) {
      setSelectedJobFuncao(job.funcao);
      await fetchCandidates(job.id);
      setMobileDrawerOpen(true);
    } else {
      if (expandedJobId === job.id) {
        setExpandedJobId(null);
      } else {
        setExpandedJobId(job.id);
        await fetchCandidates(job.id);
      }
    }
  };

  const handleContratar = async (appId: string) => {
    await supabase.from('applications').update({ status: 'contratado' }).eq('id', appId);
    toast({ title: 'Freelancer contratado!' });
    if (expandedJobId) await fetchCandidates(expandedJobId);
    fetchJobs();
  };

  const handleRejeitar = async (appId: string) => {
    await supabase.from('applications').update({ status: 'recusado' }).eq('id', appId);
    toast({ title: 'Candidatura recusada' });
    if (expandedJobId) await fetchCandidates(expandedJobId);
    fetchJobs();
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    if (candidateSort === 'rating') return b.avgRating - a.avgRating;
    return 0;
  });

  const maskName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
    return name;
  };

  const renderCandidateCard = (c: CandidateData, index: number) => (
    <motion.div
      key={c.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: index * 0.04 }}
      className="border rounded-lg p-4 space-y-3"
    >
      <div className="flex items-start gap-3">
        <UserAvatar type="freelancer" userId={c.freelancer_id} name={c.freelancer_nome} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{maskName(c.freelancer_nome)}</p>
            {c.avgRating >= 4.5 && <Badge variant="contratado" className="text-[11px]">Recomendado</Badge>}
            {c.avgRating > 0 && c.avgRating < 3.0 && <Badge variant="recusado" className="text-[11px]">Baixa avaliação</Badge>}
          </div>
          {c.avgRating > 0 && (
            <StarRating rating={c.avgRating} reviewCount={c.reviewCount} size={14} />
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {c.freelancer_funcoes.slice(0, 3).map((f) => (
              <Badge key={f} variant="secondary" className="text-[11px]">{f}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[13px] text-muted-foreground">
            {c.freelancer_cidade && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {c.freelancer_cidade}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {c.freelancer_experiencia} ano{c.freelancer_experiencia !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {c.status === 'aguardando' && (
          <>
            <Button size="sm" className="flex-1 btn-press" onClick={() => handleContratar(c.id)}>
              Contratar
            </Button>
            <button
              onClick={() => handleRejeitar(c.id)}
              className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors duration-150"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
        {c.status === 'contratado' && <Badge variant="contratado">Contratado</Badge>}
        {c.status === 'recusado' && <Badge variant="recusado">Recusado</Badge>}
      </div>
    </motion.div>
  );

  const renderCandidateList = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">Ordenar:</p>
        <div className="flex gap-2">
          <button
            onClick={() => setCandidateSort('rating')}
            className={`text-xs px-2.5 py-1 rounded-pill border transition-colors duration-150 ${
              candidateSort === 'rating' ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-secondary'
            }`}
          >
            Melhor avaliação
          </button>
          <button
            onClick={() => setCandidateSort('recent')}
            className={`text-xs px-2.5 py-1 rounded-pill border transition-colors duration-150 ${
              candidateSort === 'recent' ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-secondary'
            }`}
          >
            Mais recente
          </button>
        </div>
      </div>
      {sortedCandidates.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <FloatingIcon><SearchX className="h-8 w-8 mb-2" /></FloatingIcon>
          <p className="text-sm">Nenhum candidato ainda.</p>
          <p className="text-[13px]">Sua vaga está visível para os freelancers.</p>
        </div>
      ) : (
        sortedCandidates.map((c, i) => renderCandidateCard(c, i))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-display">Minhas Vagas</h1>
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

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
      <StaggerContainer className="md:hidden space-y-3">
        {filteredJobs.map((job) => (
          <StaggerItem key={job.id}>
            <div className="border rounded-lg p-4 space-y-3 card-hover">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{job.funcao}</p>
                  <p className="text-[13px] text-muted-foreground">{new Date(job.data_evento).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge variant={job.status === 'ativa' ? 'ativa' : 'encerrada'}>
                    {job.status === 'ativa' ? 'Ativa' : 'Encerrada'}
                  </Badge>
                  {job.noCandidateAlert && (
                    <Badge variant="ativa" className="text-[11px]">Sem candidatos</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">R$ {Number(job.valor).toFixed(2)}</span>
                <span className="text-muted-foreground">{job.candidaturas} candidatura(s)</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 btn-press" onClick={() => handleToggleCandidates(job)}>
                  Ver Candidatos ({job.candidaturas})
                </Button>
                {job.status === 'ativa' && (
                  <Button size="sm" variant="destructive" className="btn-press" onClick={() => handleEncerrar(job.id)}>
                    Encerrar
                  </Button>
                )}
              </div>
            </div>
          </StaggerItem>
        ))}
        {filteredJobs.length === 0 && (
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <FloatingIcon><Briefcase className="h-8 w-8 mb-2" /></FloatingIcon>
            <p className="text-sm">Nenhuma vaga encontrada.</p>
          </div>
        )}
      </StaggerContainer>

      {/* Desktop table */}
      <div className="hidden md:block space-y-0">
        <div className="border rounded-lg overflow-hidden">
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
                <>
                  <TableRow key={job.id} className="transition-colors duration-150">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {job.funcao}
                        {job.noCandidateAlert && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="ativa" className="text-[11px]">Sem candidatos</Badge>
                            </TooltipTrigger>
                            <TooltipContent>Considere destacar esta vaga</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleCandidates(job)}
                          className="gap-1.5 btn-press"
                        >
                          Ver Candidatos ({job.candidaturas})
                          {expandedJobId === job.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                        {job.status === 'ativa' && (
                          <Button size="sm" variant="destructive" className="btn-press" onClick={() => handleEncerrar(job.id)}>
                            Encerrar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  <AnimatePresence>
                    {expandedJobId === job.id && (
                      <TableRow key={`${job.id}-expanded`}>
                        <TableCell colSpan={6} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div className="bg-secondary p-6 border-t">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-heading">Candidatos para {job.funcao}</h3>
                                <button onClick={() => setExpandedJobId(null)} className="text-muted-foreground hover:text-foreground transition-colors duration-150">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              {renderCandidateList()}
                            </div>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </>
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
      </div>

      {/* Mobile candidate drawer */}
      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left border-b">
            <DrawerTitle>Candidatos para {selectedJobFuncao}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-4 overflow-auto">
            {renderCandidateList()}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
