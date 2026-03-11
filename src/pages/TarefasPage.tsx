import { useState, useMemo } from "react";
import { useTarefas, useEtiquetas, useLogsTarefa } from "@/tarefas/hooks";
import { useClientes } from "@/hooks/useClientes";
import { useEquipes, useColaboradores } from "@/escritorio/hooks";
import { STATUS_TAREFA, TIPO_TAREFA, type Tarefa, type StatusTarefa, type Etiqueta } from "@/tarefas/tipos_tarefas";
import { UF_OPTIONS } from "@/escritorio/tipos_escritorio";
import { ClipboardList, Plus, Tag, Check, RotateCcw, Trash2, Pencil, X, ArrowRight, Search, RefreshCw, MoreHorizontal, ChevronLeft, ChevronRight, Filter, Diamond } from "lucide-react";

type FiltroStatus = "ativas" | "todas" | StatusTarefa;

function formatDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("pt-BR");
}

function formatDateTime(d?: string | null, h?: string) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  const dateStr = dt.toLocaleDateString("pt-BR");
  if (h && h !== "23:59") return `${dateStr}\n${h}`;
  return dateStr;
}

function isVencida(t: Tarefa) {
  if (!t.data_vencimento || ["concluida", "cancelada"].includes(t.status)) return false;
  return new Date(t.data_vencimento + "T" + t.hora_vencimento) < new Date();
}

