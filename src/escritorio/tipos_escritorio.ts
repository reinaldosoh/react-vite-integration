export interface FuncaoEscritorio {
  id: string;
  user_id: string;
  nome: string;
  salario_base: number;
  created_at?: string;
  updated_at?: string;
}

export interface Colaborador {
  id: string;
  user_id: string;
  nome: string;
  cpf?: string | null;
  sexo?: string | null;
  estado_civil?: string | null;
  data_nascimento?: string | null;
  nome_mae?: string | null;
  nome_pai?: string | null;
  funcao_id?: string | null;
  email?: string | null;
  telefone?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  estado?: string | null;
  cidade?: string | null;
  cep?: string | null;
  acesso_sistema: boolean;
  observacoes?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  // joined
  funcao_nome?: string;
}

export interface Equipe {
  id: string;
  user_id: string;
  nome: string;
  meta: number;
  ativa: boolean;
  created_at?: string;
  updated_at?: string;
  // joined
  membros?: Colaborador[];
}

export interface EquipeColaborador {
  id: string;
  user_id: string;
  equipe_id: string;
  colaborador_id: string;
  created_at?: string;
}

export const SEXO_OPTIONS = ["Masculino", "Feminino", "Outro"];
export const ESTADO_CIVIL_OPTIONS = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"];
export const UF_OPTIONS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];
