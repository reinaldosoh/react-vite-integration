import { useState } from "react";
import { useEquipes, useColaboradores, useEquipeMembros } from "./hooks";
import type { Equipe } from "./tipos_escritorio";

export function AbaEquipes() {
  const { equipes, isLoading, salvar, excluir } = useEquipes();
  const { colaboradores } = useColaboradores();
  const [modal, setModal] = useState<Partial<Equipe> | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [gerenciarMembros, setGerenciarMembros] = useState<string | null>(null);

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!modal?.nome) return;
    salvar.mutate(modal as any, { onSuccess: () => setModal(null) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{equipes.length} equipe(s)</p>
        <button onClick={() => setModal({ nome: "", meta: 0, ativa: true })}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition active:scale-95 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nova Equipe
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : equipes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <p className="font-medium text-sm">Nenhuma equipe cadastrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {equipes.map(eq => (
            <div key={eq.id} className={`bg-white rounded-xl border p-4 ${!eq.ativa ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{eq.nome}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">Meta: R$ {Number(eq.meta).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${eq.ativa ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-100 text-gray-400"}`}>
                      {eq.ativa ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setGerenciarMembros(eq.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Membros">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </button>
                  <button onClick={() => setModal(eq)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => setConfirmDel(eq.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar equipe */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-md w-full overflow-hidden slide-up md:mx-4">
            <div className="px-6 pt-6 pb-2">
              <h3 className="text-base font-bold text-gray-900">{modal.id ? "Editar Equipe" : "Nova Equipe"}</h3>
            </div>
            <form onSubmit={handleSalvar} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Nome *</label>
                <input type="text" required value={modal.nome || ""} onChange={e => setModal({ ...modal, nome: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Meta (R$)</label>
                <input type="number" step="0.01" value={modal.meta || 0} onChange={e => setModal({ ...modal, meta: Number(e.target.value) })}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setModal({ ...modal, ativa: !modal.ativa })}
                  className={`w-10 h-6 rounded-full transition relative ${modal.ativa ? "bg-green-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${modal.ativa ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <span className="text-sm text-gray-600">Ativa</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 px-5 py-3 rounded-xl border text-gray-600 hover:bg-gray-50 text-sm font-medium transition active:scale-95">Cancelar</button>
                <button type="submit" disabled={salvar.isPending} className="flex-1 px-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition active:scale-95 disabled:opacity-50">
                  {salvar.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal gerenciar membros */}
      {gerenciarMembros && <ModalMembros equipeId={gerenciarMembros} colaboradores={colaboradores} onClose={() => setGerenciarMembros(null)} />}

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={e => e.target === e.currentTarget && setConfirmDel(null)}>
          <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-sm w-full overflow-hidden slide-up md:mx-4">
            <div className="bg-red-50 px-6 pt-6 pb-4 flex flex-col items-center text-center">
              <div className="bg-red-100 rounded-full p-3 mb-3"><svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Excluir equipe?</h3>
              <p className="text-sm text-gray-500">Todos os vínculos com colaboradores serão removidos.</p>
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

// ─── Modal Membros ────────────────────────────────────────────────────────────
import type { Colaborador } from "./tipos_escritorio";

function ModalMembros({ equipeId, colaboradores, onClose }: { equipeId: string; colaboradores: Colaborador[]; onClose: () => void }) {
  const { membros, adicionar, remover } = useEquipeMembros(equipeId);
  const membrosIds = new Set(membros.map(m => m.colaborador_id));

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-md w-full overflow-hidden slide-up md:mx-4 max-h-[80vh] flex flex-col">
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Membros da Equipe</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {colaboradores.filter(c => c.ativo).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum colaborador ativo cadastrado</p>
          ) : (
            <div className="space-y-2">
              {colaboradores.filter(c => c.ativo).map(c => {
                const isMembro = membrosIds.has(c.id);
                return (
                  <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 transition">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.nome}</p>
                      <p className="text-xs text-gray-400">{c.funcao_nome || "Sem função"}</p>
                    </div>
                    <button
                      onClick={() => isMembro ? remover.mutate(c.id) : adicionar.mutate(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 ${isMembro ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
                      {isMembro ? "Remover" : "Adicionar"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
