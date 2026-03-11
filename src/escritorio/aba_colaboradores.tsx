import { useState } from "react";
import { useColaboradores, useFuncoes } from "./hooks";
import type { Colaborador } from "./tipos_escritorio";
import { SEXO_OPTIONS, ESTADO_CIVIL_OPTIONS, UF_OPTIONS } from "./tipos_escritorio";

const empty: Partial<Colaborador> = { nome: "", cpf: "", sexo: "", estado_civil: "", email: "", telefone: "", logradouro: "", numero: "", bairro: "", estado: "", cidade: "", cep: "", acesso_sistema: false, ativo: true, observacoes: "", funcao_id: null };

export function AbaColaboradores() {
  const { colaboradores, isLoading, salvar, excluir } = useColaboradores();
  const { funcoes } = useFuncoes();
  const [modal, setModal] = useState<Partial<Colaborador> | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState<"todos" | "ativos" | "inativos">("ativos");

  let filtered = [...colaboradores];
  if (filtroAtivo === "ativos") filtered = filtered.filter(c => c.ativo);
  if (filtroAtivo === "inativos") filtered = filtered.filter(c => !c.ativo);
  if (busca) {
    const q = busca.toLowerCase();
    filtered = filtered.filter(c => [c.nome, c.cpf, c.email, c.telefone].filter(Boolean).join(" ").toLowerCase().includes(q));
  }

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!modal?.nome) return;
    salvar.mutate(modal as any, { onSuccess: () => setModal(null) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)}
            className="px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none w-48" />
          <div className="flex gap-1">
            {(["ativos", "todos", "inativos"] as const).map(f => (
              <button key={f} onClick={() => setFiltroAtivo(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${filtroAtivo === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setModal({ ...empty })}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition active:scale-95 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Novo Colaborador
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <p className="font-medium text-sm">Nenhum colaborador encontrado</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map(c => (
              <div key={c.id} className={`bg-white rounded-xl border p-4 ${!c.ativo ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.nome}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.funcao_nome || "Sem função"}</p>
                    {c.email && <p className="text-xs text-gray-500 mt-1">{c.email}</p>}
                    {c.telefone && <p className="text-xs text-gray-500">{c.telefone}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setModal(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={() => setConfirmDel(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Nome</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Função</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Telefone</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className={`border-b last:border-0 hover:bg-gray-50 transition ${!c.ativo ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.nome}</td>
                    <td className="px-4 py-3 text-gray-500">{c.funcao_nome || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{c.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{c.telefone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.ativo ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-100 text-gray-400"}`}>
                        {c.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setModal(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={() => setConfirmDel(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal criar/editar colaborador */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-lg w-full overflow-hidden slide-up md:mx-4 max-h-[90vh] flex flex-col">
            <div className="px-6 pt-6 pb-2 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">{modal.id ? "Editar Colaborador" : "Novo Colaborador"}</h3>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-gray-100"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleSalvar} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Nome *</label>
                  <input type="text" required value={modal.nome || ""} onChange={e => setModal({ ...modal, nome: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">CPF</label>
                  <input type="text" value={modal.cpf || ""} onChange={e => setModal({ ...modal, cpf: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Função</label>
                  <select value={modal.funcao_id || ""} onChange={e => setModal({ ...modal, funcao_id: e.target.value || null })}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white">
                    <option value="">Nenhuma</option>
                    {funcoes.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Sexo</label>
                  <select value={modal.sexo || ""} onChange={e => setModal({ ...modal, sexo: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white">
                    <option value="">Selecione</option>
                    {SEXO_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Estado Civil</label>
                  <select value={modal.estado_civil || ""} onChange={e => setModal({ ...modal, estado_civil: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white">
                    <option value="">Selecione</option>
                    {ESTADO_CIVIL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Email</label>
                  <input type="email" value={modal.email || ""} onChange={e => setModal({ ...modal, email: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Telefone</label>
                  <input type="text" value={modal.telefone || ""} onChange={e => setModal({ ...modal, telefone: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
                </div>

                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Endereço</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Logradouro</label>
                  <input type="text" value={modal.logradouro || ""} onChange={e => setModal({ ...modal, logradouro: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Número</label>
                  <input type="text" value={modal.numero || ""} onChange={e => setModal({ ...modal, numero: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Bairro</label>
                  <input type="text" value={modal.bairro || ""} onChange={e => setModal({ ...modal, bairro: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Cidade</label>
                  <input type="text" value={modal.cidade || ""} onChange={e => setModal({ ...modal, cidade: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Estado</label>
                  <select value={modal.estado || ""} onChange={e => setModal({ ...modal, estado: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white">
                    <option value="">Selecione</option>
                    {UF_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">CEP</label>
                  <input type="text" value={modal.cep || ""} onChange={e => setModal({ ...modal, cep: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
                </div>

                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Configurações</p>
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <button type="button" onClick={() => setModal({ ...modal, ativo: !modal.ativo })}
                    className={`w-10 h-6 rounded-full transition relative ${modal.ativo ? "bg-green-500" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${modal.ativo ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                  <span className="text-sm text-gray-600">Ativo</span>
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <button type="button" onClick={() => setModal({ ...modal, acesso_sistema: !modal.acesso_sistema })}
                    className={`w-10 h-6 rounded-full transition relative ${modal.acesso_sistema ? "bg-blue-500" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${modal.acesso_sistema ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                  <span className="text-sm text-gray-600">Acesso ao sistema</span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Observações</label>
                  <textarea value={modal.observacoes || ""} onChange={e => setModal({ ...modal, observacoes: e.target.value })} rows={3}
                    className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white py-4 -mx-6 px-6 border-t">
                <button type="button" onClick={() => setModal(null)} className="flex-1 px-5 py-3 rounded-xl border text-gray-600 hover:bg-gray-50 text-sm font-medium transition active:scale-95">Cancelar</button>
                <button type="submit" disabled={salvar.isPending} className="flex-1 px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition active:scale-95 disabled:opacity-50">
                  {salvar.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={e => e.target === e.currentTarget && setConfirmDel(null)}>
          <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-sm w-full overflow-hidden slide-up md:mx-4">
            <div className="bg-red-50 px-6 pt-6 pb-4 flex flex-col items-center text-center">
              <div className="bg-red-100 rounded-full p-3 mb-3"><svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Excluir colaborador?</h3>
              <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="px-6 py-4 flex gap-3 justify-center">
              <button onClick={() => setConfirmDel(null)} className="flex-1 px-5 py-3 rounded-xl border text-gray-600 hover:bg-gray-50 text-sm font-medium transition active:scale-95">Cancelar</button>
              <button onClick={() => { excluir.mutate(confirmDel); setConfirmDel(null); }} className="flex-1 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition active:scale-95">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
