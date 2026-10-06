import { motion } from 'framer-motion';
import { Building2, Users, DollarSign, Briefcase, TrendingUp, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

interface ReportDef {
  title: string;
  description: string;
  icon: LucideIcon;
}

const reports: ReportDef[] = [
  { title: 'Relatório de Empresas', description: 'Lista completa de empresas, planos e volume', icon: Building2 },
  { title: 'Relatório de Freelancers', description: 'Cadastros, avaliações e contratações', icon: Users },
  { title: 'Relatório Financeiro', description: 'Volume movimentado, taxas e repasses', icon: DollarSign },
  { title: 'Relatório de Vagas', description: 'Vagas publicadas, candidaturas e conclusões', icon: Briefcase },
  { title: 'Relatório de Crescimento', description: 'Evolução mensal de cadastros e contratações', icon: TrendingUp },
  { title: 'Relatório de Cancelamentos', description: 'Vagas canceladas e saldos retidos', icon: XCircle },
];

function ReportCard({ report }: { report: ReportDef }) {
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');

  const handleExport = (format: string) => {
    toast.success('Relatório gerado! Download iniciando...', {
      className: 'bg-[#D1FAE5] text-[#065F46]',
    });
  };

  return (
    <motion.div variants={item}>
      <Card className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <report.icon className="h-8 w-8 text-accent shrink-0" />
          <div>
            <p className="font-semibold text-foreground">{report.title}</p>
            <p className="text-sm text-muted-foreground">{report.description}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">De</Label>
            <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Até</Label>
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => handleExport('pdf')}>Exportar PDF</Button>
          <Button variant="ghost" className="flex-1 border border-border" onClick={() => handleExport('csv')}>Exportar CSV</Button>
        </div>
      </Card>
    </motion.div>
  );
}

export default function AdminRelatorios() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Exporte dados da plataforma</p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <ReportCard key={r.title} report={r} />
        ))}
      </motion.div>
    </div>
  );
}
