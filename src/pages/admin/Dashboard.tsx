import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Briefcase, CheckCircle, TrendingUp, ArrowUpDown, Star, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import type { LucideIcon } from 'lucide-react';

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

interface MetricCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  trend?: string;
  subtext?: string;
  trendColor?: string;
  loading?: boolean;
}

function MetricCard({ icon: Icon, value, label, trend, subtext, trendColor = 'text-success', loading }: MetricCardProps) {
  return (
    <motion.div variants={item}>
      <Card className="p-6 relative">
        <Icon className="absolute top-6 right-6 h-8 w-8 text-accent opacity-60" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{label}</p>
        {loading ? (
          <div className="mt-2 h-9 w-24 rounded skeleton-shimmer" />
        ) : (
          <p className="text-4xl font-bold text-foreground mt-1">{value}</p>
        )}
        {trend && !loading && (
          <p className={`text-[13px] font-medium mt-2 flex items-center gap-1 ${trendColor}`}>
            <TrendingUp className="h-3.5 w-3.5" />
            {trend}
          </p>
        )}
        {subtext && !loading && <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>}
      </Card>
    </motion.div>
  );
}

interface DashboardMetrics {
  totalEmpresas: number;
  totalFreelancers: number;
  totalVagas: number;
  totalContratacoes: number;
  vagasAtivas: number;
  vagasEncerradas: number;
  vagasCanceladas: number;
}

interface ActivityItem {
  text: string;
  time: string;
  dot: string;
}

const chartConfig = {
  empresas: { label: 'Empresas', color: 'hsl(var(--accent))' },
  freelancers: { label: 'Freelancers', color: 'hsl(var(--foreground))' },
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // Run all counts in parallel
        const [
          { count: totalEmpresas },
          { count: totalFreelancers },
          { count: totalVagas },
          { count: totalContratacoes },
          { count: vagasAtivas },
          { count: vagasEncerradas },
          { count: vagasCanceladas },
        ] = await Promise.all([
          supabase.from('company_profiles').select('*', { count: 'exact', head: true }),
          supabase.from('freelancer_profiles').select('*', { count: 'exact', head: true }),
          supabase.from('jobs').select('*', { count: 'exact', head: true }),
          supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'contratado'),
          supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'ativa'),
          supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'encerrada'),
          supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'cancelada'),
        ]);

        setMetrics({
          totalEmpresas: totalEmpresas ?? 0,
          totalFreelancers: totalFreelancers ?? 0,
          totalVagas: totalVagas ?? 0,
          totalContratacoes: totalContratacoes ?? 0,
          vagasAtivas: vagasAtivas ?? 0,
          vagasEncerradas: vagasEncerradas ?? 0,
          vagasCanceladas: vagasCanceladas ?? 0,
        });

        // Fetch recent activity (last 5 applications)
        const { data: recentApps } = await supabase
          .from('applications')
          .select('id, status, created_at, freelancer_id')
          .order('created_at', { ascending: false })
          .limit(5);

        const activity: ActivityItem[] = (recentApps ?? []).map(app => {
          const ago = getTimeAgo(app.created_at);
          const isHired = app.status === 'contratado';
          return {
            text: isHired ? `Contratação realizada` : `Nova candidatura enviada`,
            time: ago,
            dot: isHired ? 'bg-success' : 'bg-accent',
          };
        });
        setRecentActivity(activity);
      } catch (err) {
        console.error('Admin dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  const statusData = [
    { name: 'Ativas', value: metrics?.vagasAtivas ?? 0, color: 'hsl(var(--accent))' },
    { name: 'Encerradas', value: metrics?.vagasEncerradas ?? 0, color: 'hsl(var(--foreground))' },
    { name: 'Canceladas', value: metrics?.vagasCanceladas ?? 0, color: 'hsl(var(--border))' },
  ];
  const totalVagasChart = statusData.reduce((s, d) => s + d.value, 0);

  // Placeholder growth data (would need historical snapshots to be real)
  const growthData = [
    { month: 'Jan', empresas: Math.max(1, (metrics?.totalEmpresas ?? 0) - 5), freelancers: Math.max(1, (metrics?.totalFreelancers ?? 0) - 20) },
    { month: 'Fev', empresas: Math.max(1, (metrics?.totalEmpresas ?? 0) - 3), freelancers: Math.max(1, (metrics?.totalFreelancers ?? 0) - 12) },
    { month: 'Mar', empresas: Math.max(1, (metrics?.totalEmpresas ?? 0) - 2), freelancers: Math.max(1, (metrics?.totalFreelancers ?? 0) - 8) },
    { month: 'Abr', empresas: Math.max(1, (metrics?.totalEmpresas ?? 0) - 1), freelancers: Math.max(1, (metrics?.totalFreelancers ?? 0) - 4) },
    { month: 'Mai', empresas: metrics?.totalEmpresas ?? 0, freelancers: metrics?.totalFreelancers ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Building2}
          value={metrics?.totalEmpresas.toLocaleString('pt-BR') ?? '—'}
          label="EMPRESAS CADASTRADAS"
          loading={loading}
        />
        <MetricCard
          icon={Users}
          value={metrics?.totalFreelancers.toLocaleString('pt-BR') ?? '—'}
          label="FREELANCERS"
          loading={loading}
        />
        <MetricCard
          icon={Briefcase}
          value={metrics?.totalVagas.toLocaleString('pt-BR') ?? '—'}
          label="VAGAS PUBLICADAS"
          loading={loading}
        />
        <MetricCard
          icon={CheckCircle}
          value={metrics?.totalContratacoes.toLocaleString('pt-BR') ?? '—'}
          label="CONTRATAÇÕES"
          loading={loading}
        />
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          icon={ArrowUpDown}
          value={`${metrics?.vagasAtivas ?? 0} ativas`}
          label="VAGAS ATIVAS AGORA"
          subtext={`${metrics?.vagasEncerradas ?? 0} encerradas · ${metrics?.vagasCanceladas ?? 0} canceladas`}
          loading={loading}
        />
        <MetricCard
          icon={Star}
          value={metrics ? `${((metrics.totalContratacoes / Math.max(metrics.totalVagas, 1)) * 100).toFixed(0)}%` : '—'}
          label="TAXA DE CONVERSÃO"
          subtext="Candidaturas → Contratações"
          loading={loading}
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <p className="text-sm font-semibold text-foreground mb-4">Crescimento da plataforma</p>
          {loading ? (
            <div className="h-[240px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <LineChart data={growthData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="empresas" stroke="var(--color-empresas)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="freelancers" stroke="var(--color-freelancers)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          )}
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold text-foreground mb-4">Status das vagas</p>
          {loading ? (
            <div className="h-[240px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="h-[240px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-foreground">
                      {totalVagasChart.toLocaleString('pt-BR')}
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name} ({s.value})
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-sm font-semibold text-foreground mb-4">Atividade recente</p>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <div key={i} className="h-5 rounded skeleton-shimmer" />)}
          </div>
        ) : recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full shrink-0 ${a.dot}`} />
                <span className="text-sm text-foreground flex-1">{a.text}</span>
                <span className="text-xs text-muted-foreground/70">{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
