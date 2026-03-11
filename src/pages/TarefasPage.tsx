import { useMemo, useState } from "react";
import { useTarefas, useEtiquetas, useLogsTarefa } from "@/tarefas/hooks";
import { useClientes } from "@/hooks/useClientes";
import { useEquipes, useColaboradores } from "@/escritorio/hooks";
import { STATUS_TAREFA, TIPO_TAREFA, type Tarefa, type StatusTarefa, type Etiqueta } from "@/tarefas/tipos_tarefas";
import { UF_OPTIONS } from "@/escritorio/tipos_escritorio";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  Filter,
  Hourglass,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Repeat2,
  RotateCcw,
  Search,
  Settings2,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FiltroStatus = "ativas" | "todas" | "aguardando" | StatusTarefa;
type VisualStatus = StatusTarefa | "vencida" | "aguardando";
type CardTone = "warning" | "info" | "danger" | "success" | "purple";

const CARD_BAR_CLASS: Record<CardTone, string> = {
  warning: "bg-[hsl(var(--task-accent-warning))]",
  info: "bg-[hsl(var(--task-accent-info))]",
  danger: "bg-[hsl(var(--task-accent-danger))]",
  success: "bg-[hsl(var(--task-accent-success))]",
  purple: "bg-[hsl(var(--task-accent-purple))]",
};

const STATUS_VISUAL: Record<VisualStatus, { rowBorder: string; pill: string }> = {
  a_fazer: {
    rowBorder: "border-l-[hsl(var(--task-accent-warning))]",
    pill: "border-[hsl(var(--task-soft-warning-border))] bg-[hsl(var(--task-soft-warning))] text-[hsl(var(--task-accent-warning))]",
  },
  em_andamento: {
    rowBorder: "border-l-[hsl(var(--task-accent-info))]",
    pill: "border-[hsl(var(--task-soft-info-border))] bg-[hsl(var(--task-soft-info))] text-[hsl(var(--task-accent-info))]",
  },
  concluida: {
    rowBorder: "border-l-[hsl(var(--task-accent-success))]",
    pill: "border-[hsl(var(--task-soft-success-border))] bg-[hsl(var(--task-soft-success))] text-[hsl(var(--task-accent-success))]",
  },
  reagendada: {
    rowBorder: "border-l-[hsl(var(--task-accent-info))]",
    pill: "border-[hsl(var(--task-soft-info-border))] bg-[hsl(var(--task-soft-info))] text-[hsl(var(--task-accent-info))]",
  },
  cancelada: {
    rowBorder: "border-l-[hsl(var(--task-accent-danger))]",
    pill: "border-[hsl(var(--task-soft-danger-border))] bg-[hsl(var(--task-soft-danger))] text-[hsl(var(--task-accent-danger))]",
  },
  vencida: {
    rowBorder: "border-l-[hsl(var(--task-accent-danger))]",
    pill: "border-[hsl(var(--task-soft-danger-border))] bg-[hsl(var(--task-soft-danger))] text-[hsl(var(--task-accent-danger))]",
  },
  aguardando: {
    rowBorder: "border-l-[hsl(var(--task-accent-purple))]",
    pill: "border-[hsl(var(--task-soft-purple-border))] bg-[hsl(var(--task-soft-purple))] text-[hsl(var(--task-accent-purple))]",
  },
};

const STATUS_LABELS: Record<VisualStatus, string> = {
  a_fazer: "A Fazer",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  reagendada: "Reagendada",
  cancelada: "Cancelada",
  vencida: "Vencida",
  aguardando: "Aguardando",
};

const STATUS_FILTER_OPTIONS: Array<{ value: FiltroStatus; label: string }> = [
  { value: "ativas", label: "Ativas" },
  { value: "todas", label: "Todas" },
  { value: "a_fazer", label: "A Fazer" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "reagendada", label: "Reagendada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "aguardando", label: "Aguardando" },
];

function formatDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(`${d}T00:00:00`);
  return dt.toLocaleDateString("pt-BR");
}

