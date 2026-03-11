import { useState, useMemo } from "react";
import { useTarefas, useEtiquetas, useLogsTarefa } from "@/tarefas/hooks";
import { useClientes } from "@/hooks/useClientes";
import { useEquipes, useColaboradores } from "@/escritorio/hooks";
import { STATUS_TAREFA, TIPO_TAREFA, type Tarefa, type StatusTarefa, type Etiqueta } from "@/tarefas/tipos_tarefas";
import { UF_OPTIONS } from "@/escritorio/tipos_escritorio";

type FiltroStatus = "ativas" | "todas" | StatusTarefa;

function formatDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("pt-BR");
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
  const POR_PAG = 20;

  const resumo = useMemo(() => {
    const ativas = tarefas.filter(t => !["concluida", "cancelada"].includes(t.status));
    return {
      total: tarefas.length,
      aVencer: ativas.filter(t => t.data_vencimento && !isVencida(t) && !isHoje(t)).length,
      prazoHoje: ativas.filter(t => isHoje(t)).length,
      vencidas: ativas.filter(t => isVencida(t)).length,
      concluidas: tarefas.filter(t => t.status === "concluida").length,
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

  const paginated = filtered.slice(pag * POR_PAG, (pag + 1) * POR_PAG);
  const totalPages = Math.ceil(filtered.length / POR_PAG);

  const cards = [
    { label: "A Vencer", count: resumo.aVencer, bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Prazo Hoje", count: resumo.prazoHoje, bg: "bg-amber-50", text: "text-amber-600" },
    { label: "Vencidas", count: resumo.vencidas, bg: "bg-red-50", text: "text-red-600" },
    { label: "Concluídas", count: resumo.concluidas, bg: "bg-green-50", text: "text-green-600" },
  ];

  return (
    <div className="fade-in">
      {/* Cards resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {cards.map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl p-4 border`}>
            <p className="text-xs text-gray-500 font-medium">{c.label}</p>
            <p className={`text-2xl font-bold ${c.text} mt-1`}>{c.count}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input type="text" placeholder="Buscar tarefa..." value={busca} onChange={e => setBusca(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none w-48" />
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {(["ativas", "todas", "a_fazer", "em_andamento", "concluida", "reagendada", "cancelada"] as FiltroStatus[]).map(s => (
            <button key={s} onClick={() => { setFiltroStatus(s); setPag(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${filtroStatus === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
              {s === "ativas" ? "Ativas" : s === "todas" ? "Todas" : STATUS_TAREFA[s as StatusTarefa]?.label || s}
            </button>
          ))}
        </div>
        <select value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPag(0); }}
          className="px-3 py-1.5 border rounded-xl text-xs bg-white">
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_TAREFA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {etiquetas.length > 0 && (
          <select value={filtroEtiqueta} onChange={e => { setFiltroEtiqueta(e.target.value); setPag(0); }}
            className="px-3 py-1.5 border rounded-xl text-xs bg-white">
            <option value="">Todas etiquetas</option>
            {etiquetas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={() => setModalEtiquetas(true)} className="px-3 py-2 rounded-xl border text-sm text-gray-500 hover:bg-gray-50 transition active:scale-95">
            Etiquetas
          </button>
          <button onClick={() => setModalCriar(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition active:scale-95 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nova Tarefa
          </button>
        </div>
      </div>

      {/* Tabela desktop */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          <p className="font-medium text-sm">Nenhuma tarefa encontrada</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {paginated.map(t => {
              const st = STATUS_TAREFA[t.status as StatusTarefa] || STATUS_TAREFA.a_fazer;
              return (
                <div key={t.id} onClick={() => setModalEditar(t)}
                  className={`bg-white rounded-xl border border-l-[3px] ${st.border} p-4 active:scale-[0.98] transition cursor-pointer`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{t.titulo}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${st.cor}`}>{st.label}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{TIPO_TAREFA[t.tipo as keyof typeof TIPO_TAREFA] || t.tipo}</span>
                        {t.data_vencimento && (
                          <span className={`text-[10px] ${isVencida(t) ? "text-red-500 font-medium" : "text-gray-400"}`}>
                            {formatDate(t.data_vencimento)}
                          </span>
                        )}
                      </div>
                      {t.etiquetas && t.etiquetas.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {t.etiquetas.map(e => (
                            <span key={e.id} className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: e.cor }}>{e.nome}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Título</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Vencimento</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Etiquetas</th>
                  <th className="w-32"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => {
                  const st = STATUS_TAREFA[t.status as StatusTarefa] || STATUS_TAREFA.a_fazer;
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50 transition cursor-pointer" onClick={() => setModalEditar(t)}>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[250px] truncate">{t.titulo}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{TIPO_TAREFA[t.tipo as keyof typeof TIPO_TAREFA] || t.tipo}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${st.cor}`}>{st.label}</span></td>
                      <td className={`px-4 py-3 text-xs ${isVencida(t) ? "text-red-500 font-medium" : "text-gray-500"}`}>{formatDate(t.data_vencimento)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {(t.etiquetas || []).slice(0, 3).map(e => (
                            <span key={e.id} className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: e.cor }}>{e.nome}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          {t.status !== "concluida" && (
                            <button onClick={() => alterarStatus.mutate({ id: t.id, status: "concluida" })}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-500 transition" title="Concluir">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                          )}
                          {t.status === "concluida" && (
                            <button onClick={() => alterarStatus.mutate({ id: t.id, status: "a_fazer" })}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition" title="Reabrir">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                          )}
                          <button onClick={() => excluir.mutate(t.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Excluir">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPag(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition ${pag === i ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* FAB mobile */}
      <button onClick={() => setModalCriar(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 z-20">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>

      {/* Modal criar tarefa */}
      {modalCriar && (
        <ModalTarefa
          etiquetas={etiquetas}
          clientes={clientes}
          equipes={equipes}
          colaboradores={colaboradores}
          onSalvar={(t) => { salvar.mutate(t as any, { onSuccess: () => setModalCriar(false) }); }}
          onClose={() => setModalCriar(false)}
          isPending={salvar.isPending}
        />
      )}

      {/* Modal editar tarefa */}
      {modalEditar && (
        <ModalTarefa
          tarefa={modalEditar}
          etiquetas={etiquetas}
          clientes={clientes}
          equipes={equipes}
          colaboradores={colaboradores}
          onSalvar={(t) => { salvar.mutate(t as any, { onSuccess: () => setModalEditar(null) }); }}
          onClose={() => setModalEditar(null)}
          isPending={salvar.isPending}
          onExcluir={() => { excluir.mutate(modalEditar.id); setModalEditar(null); }}
          onAlterarStatus={(s) => { alterarStatus.mutate({ id: modalEditar.id, status: s }); setModalEditar(null); }}
        />
      )}

      {/* Modal etiquetas */}
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

// ─── Modal Tarefa (Criar/Editar) ──────────────────────────────────────────────
function ModalTarefa({
  tarefa, etiquetas, clientes, equipes, colaboradores, onSalvar, onClose, isPending, onExcluir, onAlterarStatus
}: {
  tarefa?: Tarefa;
  etiquetas: Etiqueta[];
  clientes: any[];
  equipes: any[];
  colaboradores: any[];
  onSalvar: (t: any) => void;
  onClose: () => void;
  isPending: boolean;
  onExcluir?: () => void;
  onAlterarStatus?: (s: string) => void;
}) {
  const [form, setForm] = useState({
    titulo: tarefa?.titulo || "",
    tipo: tarefa?.tipo || "administrativa",
    descricao: tarefa?.descricao || "",
    cliente_id: tarefa?.cliente_id || "",
    intimacao_id: tarefa?.intimacao_id || "",
    parte_contraria: tarefa?.parte_contraria || "",
    estado: tarefa?.estado || "",
    comarca: tarefa?.comarca || "",
    prazo_fatal: tarefa?.prazo_fatal || "",
    data_vencimento: tarefa?.data_vencimento || "",
    hora_vencimento: tarefa?.hora_vencimento || "23:59",
    equipe_id: tarefa?.equipe_id || "",
    responsavel_id: tarefa?.responsavel_id || "",
    status: tarefa?.status || "a_fazer",
  });
  const [etiquetaIds, setEtiquetaIds] = useState<string[]>(tarefa?.etiquetas?.map(e => e.id) || []);
  const [abaLog, setAbaLog] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo) return;
    onSalvar({
      ...form,
      ...(tarefa?.id ? { id: tarefa.id } : {}),
      cliente_id: form.cliente_id || null,
      intimacao_id: form.intimacao_id || null,
      equipe_id: form.equipe_id || null,
      responsavel_id: form.responsavel_id || null,
      prazo_fatal: form.prazo_fatal || null,
      data_vencimento: form.data_vencimento || null,
      etiqueta_ids: etiquetaIds,
    });
  }

  function toggleEtiqueta(id: string) {
    setEtiquetaIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-2xl w-full overflow-hidden slide-up md:mx-4 max-h-[90vh] flex flex-col">
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">{tarefa ? "Editar Tarefa" : "Nova Tarefa"}</h3>
          <div className="flex items-center gap-2">
            {tarefa && onAlterarStatus && (
              <select value={form.status} onChange={e => { setForm({ ...form, status: e.target.value }); onAlterarStatus(e.target.value); }}
                className="px-2 py-1 border rounded-lg text-xs bg-white">
                {Object.entries(STATUS_TAREFA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            )}
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </div>

        {tarefa && (
          <div className="flex gap-1 px-6 mb-2">
            <button onClick={() => setAbaLog(false)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${!abaLog ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>Dados</button>
            <button onClick={() => setAbaLog(true)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${abaLog ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>Histórico</button>
          </div>
        )}

        {abaLog && tarefa ? (
          <LogsTarefaView tarefaId={tarefa.id} />
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Título *</label>
                <input type="text" required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Tipo</label>
                <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none">
                  {Object.entries(TIPO_TAREFA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Cliente</label>
                <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none">
                  <option value="">Nenhum</option>
                  {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Parte Contrária</label>
                <input type="text" value={form.parte_contraria} onChange={e => setForm({ ...form, parte_contraria: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Estado</label>
                <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none">
                  <option value="">Selecione</option>
                  {UF_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Comarca</label>
                <input type="text" value={form.comarca} onChange={e => setForm({ ...form, comarca: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Prazo Fatal</label>
                <input type="date" value={form.prazo_fatal} onChange={e => setForm({ ...form, prazo_fatal: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Data Vencimento</label>
                <input type="date" value={form.data_vencimento} onChange={e => setForm({ ...form, data_vencimento: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Hora Vencimento</label>
                <input type="time" value={form.hora_vencimento} onChange={e => setForm({ ...form, hora_vencimento: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Equipe</label>
                <select value={form.equipe_id} onChange={e => setForm({ ...form, equipe_id: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none">
                  <option value="">Nenhuma</option>
                  {equipes.map((eq: any) => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Responsável</label>
                <select value={form.responsavel_id} onChange={e => setForm({ ...form, responsavel_id: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none">
                  <option value="">Nenhum</option>
                  {colaboradores.filter((c: any) => c.ativo).map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              {etiquetas.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Etiquetas</label>
                  <div className="flex gap-2 flex-wrap">
                    {etiquetas.map(e => (
                      <button key={e.id} type="button" onClick={() => toggleEtiqueta(e.id)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition border ${etiquetaIds.includes(e.id) ? "text-white" : "text-gray-600 bg-white"}`}
                        style={etiquetaIds.includes(e.id) ? { backgroundColor: e.cor, borderColor: e.cor } : {}}>
                        {e.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Descrição</label>
                <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={3}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2 sticky bottom-0 bg-white py-4 -mx-6 px-6 border-t">
              {tarefa && onExcluir && (
                <button type="button" onClick={onExcluir} className="px-5 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition active:scale-95">Excluir</button>
              )}
              <div className="flex-1" />
              <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl border text-gray-600 hover:bg-gray-50 text-sm font-medium transition active:scale-95">Cancelar</button>
              <button type="submit" disabled={isPending} className="px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition active:scale-95 disabled:opacity-50">
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
      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-8">Carregando...</p>
      ) : !logs || logs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhum registro de alteração</p>
      ) : (
        <div className="space-y-3">
          {logs.map(l => (
            <div key={l.id} className="bg-gray-50 rounded-xl p-3 border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">{l.campo}</span>
                <span className="text-[10px] text-gray-400">{l.created_at ? new Date(l.created_at).toLocaleString("pt-BR") : ""}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 line-through">{l.valor_anterior || "—"}</span>
                <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                <span className="text-gray-700 font-medium">{l.valor_novo || "—"}</span>
              </div>
              {l.nome_usuario && <p className="text-[10px] text-gray-400 mt-1">por {l.nome_usuario}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal Etiquetas ──────────────────────────────────────────────────────────
function ModalEtiquetas({ etiquetas, onSalvar, onExcluir, onClose }: {
  etiquetas: Etiqueta[];
  onSalvar: (e: Partial<Etiqueta> & { nome: string }) => void;
  onExcluir: (id: string) => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#3B82F6");
  const [editando, setEditando] = useState<Etiqueta | null>(null);

  function handleAdd() {
    if (!nome) return;
    if (editando) {
      onSalvar({ id: editando.id, nome, cor });
      setEditando(null);
    } else {
      onSalvar({ nome, cor });
    }
    setNome("");
    setCor("#3B82F6");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-md w-full overflow-hidden slide-up md:mx-4 max-h-[80vh] flex flex-col">
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Gerenciar Etiquetas</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="px-6 py-4">
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Nome da etiqueta" value={nome} onChange={e => setNome(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
            <input type="color" value={cor} onChange={e => setCor(e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" />
            <button onClick={handleAdd} disabled={!nome} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-gray-800 transition active:scale-95">
              {editando ? "Salvar" : "Criar"}
            </button>
          </div>
          <div className="space-y-2">
            {etiquetas.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: e.cor }} />
                  <span className="text-sm text-gray-700">{e.nome}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditando(e); setNome(e.nome); setCor(e.cor); }} className="p-1 rounded hover:bg-gray-100 text-gray-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                  <button onClick={() => onExcluir(e.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
