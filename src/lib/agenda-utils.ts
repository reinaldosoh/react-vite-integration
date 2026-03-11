// Tipos e constantes para Agenda e Clientes

export interface Cliente {
  id: string;
  user_id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  documento?: string | null;
  observacoes?: string | null;
  created_at?: string | null;
}

export interface Compromisso {
  id: string;
  user_id: string;
  titulo: string;
  descricao?: string | null;
  categoria: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  local?: string | null;
  link_reuniao?: string | null;
  lembrete_ativo: boolean;
  lembretes: string[];
  cliente_id?: string | null;
  intimacao_id?: string | null;
  recorrente: boolean;
  tipo_recorrencia?: string | null;
  data_fim_recorrencia?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  // joined
  cliente?: Cliente | null;
}

export const CATEGORIAS = [
  { value: "reuniao", label: "Reunião", color: "bg-blue-500", bg: "bg-blue-50 border-blue-200 text-blue-800", dot: "bg-blue-400" },
  { value: "audiencia", label: "Audiência", color: "bg-amber-500", bg: "bg-amber-50 border-amber-200 text-amber-800", dot: "bg-amber-400" },
  { value: "prazo", label: "Prazo", color: "bg-red-500", bg: "bg-red-50 border-red-200 text-red-800", dot: "bg-red-400" },
  { value: "tarefa", label: "Tarefa", color: "bg-emerald-500", bg: "bg-emerald-50 border-emerald-200 text-emerald-800", dot: "bg-emerald-400" },
  { value: "outro", label: "Outro", color: "bg-purple-500", bg: "bg-purple-50 border-purple-200 text-purple-800", dot: "bg-purple-400" },
] as const;

export const LEMBRETES_OPTIONS = [
  { value: "15_min", label: "15 minutos antes" },
  { value: "30_min", label: "30 minutos antes" },
  { value: "1_hora", label: "1 hora antes" },
  { value: "1_dia", label: "1 dia antes" },
] as const;

export const RECORRENCIA_OPTIONS = [
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
] as const;

export function getCategoria(value: string) {
  return CATEGORIAS.find((c) => c.value === value) || CATEGORIAS[4];
}

export function getWeekDays(date: Date, showWeekend: boolean): Date[] {
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day === 0 ? 7 : day) - 1));

  const days: Date[] = [];
  const count = showWeekend ? 7 : 5;
  for (let i = 0; i < count; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

export function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function formatDateBR(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function formatWeekday(d: Date): string {
  return d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

export function isToday(d: Date): boolean {
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

export function getMonthDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, month, i));
  return cells;
}

export const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6h to 21h