function isVencida(t: Tarefa) {
  if (!t.data_vencimento || ["concluida", "cancelada"].includes(t.status)) return false;
  return new Date(`${t.data_vencimento}T${t.hora_vencimento || "23:59"}`) < new Date();
}

function isHoje(t: Tarefa) {
  if (!t.data_vencimento) return false;
  return t.data_vencimento === new Date().toISOString().slice(0, 10);
}

function getVisualStatus(t: Tarefa): VisualStatus {
  if (isVencida(t)) return "vencida";
  if (t.status === "aguardando") return "aguardando";
  if (t.status in STATUS_VISUAL) return t.status as VisualStatus;
  return "a_fazer";
}

export default function TarefasPage() {
  const { tarefas, isLoading, salvar, excluir, alterarStatus } = useTarefas();
  const { etiquetas, salvar: salvarEtiqueta, excluir: excluirEtiqueta } = useEtiquetas();
  const { clientes } = useClientes();
  const { equipes } = useEquipes();
  const { colaboradores } = useColaboradores();

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("ativas");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroEtiqueta, setFiltroEtiqueta] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [modalCriar, setModalCriar] = useState(false);
  const [modalEditar, setModalEditar] = useState<Tarefa | null>(null);
  const [modalEtiquetas, setModalEtiquetas] = useState(false);
  const [pag, setPag] = useState(0);
  const [porPag, setPorPag] = useState(25);

  const resumo = useMemo(() => {
    const ativas = tarefas.filter((t) => !["concluida", "cancelada"].includes(t.status));
    return {
      aVencer: ativas.filter((t) => t.data_vencimento && !isVencida(t) && !isHoje(t)).length,
      prazoHoje: ativas.filter((t) => isHoje(t)).length,
      vencidas: ativas.filter((t) => isVencida(t)).length,
      concluidas: tarefas.filter((t) => t.status === "concluida").length,
      canceladas: tarefas.filter((t) => t.status === "cancelada").length,
      reagendadas: tarefas.filter((t) => t.status === "reagendada").length,
      aguardando: tarefas.filter((t) => t.status === "aguardando").length,
    };
  }, [tarefas]);

  const filtered = useMemo(() => {
    let f = [...tarefas];
    if (filtroStatus === "ativas") {
      f = f.filter((t) => !["concluida", "cancelada"].includes(t.status));
    } else if (filtroStatus !== "todas") {
      f = f.filter((t) => t.status === filtroStatus);
    }
    if (filtroTipo) f = f.filter((t) => t.tipo === filtroTipo);
    if (filtroEtiqueta) f = f.filter((t) => t.etiquetas?.some((e) => e.id === filtroEtiqueta));
    if (busca) {
      const q = busca.toLowerCase();
      f = f.filter((t) =>
        [t.titulo, t.descricao, t.cliente_nome, t.parte_contraria, t.comarca]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return f;
  }, [tarefas, filtroStatus, filtroTipo, filtroEtiqueta, busca]);

  const paginated = filtered.slice(pag * porPag, (pag + 1) * porPag);
  const totalPages = Math.ceil(filtered.length / porPag);
  const startItem = filtered.length === 0 ? 0 : pag * porPag + 1;
  const endItem = Math.min((pag + 1) * porPag, filtered.length);

  const cards: Array<{ label: string; count: number; tone: CardTone; icon: (props: { className?: string }) => JSX.Element }> = [
    { label: "A Vencer", count: resumo.aVencer, tone: "warning", icon: Clock3 },
    { label: "Prazo do dia", count: resumo.prazoHoje, tone: "info", icon: CalendarClock },
    { label: "Vencidas", count: resumo.vencidas, tone: "danger", icon: AlertTriangle },
    { label: "Concluídas", count: resumo.concluidas, tone: "success", icon: ListChecks },
    { label: "Canceladas", count: resumo.canceladas, tone: "danger", icon: Ban },
    { label: "Reagendadas", count: resumo.reagendadas, tone: "info", icon: Repeat2 },
    { label: "Aguardando", count: resumo.aguardando, tone: "purple", icon: Hourglass },
  ];

  return (
    <div className="fade-in space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[2rem] font-semibold leading-tight text-foreground">Lista de Tarefas</h1>
          <p className="mt-1 text-[1.35rem] text-muted-foreground">Gerencie suas tarefas processuais e administrativas</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="hidden md:inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-base text-foreground transition hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
        <button className="rounded-lg bg-background px-4 py-1.5 text-base font-medium text-foreground shadow-sm">Minhas</button>
        <button className="rounded-lg px-4 py-1.5 text-base text-muted-foreground">Gerais</button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-start justify-between px-4 pb-3 pt-4">
                <p className="text-base text-muted-foreground">{card.label}</p>
                {index === 0 ? (
                  <button className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    7 dias
                    <ChevronDown className="h-3 w-3" />
                  </button>
                ) : (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                )}
              </div>
              <div className="px-4 pb-3 text-[2rem] font-semibold leading-none text-foreground">{card.count}</div>
              <div className={cn("h-1 w-full", CARD_BAR_CLASS[card.tone])} />
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full min-w-[240px] flex-1 xl:max-w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar tarefas..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPag(0);
                }}
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-base text-foreground outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={filtroStatus}
                onChange={(e) => {
                  setFiltroStatus(e.target.value as FiltroStatus);
                  setPag(0);
                }}
                className="h-11 min-w-[140px] rounded-xl border border-border bg-background pl-9 pr-8 text-base text-foreground outline-none"
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value);
                setPag(0);
              }}
              className="h-11 min-w-[170px] rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(TIPO_TAREFA).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>

            <button
              onClick={() => setModalEtiquetas(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-base text-foreground transition hover:bg-muted"
            >
              <Tag className="h-4 w-4" />
              Etiquetas
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-base text-foreground transition hover:bg-muted">
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <button
              onClick={() => setModalEtiquetas(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-base text-foreground transition hover:bg-muted"
            >
              <Settings2 className="h-4 w-4" />
              Gerenciar
            </button>
            <button
              onClick={() => setModalCriar(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[hsl(var(--task-brand))] px-5 text-base font-semibold text-[hsl(var(--task-brand-foreground))] transition hover:opacity-95"
            >
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-border bg-card text-center">
          <ClipboardList className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-2xl font-semibold text-muted-foreground">Nenhuma tarefa encontrada</p>
          <p className="mt-1 text-base text-muted-foreground">Tente ajustar os filtros ou crie uma nova tarefa</p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-2">
            {paginated.map((t) => {
              const visualStatus = getVisualStatus(t);
              const st = STATUS_VISUAL[visualStatus];
              return (
                <div
                  key={t.id}
                  onClick={() => setModalEditar(t)}
                  className={cn("cursor-pointer rounded-xl border border-border bg-card p-4 border-l-[3px]", st.rowBorder)}
                >
                  <p className="text-base font-semibold text-foreground">{t.titulo}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", st.pill)}>
                      {STATUS_LABELS[visualStatus]}
                    </span>
                    {(t.etiquetas || []).map((e) => (
                      <span
                        key={e.id}
                        className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: `${e.cor}1f`, color: e.cor }}
                      >
                        {e.nome}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-10 px-3 py-3">
                      <div className="h-4 w-4 rounded-full border border-[hsl(var(--task-brand))]" />
                    </th>
                    <th className="w-10 px-3 py-3 text-left text-base font-medium text-muted-foreground">#</th>
                    <th className="px-3 py-3 text-left text-base font-medium text-muted-foreground">Título</th>
                    <th className="px-3 py-3 text-left text-base font-medium text-muted-foreground">Tipo</th>
                    <th className="px-3 py-3 text-left text-base font-medium text-muted-foreground">Processo</th>
                    <th className="px-3 py-3 text-left text-base font-medium text-muted-foreground">P. Contrária</th>
                    <th className="px-3 py-3 text-left text-base font-medium text-muted-foreground">Cliente</th>
                    <th className="px-3 py-3 text-left text-base font-medium text-muted-foreground">Comarca</th>
                    <th className="px-3 py-3 text-left text-base font-medium text-muted-foreground">Vencimento</th>
                    <th className="px-3 py-3 text-left text-base font-medium text-muted-foreground">Fatal</th>
                    <th className="px-3 py-3 text-left text-base font-medium text-muted-foreground">Equipe</th>
                    <th className="px-3 py-3 text-left text-base font-medium text-muted-foreground">Responsável</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((t, idx) => {
                    const visualStatus = getVisualStatus(t);
                    const st = STATUS_VISUAL[visualStatus];
                    const rowNum = pag * porPag + idx + 1;
                    const fatalAtrasado = !!t.prazo_fatal && new Date(`${t.prazo_fatal}T23:59:59`) < new Date();

                    return (
                      <tr
                        key={t.id}
                        className="group cursor-pointer border-b border-border transition hover:bg-muted/30 last:border-0"
                        onClick={() => setModalEditar(t)}
                      >
                        <td className={cn("border-l-[3px] px-3 py-3", st.rowBorder)} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              alterarStatus.mutate({
                                id: t.id,
                                status: t.status === "concluida" ? "a_fazer" : "concluida",
                              })
                            }
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border transition",
                              t.status === "concluida"
                                ? "border-[hsl(var(--task-accent-success))] bg-[hsl(var(--task-accent-success))] text-[hsl(var(--task-brand-foreground))]"
                                : "border-[hsl(var(--task-brand))] hover:opacity-70",
                            )}
                          >
                            {t.status === "concluida" && <Check className="h-3 w-3" />}
                          </button>
                        </td>

                        <td className="px-3 py-3 text-base text-muted-foreground">{rowNum}</td>

                        <td className="min-w-[210px] px-3 py-3">
                          <p className="text-[1.5rem] font-semibold leading-tight text-foreground">{t.titulo}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", st.pill)}>
                              {STATUS_LABELS[visualStatus]}
                            </span>
                            {(t.etiquetas || []).map((e) => (
                              <span
                                key={e.id}
                                className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-semibold"
                                style={{ backgroundColor: `${e.cor}1f`, color: e.cor }}
                              >
                                {e.nome}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-base text-muted-foreground">
                          {TIPO_TAREFA[t.tipo as keyof typeof TIPO_TAREFA] || t.tipo}
                        </td>
                        <td className="max-w-[180px] truncate px-3 py-3 text-base text-muted-foreground">{t.intimacao_id || "—"}</td>
                        <td className="max-w-[220px] px-3 py-3 text-base text-muted-foreground">{t.parte_contraria || "—"}</td>
                        <td className="px-3 py-3 text-base text-muted-foreground">{t.cliente_nome || "—"}</td>
                        <td className="px-3 py-3 text-base text-muted-foreground">{t.comarca || "—"}</td>

                        <td className={cn("whitespace-nowrap px-3 py-3 text-base", isVencida(t) ? "font-semibold text-[hsl(var(--task-accent-danger))]" : "text-foreground")}>
                          {t.data_vencimento ? (
                            <>
                              {formatDate(t.data_vencimento)}
                              {t.hora_vencimento && t.hora_vencimento !== "23:59" && <span className="block text-sm">{t.hora_vencimento}</span>}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td
                          className={cn(
                            "whitespace-nowrap px-3 py-3 text-base",
                            fatalAtrasado ? "font-semibold text-[hsl(var(--task-accent-danger))]" : "text-foreground",
                          )}
                        >
                          {formatDate(t.prazo_fatal)}
                        </td>

                        <td className="px-3 py-3 text-base text-muted-foreground">{t.equipe_nome || "—"}</td>
                        <td className="px-3 py-3 text-base text-muted-foreground">{t.responsavel_nome || "—"}</td>

                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="relative group/menu">
                            <button className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            <div className="invisible absolute right-0 top-full z-10 mt-1 min-w-[150px] rounded-lg border border-border bg-card py-1 shadow-lg group-hover/menu:visible">
                              <button onClick={() => setModalEditar(t)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted">
                                <Pencil className="h-3.5 w-3.5" /> Editar
                              </button>
                              {t.status !== "concluida" ? (
                                <button
                                  onClick={() => alterarStatus.mutate({ id: t.id, status: "concluida" })}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                                >
                                  <Check className="h-3.5 w-3.5" /> Concluir
                                </button>
                              ) : (
                                <button
                                  onClick={() => alterarStatus.mutate({ id: t.id, status: "a_fazer" })}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" /> Reabrir
                                </button>
                              )}
                              <button
                                onClick={() => excluir.mutate(t.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive transition hover:bg-muted"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Excluir
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-base text-muted-foreground">
            <span>
              {startItem}-{endItem} de {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <select
                value={porPag}
                onChange={(e) => {
                  setPorPag(Number(e.target.value));
                  setPag(0);
                }}
                className="h-10 min-w-[80px] rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <button
                onClick={() => setPag(Math.max(0, pag - 1))}
                disabled={pag === 0}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-base text-muted-foreground">
                {pag + 1} / {totalPages || 1}
              </span>
              <button
                onClick={() => setPag(Math.min(totalPages - 1, pag + 1))}
                disabled={pag >= totalPages - 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      <button
        onClick={() => setModalCriar(true)}
        className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--task-brand))] text-[hsl(var(--task-brand-foreground))] shadow-lg md:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      {modalCriar && (
        <ModalTarefa
          etiquetas={etiquetas}
          clientes={clientes}
          equipes={equipes}
          colaboradores={colaboradores}
          onSalvar={(t) => {
            salvar.mutate(t as any, { onSuccess: () => setModalCriar(false) });
          }}
          onClose={() => setModalCriar(false)}
          isPending={salvar.isPending}
        />
      )}
      {modalEditar && (
        <ModalTarefa
          tarefa={modalEditar}
          etiquetas={etiquetas}
          clientes={clientes}
          equipes={equipes}
          colaboradores={colaboradores}
          onSalvar={(t) => {
            salvar.mutate(t as any, { onSuccess: () => setModalEditar(null) });
          }}
          onClose={() => setModalEditar(null)}
          isPending={salvar.isPending}
          onExcluir={() => {
            excluir.mutate(modalEditar.id);
            setModalEditar(null);
          }}
          onAlterarStatus={(s) => {
            alterarStatus.mutate({ id: modalEditar.id, status: s });
            setModalEditar(null);
          }}
        />
      )}
      {modalEtiquetas && (
        <ModalEtiquetas
          etiquetas={etiquetas}
          onSalvar={(e) => salvarEtiqueta.mutate(e)}
          onExcluir={(id) => excluirEtiqueta.mutate(id)}
          onClose={() => setModalEtiquetas(false)}
        />
      )}
    </div>
  );
}


// ─── Modal Tarefa ─────────────────────────────────────────────────────────────
function ModalTarefa({
  tarefa, etiquetas, clientes, equipes, colaboradores, onSalvar, onClose, isPending, onExcluir, onAlterarStatus
}: {
  tarefa?: Tarefa; etiquetas: Etiqueta[]; clientes: any[]; equipes: any[]; colaboradores: any[];
  onSalvar: (t: any) => void; onClose: () => void; isPending: boolean;
  onExcluir?: () => void; onAlterarStatus?: (s: string) => void;
}) {
  const [form, setForm] = useState({
    titulo: tarefa?.titulo || "", tipo: tarefa?.tipo || "administrativa", descricao: tarefa?.descricao || "",
    cliente_id: tarefa?.cliente_id || "", intimacao_id: tarefa?.intimacao_id || "",
    parte_contraria: tarefa?.parte_contraria || "", estado: tarefa?.estado || "", comarca: tarefa?.comarca || "",
    prazo_fatal: tarefa?.prazo_fatal || "", data_vencimento: tarefa?.data_vencimento || "",
    hora_vencimento: tarefa?.hora_vencimento || "23:59", equipe_id: tarefa?.equipe_id || "",
    responsavel_id: tarefa?.responsavel_id || "", status: tarefa?.status || "a_fazer",
  });
  const [etiquetaIds, setEtiquetaIds] = useState<string[]>(tarefa?.etiquetas?.map(e => e.id) || []);
  const [abaLog, setAbaLog] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo) return;
    onSalvar({
      ...form, ...(tarefa?.id ? { id: tarefa.id } : {}),
      cliente_id: form.cliente_id || null, intimacao_id: form.intimacao_id || null,
      equipe_id: form.equipe_id || null, responsavel_id: form.responsavel_id || null,
      prazo_fatal: form.prazo_fatal || null, data_vencimento: form.data_vencimento || null,
      etiqueta_ids: etiquetaIds,
    });
  }

  const toggleEtiqueta = (id: string) => setEtiquetaIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const ic = "w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none placeholder:text-muted-foreground";
  const lc = "block text-xs text-muted-foreground mb-1.5 font-medium";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card md:rounded-xl rounded-t-xl shadow-2xl max-w-2xl w-full overflow-hidden slide-up md:mx-4 max-h-[90vh] flex flex-col border border-border">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-border">
          <h3 className="text-base font-bold text-foreground">{tarefa ? "Editar Tarefa" : "Nova Tarefa"}</h3>
          <div className="flex items-center gap-2">
            {tarefa && onAlterarStatus && (
              <select value={form.status} onChange={e => { setForm({ ...form, status: e.target.value }); onAlterarStatus(e.target.value); }}
                className="px-2 py-1 border border-border rounded-lg text-xs bg-background text-foreground">
                {Object.entries(STATUS_TAREFA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {tarefa && (
          <div className="flex gap-1 px-6 pt-3 pb-1">
            <button onClick={() => setAbaLog(false)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${!abaLog ? "bg-foreground text-background border-foreground" : "bg-background text-foreground border-border"}`}>Dados</button>
            <button onClick={() => setAbaLog(true)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${abaLog ? "bg-foreground text-background border-foreground" : "bg-background text-foreground border-border"}`}>Histórico</button>
          </div>
        )}

        {abaLog && tarefa ? (
          <LogsTarefaView tarefaId={tarefa.id} />
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={lc}>Título *</label><input type="text" required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className={ic} /></div>
              <div><label className={lc}>Tipo</label><select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className={ic}>{Object.entries(TIPO_TAREFA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className={lc}>Cliente</label><select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} className={ic}><option value="">Nenhum</option>{clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
              <div><label className={lc}>Parte Contrária</label><input type="text" value={form.parte_contraria} onChange={e => setForm({ ...form, parte_contraria: e.target.value })} className={ic} /></div>
              <div><label className={lc}>Estado</label><select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className={ic}><option value="">Selecione</option>{UF_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
              <div><label className={lc}>Comarca</label><input type="text" value={form.comarca} onChange={e => setForm({ ...form, comarca: e.target.value })} className={ic} /></div>
              <div><label className={lc}>Prazo Fatal</label><input type="date" value={form.prazo_fatal} onChange={e => setForm({ ...form, prazo_fatal: e.target.value })} className={ic} /></div>
              <div><label className={lc}>Data Vencimento</label><input type="date" value={form.data_vencimento} onChange={e => setForm({ ...form, data_vencimento: e.target.value })} className={ic} /></div>
              <div><label className={lc}>Hora Vencimento</label><input type="time" value={form.hora_vencimento} onChange={e => setForm({ ...form, hora_vencimento: e.target.value })} className={ic} /></div>
              <div><label className={lc}>Equipe</label><select value={form.equipe_id} onChange={e => setForm({ ...form, equipe_id: e.target.value })} className={ic}><option value="">Nenhuma</option>{equipes.map((eq: any) => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}</select></div>
              <div><label className={lc}>Responsável</label><select value={form.responsavel_id} onChange={e => setForm({ ...form, responsavel_id: e.target.value })} className={ic}><option value="">Nenhum</option>{colaboradores.filter((c: any) => c.ativo).map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
              {etiquetas.length > 0 && (
                <div className="md:col-span-2">
                  <label className={lc}>Etiquetas</label>
                  <div className="flex gap-2 flex-wrap">
                    {etiquetas.map(e => (
                      <button key={e.id} type="button" onClick={() => toggleEtiqueta(e.id)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition border ${etiquetaIds.includes(e.id) ? "text-white" : "text-muted-foreground bg-background border-border"}`}
                        style={etiquetaIds.includes(e.id) ? { backgroundColor: e.cor, borderColor: e.cor } : {}}>{e.nome}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="md:col-span-2"><label className={lc}>Descrição</label><textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={3} className={`${ic} resize-none`} /></div>
            </div>
            <div className="flex gap-3 pt-2 sticky bottom-0 bg-card py-4 -mx-6 px-6 border-t border-border">
              {tarefa && onExcluir && <button type="button" onClick={onExcluir} className="px-4 py-2.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-sm font-medium transition">Excluir</button>}
              <div className="flex-1" />
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-muted text-sm font-medium transition">Cancelar</button>
              <button type="submit" disabled={isPending} className="px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
                {isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Logs View ────────────────────────────────────────────────────────────────
function LogsTarefaView({ tarefaId }: { tarefaId: string }) {
  const { data: logs, isLoading } = useLogsTarefa(tarefaId);
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {isLoading ? <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
       : !logs || logs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro de alteração</p>
       : (
        <div className="space-y-3">
          {logs.map(l => (
            <div key={l.id} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{l.campo}</span>
                <span className="text-[10px] text-muted-foreground">{l.created_at ? new Date(l.created_at).toLocaleString("pt-BR") : ""}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground line-through">{l.valor_anterior || "—"}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-foreground font-medium">{l.valor_novo || "—"}</span>
              </div>
              {l.nome_usuario && <p className="text-[10px] text-muted-foreground mt-1">por {l.nome_usuario}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal Etiquetas ──────────────────────────────────────────────────────────
function ModalEtiquetas({ etiquetas, onSalvar, onExcluir, onClose }: {
  etiquetas: Etiqueta[]; onSalvar: (e: Partial<Etiqueta> & { nome: string }) => void;
  onExcluir: (id: string) => void; onClose: () => void;
}) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#3B82F6");
  const [editando, setEditando] = useState<Etiqueta | null>(null);

  function handleAdd() {
    if (!nome) return;
    if (editando) { onSalvar({ id: editando.id, nome, cor }); setEditando(null); }
    else onSalvar({ nome, cor });
    setNome(""); setCor("#3B82F6");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card md:rounded-xl rounded-t-xl shadow-2xl max-w-md w-full overflow-hidden slide-up md:mx-4 max-h-[80vh] flex flex-col border border-border">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-border">
          <h3 className="text-base font-bold text-foreground">Gerenciar Etiquetas</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-4">
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Nome da etiqueta" value={nome} onChange={e => setNome(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none placeholder:text-muted-foreground" />
            <input type="color" value={cor} onChange={e => setCor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
            <button onClick={handleAdd} disabled={!nome} className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-90 transition">
              {editando ? "Salvar" : "Criar"}
            </button>
          </div>
          <div className="space-y-1">
            {etiquetas.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: e.cor }} />
                  <span className="text-sm text-foreground">{e.nome}</span>
                </div>
                <div className="flex gap-0.5">
                  <button onClick={() => { setEditando(e); setNome(e.nome); setCor(e.cor); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onExcluir(e.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
