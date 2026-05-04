export type Curso = {
  id: string;
  nome: string;
  carga_horaria: number;
  ano_conclusao: number;
  instituicao: string;
};

export type Referencia = {
  id: string;
  estabelecimento: string;
  tipo: 'restaurante' | 'bar' | 'buffet' | 'evento' | 'outro';
  funcao: string;
  inicio: string; // YYYY-MM
  fim: string; // YYYY-MM
  contato_nome?: string;
  contato_telefone?: string;
  contato_email?: string;
  comentario?: string;
};

export type NivelExperiencia = 'nada' | 'iniciante' | 'intermediario' | 'experiente';

export type DisponibilidadeGrid = Record<string, string[]>;

export type PerfilData = {
  // Section 1
  nome: string;
  nome_social: string;
  genero: string;
  cidade_nascimento: string;
  cidade: string;
  estado: string;
  escolaridade: string;
  cpf: string;
  telefone: string;
  data_nascimento: string;
  bio: string;
  experiencia: number;
  // Section 2
  cursos: Curso[];
  // Section 3
  referencias: Referencia[];
  // Section 4
  instagram: string;
  tiktok: string;
  linkedin: string;
  // Section 5
  funcoes: string[];
  niveis_experiencia: Record<string, NivelExperiencia>;
  uniforme_status: string;
  uniforme_pecas: string[];
  uniforme_apoio: boolean;
  transporte_tipo: string;
  transporte_apoio: boolean;
  sistemas_digitais: string[];
  preferencia_comissao: string;
  tipos_trabalho: string[];
  // Availability (existing)
  disponibilidade: DisponibilidadeGrid;
};

export const FUNCOES = ['Garçom', 'Garçonete', 'Bartender', 'Auxiliar de Cozinha', 'Auxiliar Geral', 'Recepcionista'];
export const ESCOLARIDADES = [
  'Ensino fundamental incompleto',
  'Ensino fundamental completo',
  'Ensino médio incompleto',
  'Ensino médio completo',
  'Ensino superior incompleto',
  'Ensino superior completo',
];
export const GENEROS = ['Homem', 'Mulher', 'Não binário', 'Prefiro não dizer'];
