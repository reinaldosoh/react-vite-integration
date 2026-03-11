import { useState } from "react";
import { useFuncoes } from "./hooks";
import type { FuncaoEscritorio } from "./tipos_escritorio";

export function AbaFuncoes() {
  const { funcoes, isLoading, salvar, excluir } = useFuncoes();
  const [modal, setModal] = useState<Partial<FuncaoEscritorio> | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!modal?.nome) return;
    salvar.mutate(modal as any, { onSuccess: () => setModal(null) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{funcoes.length} função(ões)</p>
        <button onClick={() => setModal({ nome: "", salario_base: 0 })}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition active:scale-95 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nova Função
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : funcoes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          <p className="font-medium text-sm">Nenhuma função cadastrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80">
                <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Salário Base</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {funcoes.map((f) => (
                <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{f.nome}</td>
                  <td className="px-4 py-3 text-gray-600">R$ {Number(f.salario_base).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setModal(f)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => setConfirmDel(f.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-md w-full overflow-hidden slide-up md:mx-4">
            <div className="px-6 pt-6 pb-2">
              <h3 className="text-base font-bold text-gray-900">{modal.id ? "Editar Função" : "Nova Função"}</h3>
            </div>
            <form onSubmit={handleSalvar} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Nome *</label>
                <input type="text" required value={modal.nome || ""} onChange={(e) => setModal({ ...modal, nome: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Salário Base (R$)</label>
                <input type="number" step="0.01" value={modal.salario_base || 0} onChange={(e) => setModal({ ...modal, salario_base: Number(e.target.value) })}
                  className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
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

      {/* Confirmar exclusão */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={(e) => e.target === e.currentTarget && setConfirmDel(null)}>
          <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-sm w-full overflow-hidden slide-up md:mx-4">
            <div className="bg-red-50 px-6 pt-6 pb-4 flex flex-col items-center text-center">
              <div className="bg-red-100 rounded-full p-3 mb-3">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Excluir função?</h3>
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
