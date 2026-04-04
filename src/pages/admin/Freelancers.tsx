import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Eye, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const FUNCOES = ['Garçom', 'Garçonete', 'Bartender', 'Auxiliar de Cozinha', 'Auxiliar Geral', 'Recepcionista'];

const mockFreelancers = [
  { id: '1', nome: 'Lucas M.', cidade: 'São Paulo, SP', funcoes: ['Garçom', 'Bartender'], rating: 4.8, reviews: 24, contratacoes: 32, ganhos: 14200, cadastro: '2025-07-15', status: 'Ativo' },
  { id: '2', nome: 'Ana P.', cidade: 'Rio de Janeiro, RJ', funcoes: ['Garçonete'], rating: 4.5, reviews: 18, contratacoes: 22, ganhos: 9800, cadastro: '2025-09-03', status: 'Ativo' },
  { id: '3', nome: 'Carlos R.', cidade: 'Belo Horizonte, MG', funcoes: ['Auxiliar de Cozinha', 'Auxiliar Geral'], rating: 3.2, reviews: 8, contratacoes: 10, ganhos: 4200, cadastro: '2025-11-20', status: 'Inativo' },
  { id: '4', nome: 'Mariana S.', cidade: 'Curitiba, PR', funcoes: ['Recepcionista', 'Garçonete'], rating: 4.9, reviews: 31, contratacoes: 40, ganhos: 18600, cadastro: '2025-05-10', status: 'Ativo' },
  { id: '5', nome: 'Pedro L.', cidade: 'Porto Alegre, RS', funcoes: ['Bartender'], rating: 2.8, reviews: 5, contratacoes: 6, ganhos: 2400, cadastro: '2026-02-01', status: 'Ativo' },
];

function StarDisplay({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
      <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
}

export default function AdminFreelancers() {
  const [search, setSearch] = useState('');
  const [funcaoFilter, setFuncaoFilter] = useState('todas');
  const [ratingFilter, setRatingFilter] = useState('todas');
  const isMobile = useIsMobile();

  const filtered = mockFreelancers.filter((f) => {
    if (search && !f.nome.toLowerCase().includes(search.toLowerCase())) return false;
    if (funcaoFilter !== 'todas' && !f.funcoes.some(fn => fn.toLowerCase() === funcaoFilter.toLowerCase())) return false;
    if (ratingFilter === '4+' && f.rating < 4) return false;
    if (ratingFilter === '3+' && f.rating < 3) return false;
    if (ratingFilter === 'abaixo' && f.rating >= 3) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Freelancers</h1>
        <p className="text-sm text-muted-foreground">{mockFreelancers.length} freelancers cadastrados</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar freelancer..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={funcaoFilter} onValueChange={setFuncaoFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Função" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {FUNCOES.map(f => <SelectItem key={f} value={f.toLowerCase()}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Avaliação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="4+">4+ estrelas</SelectItem>
            <SelectItem value="3+">3+ estrelas</SelectItem>
            <SelectItem value="abaixo">Abaixo de 3</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" className="border border-border gap-2" onClick={() => toast.success('Relatório gerado! Download iniciando...')}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {isMobile ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {filtered.map((f) => (
            <Card key={f.id} className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-foreground flex items-center justify-center text-xs font-bold text-background">{f.nome[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.nome}</p>
                  <p className="text-xs text-muted-foreground">{f.cidade}</p>
                </div>
                <StarDisplay rating={f.rating} count={f.reviews} />
              </div>
              <div className="flex flex-wrap gap-1">
                {f.funcoes.slice(0, 2).map(fn => <Badge key={fn} variant="secondary" className="text-xs">{fn}</Badge>)}
                {f.funcoes.length > 2 && <Badge variant="secondary" className="text-xs">+{f.funcoes.length - 2}</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>{f.contratacoes} contratações</span>
                <span>R$ {f.ganhos.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={f.status === 'Ativo' ? 'ativa' : 'encerrada'}>{f.status}</Badge>
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
                {['Freelancer', 'Funções', 'Avaliação', 'Contratações', 'Ganhos', 'Cadastro', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-border hover:bg-surface transition-colors h-[52px]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center text-xs font-bold text-background">{f.nome[0]}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{f.nome}</p>
                        <p className="text-xs text-muted-foreground">{f.cidade}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {f.funcoes.slice(0, 2).map(fn => <Badge key={fn} variant="secondary" className="text-xs">{fn}</Badge>)}
                      {f.funcoes.length > 2 && <Badge variant="secondary" className="text-xs">+{f.funcoes.length - 2}</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StarDisplay rating={f.rating} count={f.reviews} /></td>
                  <td className="px-4 py-3 text-sm">{f.contratacoes}</td>
                  <td className="px-4 py-3 text-sm">R$ {f.ganhos.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 text-sm">{new Date(f.cadastro).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3"><Badge variant={f.status === 'Ativo' ? 'ativa' : 'encerrada'}>{f.status}</Badge></td>
                  <td className="px-4 py-3"><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground border-t border-border">
            <span>Mostrando 1-{filtered.length} de 1.847</span>
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
