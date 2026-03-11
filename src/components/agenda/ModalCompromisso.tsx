import { useState, useEffect } from "react";
import { CATEGORIAS, LEMBRETES_OPTIONS, RECORRENCIA_OPTIONS, type Compromisso } from "@/lib/agenda-utils";
import { useClientes } from "@/hooks/useClientes";
import type { Intimacao } from "@/lib/api";

interface Props {
  compromisso?: Compromisso | null;
  defaultDate?: string;
  defaultHora?: string;
  intimacoes?: Intimacao[];
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function ModalCompromisso({ compromisso, defaultDate, defaultHora, intimacoes = [], onClose, onSave }: Props) {
  const { clientes } = useClientes();
  const [titulo, setTitulo] = useState(compromisso?.titulo || "");
  const [descricao, setDescricao] = useState(compromisso?.descricao || "");
  const [categoria, setCategoria] = useState(compromisso?.categoria || "reuniao");
  const [data, setData] = useState(compromisso?.data || defaultDate || "");
  const [horaInicio, setHoraInicio] = useState(compromisso?.hora_inicio?.slice(0, 5) || defaultHora || "09:00");
  const [horaFim, setHoraFim] = useState(compromisso?.hora_fim?.slice(0, 5) || "");
  const [local, setLocal] = useState(compromisso?.local || "");
  const [linkReuniao, setLinkReuniao] = useState(compromisso?.link_reuniao || "");
  const [clienteId, setClienteId] = useState(compromisso?.cliente_id || "");
  const [intimacaoId, setIntimacaoId] = useState(compromisso?.intimacao_id || "");
  const [lembreteAtivo, setLembreteAtivo] = useState(compromisso?.lembrete_ativo ?? true);
  const [lembretes, setLembretes] = useState<string[]>(compromisso?.lembretes || ["1_hora"]);
  const [recorrente, setRecorrente] = useState(compromisso?.recorrente || false);
  const [tipoRecorrencia, setTipoRecorrencia] = useState(compromisso?.tipo_recorrencia || "semanal");
  const [dataFimRecorrencia, setDataFimRecorrencia] = useState(compromisso?.data_fim_recorrencia || "");

  useEffect(() => {
    if (horaInicio && !horaFim) {
      const [h, m] = horaInicio.split(":").map(Number);
      setHoraFim(`${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }, [horaInicio]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !data || !horaInicio || !horaFim) return;
    onSave({
      titulo: titulo.trim(),
      descricao: descricao || null,
      categoria,
      data,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      local: local || null,
      link_reuniao: linkReuniao || null,
      cliente_id: clienteId || null,
      intimacao_id: intimacaoId || null,
      lembrete_ativo: lembreteAtivo,
      lembretes,
      recorrente,
      tipo_recorrencia: recorrente ? tipoRecorrencia : null,
      data_fim_recorrencia: recorrente ? dataFimRecorrencia || null : null,
    });
  }

  function toggleLembrete(val: string) {
    setLembretes((prev) => prev.includes(val) ? prev.filter((l) => l !== val) : [...prev, val]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-lg w-full overflow-hidden slide-up md:mx-4 max-h-[92vh] flex flex-col" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <h2 className="text-sm font-bold text-gray-900">{compromisso ? "Editar Compromisso" : "Novo Compromisso"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg active:scale-95">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Título *</label>
            <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" placeholder="Ex: Audiência TJ/SP" />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Categoria</label>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIAS.map((c) => (
                <button key={c.value} type="button" onClick={() => setCategoria(c.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 border ${categoria === c.value ? `${c.bg} border-current` : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data + Horários */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Data *</label>
              <input type="date" required value={data} onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Início *</label>
              <input type="time" required value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Fim *</label>
              <input type="time" required value={horaFim} onChange={(e) => setHoraFim(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Descrição</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none" placeholder="Detalhes do compromisso" />
          </div>

          {/* Local + Link */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Local</label>
              <input type="text" value={local} onChange={(e) => setLocal(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" placeholder="Fórum, escritório..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Link reunião</label>
              <input type="url" value={linkReuniao} onChange={(e) => setLinkReuniao(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none" placeholder="https://meet..." />
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Cliente</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white">
              <option value="">Sem vínculo</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {/* Intimação */}
          {intimacoes.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Intimação vinculada</label>
              <select value={intimacaoId} onChange={(e) => setIntimacaoId(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white">
                <option value="">Sem vínculo</option>
                {intimacoes.map((i) => <option key={i.id} value={i.id}>{i.numero_processo} {i.tribunal ? `(${i.tribunal})` : ""}</option>)}
              </select>
            </div>
          )}

          {/* Lembretes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-500 font-medium">Lembretes</label>
              <button type="button" onClick={() => setLembreteAtivo(!lembreteAtivo)}
                className={`w-9 h-5 rounded-full transition ${lembreteAtivo ? "bg-gray-900" : "bg-gray-200"} relative`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${lembreteAtivo ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>
            {lembreteAtivo && (
              <div className="flex gap-1.5 flex-wrap">
                {LEMBRETES_OPTIONS.map((l) => (
                  <button key={l.value} type="button" onClick={() => toggleLembrete(l.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition active:scale-95 ${lembretes.includes(l.value) ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recorrência */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-500 font-medium">Recorrente</label>
              <button type="button" onClick={() => setRecorrente(!recorrente)}
                className={`w-9 h-5 rounded-full transition ${recorrente ? "bg-gray-900" : "bg-gray-200"} relative`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${recorrente ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>
            {recorrente && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Frequência</label>
                  <select value={tipoRecorrencia} onChange={(e) => setTipoRecorrencia(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none bg-white">
                    {RECORRENCIA_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Até</label>
                  <input type="date" value={dataFimRecorrencia} onChange={(e) => setDataFimRecorrencia(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none" />
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="px-5 py-4 border-t flex gap-3 flex-shrink-0">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border text-gray-600 text-sm font-medium hover:bg-gray-50 active:scale-95 transition">Cancelar</button>
          <button type="button" onClick={() => { if (titulo.trim() && data && horaInicio && horaFim) submit({ preventDefault: () => {} } as any); }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 active:scale-95 transition disabled:opacity-40"
            disabled={!titulo.trim() || !data || !horaInicio || !horaFim}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
