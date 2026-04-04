import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const mockEmpresas = [
  { id: '1', nome: 'Bar do Zé', cidade: 'São Paulo, SP', plano: 'Pro', vagas: 28, contratacoes: 45, volume: 12400, cadastro: '2025-08-12', status: 'Ativa' },
  { id: '2', nome: 'Restaurante Sabor & Arte', cidade: 'Rio de Janeiro, RJ', plano: 'Free', vagas: 8, contratacoes: 12, volume: 3200, cadastro: '2025-10-03', status: 'Ativa' },
  { id: '3', nome: 'Boteco Carioca', cidade: 'Belo Horizonte, MG', plano: 'Rede', vagas: 52, contratacoes: 88, volume: 34800, cadastro: '2025-06-21', status: 'Ativa' },
  { id: '4', nome: 'Espetaria Gaúcha', cidade: 'Porto Alegre, RS', plano: 'Pro', vagas: 15, contratacoes: 22, volume: 8600, cadastro: '2025-11-14', status: 'Inativa' },
  { id: '5', nome: 'Cantina Bella Napoli', cidade: 'Curitiba, PR', plano: 'Free', vagas: 4, contratacoes: 6, volume: 1800, cadastro: '2026-01-08', status: 'Ativa' },
];

const planBadge = (plano: string) => {
  if (plano === 'Pro') return <Badge className="bg-accent-soft text-[#92400E] border-0">Pro</Badge>;
  if (plano === 'Rede') return <Badge className="bg-foreground text-background border-0">Rede</Badge>;
  return <Badge variant="secondary">Free</Badge>;
};

const statusBadge = (status: string) => {
  if (status === 'Ativa') return <Badge variant="ativa">{status}</Badge>;
  return <Badge variant="encerrada">{status}</Badge>;
};

const initials = (nome: string) => nome.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function AdminEmpresas() {
  const [search, setSearch] = useState('');
  const [planoFilter, setPlanoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todas');
  const isMobile = useIsMobile();

  const filtered = mockEmpresas.filter((e) => {
    if (search && !e.nome.toLowerCase().includes(search.toLowerCase())) return false;
    if (planoFilter !== 'todos' && e.plano.toLowerCase() !== planoFilter) return false;
    if (statusFilter !== 'todas' && e.status.toLowerCase() !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Empresas</h1>
        <p className="text-sm text-muted-foreground">{mockEmpresas.length} empresas cadastradas</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar empresa..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={planoFilter} onValueChange={setPlanoFilter}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Plano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="rede">Rede</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="ativa">Ativas</SelectItem>
            <SelectItem value="inativa">Inativas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" className="border border-border gap-2" onClick={() => toast.success('Relatório gerado! Download iniciando...')}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {isMobile ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {filtered.map((e) => (
            <Card key={e.id} className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">{initials(e.nome)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{e.nome}</p>
                  <p className="text-xs text-muted-foreground">{e.cidade}</p>
                </div>
                {planBadge(e.plano)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>{e.vagas} vagas</span>
                <span>{e.contratacoes} contratações</span>
                <span>R$ {e.volume.toLocaleString('pt-BR')}</span>
                <span>{new Date(e.cadastro).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center justify-between">
                {statusBadge(e.status)}
                <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </motion.div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-foreground">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">Empresa</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">Plano</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">Vagas</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">Contratações</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">Volume</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">Cadastro</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border hover:bg-surface transition-colors h-[52px]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">{initials(e.nome)}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{e.nome}</p>
                        <p className="text-xs text-muted-foreground">{e.cidade}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{planBadge(e.plano)}</td>
                  <td className="px-4 py-3 text-sm">{e.vagas}</td>
                  <td className="px-4 py-3 text-sm">{e.contratacoes}</td>
                  <td className="px-4 py-3 text-sm">R$ {e.volume.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 text-sm">{new Date(e.cadastro).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">{statusBadge(e.status)}</td>
                  <td className="px-4 py-3"><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground border-t border-border">
            <span>Mostrando 1-{filtered.length} de 248</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled>Anterior</Button>
              <Button variant="ghost" size="sm">Próximo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
