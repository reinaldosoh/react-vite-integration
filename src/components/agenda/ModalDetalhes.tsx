import { getCategoria, type Compromisso } from "@/lib/agenda-utils";

interface Props {
  compromisso: Compromisso;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ModalDetalhes({ compromisso, onClose, onEdit, onDelete }: Props) {
  const cat = getCategoria(compromisso.categoria);
  const inicio = compromisso.hora_inicio.slice(0, 5);
  const fim = compromisso.hora_fim.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-md w-full overflow-hidden slide-up md:mx-4" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${cat.dot}`} />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${cat.bg}`}>{cat.label}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg active:scale-95">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">{compromisso.titulo}</h2>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>{new Date(compromisso.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{inicio} – {fim}</span>
            </div>
            {compromisso.local && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>{compromisso.local}</span>
              </div>
            )}
            {compromisso.link_reuniao && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                <a href={compromisso.link_reuniao} target="_blank" rel="noopener" className="text-blue-600 underline truncate">{compromisso.link_reuniao}</a>
              </div>
            )}
            {compromisso.cliente && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span>{compromisso.cliente.nome}</span>
              </div>
            )}
          </div>

          {compromisso.descricao && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">{compromisso.descricao}</div>
          )}

          {compromisso.recorrente && compromisso.tipo_recorrencia && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Recorrência: {compromisso.tipo_recorrencia}
              {compromisso.data_fim_recorrencia && ` até ${new Date(compromisso.data_fim_recorrencia + "T12:00:00").toLocaleDateString("pt-BR")}`}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t flex gap-3">
          <button onClick={onDelete} className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 active:scale-95 transition">Excluir</button>
          <button onClick={onEdit} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 active:scale-95 transition">Editar</button>
        </div>
      </div>
    </div>
  );
}
