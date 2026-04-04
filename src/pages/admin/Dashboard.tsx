import { motion } from 'framer-motion';
import { Building2, Users, Briefcase, CheckCircle, TrendingUp, ArrowUpDown, Wallet, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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
}

function MetricCard({ icon: Icon, value, label, trend, subtext, trendColor = 'text-success' }: MetricCardProps) {
  return (
    <motion.div variants={item}>
      <Card className="p-6 relative">
        <Icon className="absolute top-6 right-6 h-8 w-8 text-accent opacity-60" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{label}</p>
        <p className="text-4xl font-bold text-foreground mt-1">{value}</p>
        {trend && (
          <p className={`text-[13px] font-medium mt-2 flex items-center gap-1 ${trendColor}`}>
            <TrendingUp className="h-3.5 w-3.5" />
            {trend}
          </p>
        )}
        {subtext && <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>}
      </Card>
    </motion.div>
  );
}

const growthData = [
  { month: 'Out', empresas: 180, freelancers: 1200 },
  { month: 'Nov', empresas: 198, freelancers: 1380 },
  { month: 'Dez', empresas: 210, freelancers: 1520 },
  { month: 'Jan', empresas: 224, freelancers: 1640 },
  { month: 'Fev', empresas: 236, freelancers: 1758 },
  { month: 'Mar', empresas: 248, freelancers: 1847 },
];

const statusData = [
  { name: 'Ativas', value: 420, color: 'hsl(var(--accent))' },
  { name: 'Encerradas', value: 2500, color: 'hsl(var(--foreground))' },
  { name: 'Canceladas', value: 284, color: 'hsl(var(--border))' },
];
const totalVagas = statusData.reduce((s, d) => s + d.value, 0);

const chartConfig = {
  empresas: { label: 'Empresas', color: 'hsl(var(--accent))' },
  freelancers: { label: 'Freelancers', color: 'hsl(var(--foreground))' },
};

const activityFeed = [
  { text: 'Nova empresa cadastrada — Bar do Zé', time: 'agora', dot: 'bg-accent' },
  { text: 'Contratação realizada — Garçom · R$ 180', time: '2min', dot: 'bg-accent' },
  { text: 'Vaga publicada — Bartender · BH', time: '5min', dot: 'bg-muted-foreground/40' },
  { text: 'Novo freelancer — Lucas M.', time: '12min', dot: 'bg-accent' },
  { text: 'Cancelamento — R$ 220 → saldo', time: '18min', dot: 'bg-destructive' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Building2} value="248" label="EMPRESAS ATIVAS" trend="+12 esse mês" />
        <MetricCard icon={Users} value="1.847" label="FREELANCERS" trend="+89 esse mês" />
        <MetricCard icon={Briefcase} value="3.204" label="VAGAS PUBLICADAS" trend="+143 esse mês" />
        <MetricCard icon={CheckCircle} value="2.891" label="CONTRATAÇÕES" trend="+98 esse mês" />
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard icon={ArrowUpDown} value="R$ 284.720,00" label="VOLUME TOTAL MOVIMENTADO" trend="+R$ 18.450 esse mês" />
        <MetricCard icon={TrendingUp} value="R$ 62.638,40" label="TAXA ARRECADADA (22%)" trend="+R$ 4.059 esse mês" trendColor="text-accent" />
        <MetricCard icon={Wallet} value="R$ 4.280,00" label="SALDOS RETIDOS (CANCELAMENTOS)" subtext="14 cancelamentos" />
        <MetricCard icon={Star} value="67" label="PLANOS PRO + REDE ATIVOS" subtext="52 Pro · 15 Rede" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <p className="text-sm font-semibold text-foreground mb-4">Crescimento da plataforma</p>
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <LineChart data={growthData}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="empresas" stroke="var(--color-empresas)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="freelancers" stroke="var(--color-freelancers)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold text-foreground mb-4">Status das vagas</p>
          <div className="h-[240px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-foreground">
                  {totalVagas.toLocaleString('pt-BR')}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-sm font-semibold text-foreground mb-4">Atividade recente</p>
        <div className="space-y-3">
          {activityFeed.map((a, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full shrink-0 ${a.dot}`} />
              <span className="text-sm text-foreground flex-1">{a.text}</span>
              <span className="text-xs text-muted-foreground/70">{a.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