function isHoje(t: Tarefa) {
  if (!t.data_vencimento) return false;
  return t.data_vencimento === new Date().toISOString().slice(0, 10);
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
    const ativas = tarefas.filter(t => !["concluida", "cancelada"].includes(t.status));
    return {
      aVencer: ativas.filter(t => t.data_vencimento && !isVencida(t) && !isHoje(t)).length,
      prazoHoje: ativas.filter(t => isHoje(t)).length,
      vencidas: ativas.filter(t => isVencida(t)).length,
      concluidas: tarefas.filter(t => t.status === "concluida").length,
      canceladas: tarefas.filter(t => t.status === "cancelada").length,
      reagendadas: tarefas.filter(t => t.status === "reagendada").length,
    };
  }, [tarefas]);

  const filtered = useMemo(() => {
    let f = [...tarefas];
    if (filtroStatus === "ativas") f = f.filter(t => !["concluida", "cancelada"].includes(t.status));
    else if (filtroStatus !== "todas") f = f.filter(t => t.status === filtroStatus);
    if (filtroTipo) f = f.filter(t => t.tipo === filtroTipo);
    if (filtroEtiqueta) f = f.filter(t => t.etiquetas?.some(e => e.id === filtroEtiqueta));
    if (busca) {
      const q = busca.toLowerCase();
      f = f.filter(t => [t.titulo, t.descricao, t.cliente_nome, t.parte_contraria].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return f;
  }, [tarefas, filtroStatus, filtroTipo, filtroEtiqueta, busca]);

  const paginated = filtered.slice(pag * porPag, (pag + 1) * porPag);
  const totalPages = Math.ceil(filtered.length / porPag);
  const startItem = pag * porPag + 1;
  const endItem = Math.min((pag + 1) * porPag, filtered.length);

  const cards = [
    { label: "A Vencer", count: resumo.aVencer, barColor: "bg-orange-400" },
    { label: "Prazo do dia", count: resumo.prazoHoje, barColor: "bg-blue-500" },
    { label: "Vencidas", count: resumo.vencidas, barColor: "bg-red-500" },
    { label: "Concluídas", count: resumo.concluidas, barColor: "bg-green-500" },
    { label: "Canceladas", count: resumo.canceladas, barColor: "bg-red-800" },
    { label: "Reagendadas", count: resumo.reagendadas, barColor: "bg-blue-400" },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lista de Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas tarefas processuais e administrativas</p>
        </div>
        <button onClick={() => window.location.reload()}
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Cards resumo - horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mb-6 -mx-1 px-1">
        {cards.map(c => (
          <div key={c.label} className="bg-card rounded-xl border min-w-[140px] flex-1 flex flex-col">
            <div className="px-4 pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
              <p className="text-2xl font-bold text-foreground">{c.count}</p>
            </div>
            <div className={`h-1 rounded-b-xl ${c.barColor}`} />
          </div>
        ))}
      </div>

      {/* Barra de filtros */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Busca */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Buscar tarefas..." value={busca} onChange={e => setBusca(e.target.value)}
            className="pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm w-56 bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none" />
        </div>

        {/* Separador */}
        <div className="h-8 w-px bg-border hidden md:block" />

        {/* Status filter chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(["ativas", "todas", "a_fazer", "em_andamento", "concluida", "reagendada", "cancelada"] as FiltroStatus[]).map(s => (
            <button key={s} onClick={() => { setFiltroStatus(s); setPag(0); }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition border ${filtroStatus === s
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:bg-muted"
              }`}>
              {s === "ativas" ? "Ativas" : s === "todas" ? "Todas" : STATUS_TAREFA[s as StatusTarefa]?.label || s}
            </button>
          ))}
        </div>

        {/* Separador */}
        <div className="h-8 w-px bg-border hidden md:block" />

        {/* Tipo dropdown */}
        <select value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPag(0); }}
          className="px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground">
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_TAREFA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        {/* Etiquetas button */}
        <button onClick={() => setModalEtiquetas(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition">
          <Diamond className="w-3.5 h-3.5" />
          Etiquetas
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Nova Tarefa */}
        <button onClick={() => setModalCriar(true)}
          className="hidden md:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition active:scale-[0.98]">
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-sm text-muted-foreground">Nenhuma tarefa encontrada</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Tente ajustar os filtros ou crie uma nova tarefa</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {paginated.map((t, idx) => {
              const st = STATUS_TAREFA[t.status as StatusTarefa] || STATUS_TAREFA.a_fazer;
              return (
                <div key={t.id} onClick={() => setModalEditar(t)}
                  className={`bg-card rounded-xl border border-l-[3px] ${st.border} p-4 active:scale-[0.98] transition cursor-pointer`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{t.titulo}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${st.cor}`}>{st.label}</span>
                      {t.etiquetas?.map(e => (
                        <span key={e.id} className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: e.cor }}>{e.nome}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span>{TIPO_TAREFA[t.tipo as keyof typeof TIPO_TAREFA] || t.tipo}</span>
                      {t.data_vencimento && (
                        <span className={isVencida(t) ? "text-destructive font-medium" : ""}>{formatDate(t.data_vencimento)}</span>
                      )}
                      {t.responsavel_nome && <span>{t.responsavel_nome}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="w-10 px-3 py-3">
                      <div className="w-5 h-5 rounded-full border-2 border-border" />
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground w-10">#</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Título</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Tipo</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">P. Contrária</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Comarca</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Vencimento</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Fatal</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Equipe</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Responsável</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((t, idx) => {
                    const st = STATUS_TAREFA[t.status as StatusTarefa] || STATUS_TAREFA.a_fazer;
                    const rowNum = pag * porPag + idx + 1;
                    return (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition cursor-pointer group" onClick={() => setModalEditar(t)}>
                        {/* Checkbox circle */}
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              if (t.status !== "concluida") alterarStatus.mutate({ id: t.id, status: "concluida" });
                              else alterarStatus.mutate({ id: t.id, status: "a_fazer" });
                            }}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                              t.status === "concluida"
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-border hover:border-muted-foreground"
                            }`}>
                            {t.status === "concluida" && <Check className="w-3 h-3" />}
                          </button>
                        </td>
                        {/* # */}
                        <td className="px-3 py-3 text-xs text-muted-foreground">{rowNum}</td>
                        {/* Título + badges */}
                        <td className="px-3 py-3 min-w-[200px]">
                          <p className="font-medium text-foreground text-sm">{t.titulo}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${st.cor}`}>{st.label}</span>
                            {(t.etiquetas || []).map(e => (
                              <span key={e.id} className="text-[10px] px-2 py-0.5 rounded text-white font-medium" style={{ backgroundColor: e.cor }}>{e.nome}</span>
                            ))}
                          </div>
                        </td>
                        {/* Tipo */}
                        <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {TIPO_TAREFA[t.tipo as keyof typeof TIPO_TAREFA] || t.tipo}
                        </td>
                        {/* P. Contrária */}
                        <td className="px-3 py-3 text-xs text-muted-foreground">{t.parte_contraria || "—"}</td>
                        {/* Cliente */}
                        <td className="px-3 py-3 text-xs text-muted-foreground">{t.cliente_nome || "—"}</td>
                        {/* Comarca */}
                        <td className="px-3 py-3 text-xs text-muted-foreground">{t.comarca || "—"}</td>
                        {/* Vencimento */}
                        <td className={`px-3 py-3 text-xs whitespace-nowrap ${isVencida(t) ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                          {t.data_vencimento ? (
                            <>
                              {formatDate(t.data_vencimento)}
                              {t.hora_vencimento && t.hora_vencimento !== "23:59" && (
                                <span className="block text-[10px]">{t.hora_vencimento}</span>
                              )}
                            </>
                          ) : "—"}
                        </td>
                        {/* Fatal */}
                        <td className={`px-3 py-3 text-xs whitespace-nowrap ${t.prazo_fatal && new Date(t.prazo_fatal) < new Date() ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                          {formatDate(t.prazo_fatal)}
                        </td>
                        {/* Equipe */}
                        <td className="px-3 py-3 text-xs text-muted-foreground">{t.equipe_nome || "—"}</td>
                        {/* Responsável */}
                        <td className="px-3 py-3 text-xs text-muted-foreground">{t.responsavel_nome || "—"}</td>
                        {/* Menu */}
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <div className="relative group/menu">
                            <button className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-10 invisible group-hover/menu:visible min-w-[140px]">
                              <button onClick={() => setModalEditar(t)} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition flex items-center gap-2 text-foreground">
                                <Pencil className="w-3 h-3" /> Editar
                              </button>
                              {t.status !== "concluida" && (
                                <button onClick={() => alterarStatus.mutate({ id: t.id, status: "concluida" })} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition flex items-center gap-2 text-foreground">
                                  <Check className="w-3 h-3" /> Concluir
                                </button>
                              )}
                              {t.status === "concluida" && (
                                <button onClick={() => alterarStatus.mutate({ id: t.id, status: "a_fazer" })} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition flex items-center gap-2 text-foreground">
                                  <RotateCcw className="w-3 h-3" /> Reabrir
                                </button>
                              )}
                              <button onClick={() => { excluir.mutate(t.id); }} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition flex items-center gap-2 text-destructive">
                                <Trash2 className="w-3 h-3" /> Excluir
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

          {/* Pagination footer */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span className="text-xs">
              {startItem}-{endItem} de {filtered.length}
            </span>
            <div className="flex items-center gap-3">
              <select value={porPag} onChange={e => { setPorPag(Number(e.target.value)); setPag(0); }}
                className="px-2 py-1.5 border border-border rounded-lg text-xs bg-background text-foreground">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <div className="flex items-center gap-1">
                <button onClick={() => setPag(Math.max(0, pag - 1))} disabled={pag === 0}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs px-2">{pag + 1} / {totalPages || 1}</span>
                <button onClick={() => setPag(Math.min(totalPages - 1, pag + 1))} disabled={pag >= totalPages - 1}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* FAB mobile */}
      <button onClick={() => setModalCriar(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-foreground text-background rounded-full shadow-lg flex items-center justify-center active:scale-95 z-20">
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      {modalCriar && (
        <ModalTarefa
          etiquetas={etiquetas} clientes={clientes} equipes={equipes} colaboradores={colaboradores}
          onSalvar={(t) => { salvar.mutate(t as any, { onSuccess: () => setModalCriar(false) }); }}
          onClose={() => setModalCriar(false)} isPending={salvar.isPending}
        />
      )}
      {modalEditar && (
        <ModalTarefa
          tarefa={modalEditar} etiquetas={etiquetas} clientes={clientes} equipes={equipes} colaboradores={colaboradores}
          onSalvar={(t) => { salvar.mutate(t as any, { onSuccess: () => setModalEditar(null) }); }}
          onClose={() => setModalEditar(null)} isPending={salvar.isPending}
          onExcluir={() => { excluir.mutate(modalEditar.id); setModalEditar(null); }}
          onAlterarStatus={(s) => { alterarStatus.mutate({ id: modalEditar.id, status: s }); setModalEditar(null); }}
        />
      )}
      {modalEtiquetas && (
        <ModalEtiquetas etiquetas={etiquetas} onSalvar={(e) => salvarEtiqueta.mutate(e)}
          onExcluir={(id) => excluirEtiqueta.mutate(id)} onClose={() => setModalEtiquetas(false)}
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
