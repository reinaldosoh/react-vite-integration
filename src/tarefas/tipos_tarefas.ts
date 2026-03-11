export interface Tarefa {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  cliente_id?: string | null;
  intimacao_id?: string | null;
  parte_contraria?: string | null;
  estado?: string | null;
  comarca?: string | null;
  prazo_fatal?: string | null;
  data_vencimento?: string | null;
  hora_vencimento: string;
  equipe_id?: string | null;
  responsavel_id?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
  // joined
  cliente_nome?: string;
  equipe_nome?: string;
  responsavel_nome?: string;
  etiquetas?: Etiqueta[];
}

export interface Etiqueta {
  id: string;
  user_id: string;
  nome: string;
  cor: string;
  created_at?: string;
}

export interface LogTarefa {
  id: string;
  user_id: string;
  tarefa_id: string;
  campo?: string | null;
  valor_anterior?: string | null;
  valor_novo?: string | null;
  nome_usuario?: string | null;
  created_at?: string;
}

export const STATUS_TAREFA = {
  a_fazer: { label: "A Fazer", cor: "bg-blue-50 text-blue-600 border-blue-200", border: "border-l-blue-500" },
  em_andamento: { label: "Em Andamento", cor: "bg-amber-50 text-amber-600 border-amber-200", border: "border-l-amber-500" },
  concluida: { label: "Concluída", cor: "bg-green-50 text-green-600 border-green-200", border: "border-l-green-500" },
  reagendada: { label: "Reagendada", cor: "bg-purple-50 text-purple-600 border-purple-200", border: "border-l-purple-500" },
  cancelada: { label: "Cancelada", cor: "bg-gray-100 text-gray-400 border-gray-200", border: "border-l-gray-400" },
} as const;

export const TIPO_TAREFA = {
  administrativa: "Administrativa",
  processo: "Processo",
} as const;

export type StatusTarefa = keyof typeof STATUS_TAREFA;
