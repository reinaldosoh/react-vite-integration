import { useState } from "react";
import { useClientes } from "@/hooks/useClientes";
import type { Cliente } from "@/lib/agenda-utils";

function ModalCliente({ cliente, onClose, onSave }: {
  cliente?: Cliente | null;
  onClose: () => void;
  onSave: (data: Omit<Cliente, "id" | "user_id" | "created_at">) => void;
}) {
  const [nome, setNome] = useState(cliente?.nome || "");
  const [email, setEmail] = useState(cliente?.email || "");
  const [telefone, setTelefone] = useState(cliente?.telefone || "");
  const [documento, setDocumento] = useState(cliente?.documento || "");
  const [observacoes, setObservacoes] = useState(cliente?.observacoes || "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    onSave({ nome: nome.trim(), email: email || null, telefone: telefone || null, documento: documento || null, observacoes: observacoes || null });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-md w-full overflow-hidden slide-up md:mx-4 max-h-[90vh] flex flex-col" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-sm font-bold text-gray-900">{cliente ? "Editar Cliente" : "Novo Cliente"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg active:scale-95">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Nome *</label>
            <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" placeholder="Nome do cliente" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">CPF/CNPJ</label>
              <input type="text" value={documento} onChange={(e) => setDocumento(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Telefone</label>
              <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Observações</label>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3}
              className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none" placeholder="Anotações sobre o cliente" />
          </div>
        </form>
        <div className="px-5 py-4 border-t flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border text-gray-600 text-sm font-medium hover:bg-gray-50 active:scale-95 transition">Cancelar</button>
          <button type="button" onClick={() => { if (nome.trim()) submit({ preventDefault: () => {} } as any); }} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 active:scale-95 transition disabled:opacity-40" disabled={!nome.trim()}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

function ModalConfirmDelete({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-sm w-full overflow-hidden slide-up md:mx-4" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="bg-red-50 px-6 pt-6 pb-4 flex flex-col items-center text-center">
          <div className="bg-red-100 rounded-full p-3 mb-3">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1">Excluir cliente?</h3>
          <p className="text-sm text-gray-500">Os compromissos vinculados perderão o vínculo.</p>
        </div>
        <div className="px-6 py-4 flex gap-3 justify-center">
          <button onClick={onCancel} className="flex-1 px-5 py-3 rounded-xl border text-gray-600 hover:bg-gray-50 text-sm font-medium transition active:scale-95">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition active:scale-95">Excluir</button>
        </div>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const { clientes, isLoading, criar, atualizar, excluir } = useClientes();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const filtered = busca
    ? clientes.filter((c) => [c.nome, c.documento, c.email, c.telefone].filter(Boolean).join(" ").toLowerCase().includes(busca.toLowerCase()))
    : clientes;

  function handleSave(data: Omit<Cliente, "id" | "user_id" | "created_at">) {
    if (editCliente) {
      atualizar.mutate({ id: editCliente.id, ...data }, { onSuccess: () => { setEditCliente(null); setModalOpen(false); } });
    } else {
      criar.mutate(data, { onSuccess: () => setModalOpen(false) });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Clientes</h1>
          <p className="text-xs text-gray-400">{clientes.length} cadastrado(s)</p>
        </div>
        <button onClick={() => { setEditCliente(null); setModalOpen(true); }}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition flex items-center gap-1.5 active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Novo
        </button>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Buscar por nome, documento, e-mail..." value={busca} onChange={(e) => setBusca(e.target.value)}
          className="w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-8 h-8 mx-auto mb-2 spinner" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <p className="text-sm">Carregando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-14 h-14 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <p className="font-medium text-sm">{busca ? "Nenhum resultado" : "Nenhum cliente cadastrado"}</p>
          <p className="text-xs mt-1">{busca ? "Tente outra busca" : "Toque em \"Novo\" para começar"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border p-4 hover:border-gray-300 transition cursor-pointer active:scale-[0.99]"
              onClick={() => { setEditCliente(c); setModalOpen(true); }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-gray-500">{c.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.documento && <span className="text-[11px] text-gray-400">{c.documento}</span>}
                      {c.telefone && <span className="text-[11px] text-gray-400">{c.telefone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}
                    className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition active:scale-95">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ModalCliente
          cliente={editCliente}
          onClose={() => { setModalOpen(false); setEditCliente(null); }}
          onSave={handleSave}
        />
      )}

      {deleteId && (
        <ModalConfirmDelete
          onConfirm={() => { excluir.mutate(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
