import { useState, useMemo } from "react";
import { getWeekDays, formatDateISO, type Compromisso } from "@/lib/agenda-utils";
import { useCompromissos } from "@/hooks/useCompromissos";
import GradeHorarios from "@/components/agenda/GradeHorarios";
import MiniCalendario from "@/components/agenda/MiniCalendario";
import ModalCompromisso from "@/components/agenda/ModalCompromisso";
import ModalDetalhes from "@/components/agenda/ModalDetalhes";
import type { Intimacao } from "@/lib/api";

interface Props {
  intimacoes?: Intimacao[];
}

export default function AgendaPage({ intimacoes = [] }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showWeekend, setShowWeekend] = useState(false);
  const [mobileDay, setMobileDay] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Modal state
  const [modalCriar, setModalCriar] = useState<{ date?: string; hora?: string } | null>(null);
  const [modalDetalhes, setModalDetalhes] = useState<Compromisso | null>(null);
  const [modalEditar, setModalEditar] = useState<Compromisso | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const days = useMemo(() => {
    if (mobileDay) return [currentDate];
    return getWeekDays(currentDate, showWeekend);
  }, [currentDate, showWeekend, mobileDay]);

  const weekStart = formatDateISO(days[0]);
  const weekEnd = formatDateISO(days[days.length - 1]);
  const { compromissos, criar, atualizar, excluir } = useCompromissos(weekStart, weekEnd);

  function goToday() { setCurrentDate(new Date()); }
  function goPrev() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (mobileDay ? 1 : 7));
    setCurrentDate(d);
  }
  function goNext() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (mobileDay ? 1 : 7));
    setCurrentDate(d);
  }

  const monthLabel = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  function handleSlotClick(date: string, hora: string) {
    setModalCriar({ date, hora });
  }

  function handleEventClick(c: Compromisso) {
    setModalDetalhes(c);
  }

  function handleSave(data: any) {
    if (modalEditar) {
      atualizar.mutate({ id: modalEditar.id, ...data }, {
        onSuccess: () => { setModalEditar(null); setModalDetalhes(null); }
      });
    } else {
      criar.mutate(data, {
        onSuccess: () => setModalCriar(null)
      });
    }
  }

  function handleDelete(id: string) {
    excluir.mutate(id, {
      onSuccess: () => { setConfirmDelete(null); setModalDetalhes(null); }
    });
  }

  return (
    <div className="flex gap-4">
      {/* Sidebar desktop */}
      <div className="hidden lg:block w-60 flex-shrink-0 space-y-4">
        <button onClick={() => setModalCriar({ date: formatDateISO(currentDate) })}
          className="w-full bg-gray-900 text-white py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2 active:scale-95 shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Novo
        </button>
        <div className="bg-white rounded-2xl border p-4">
          <MiniCalendario currentDate={currentDate} onSelectDate={(d) => setCurrentDate(d)} />
        </div>
        <div className="bg-white rounded-2xl border px-4 py-3">
          <label className="flex items-center gap-2.5 text-xs text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={showWeekend} onChange={(e) => setShowWeekend(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 focus:ring-offset-0" />
            Mostrar fim de semana
          </label>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="px-3 py-1.5 rounded-xl border text-xs font-medium text-gray-600 hover:bg-gray-100 active:scale-95 transition">Hoje</button>
            <button onClick={goPrev} className="p-1.5 rounded-lg hover:bg-gray-100 active:scale-95">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-gray-100 active:scale-95">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <h2 className="text-sm font-bold text-gray-900 capitalize ml-1">{monthLabel}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Mobile: toggle day/week */}
            <div className="md:hidden flex bg-gray-100 rounded-xl p-0.5">
              <button onClick={() => setMobileDay(true)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${mobileDay ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Dia</button>
              <button onClick={() => setMobileDay(false)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${!mobileDay ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>Semana</button>
            </div>
            {/* Mobile: sidebar toggle */}
            <button onClick={() => setShowSidebar(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 active:scale-95">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
            {/* Mobile: new button */}
            <button onClick={() => setModalCriar({ date: formatDateISO(currentDate) })} className="lg:hidden p-2 rounded-xl bg-gray-900 text-white active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        </div>

        <GradeHorarios
          days={days}
          compromissos={compromissos}
          onSlotClick={handleSlotClick}
          onEventClick={handleEventClick}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSidebar(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-gray-50 shadow-xl p-4 space-y-4 slide-up overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">Calendário</span>
              <button onClick={() => setShowSidebar(false)} className="p-1.5 hover:bg-gray-200 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <MiniCalendario currentDate={currentDate} onSelectDate={(d) => { setCurrentDate(d); setShowSidebar(false); }} />
            <div className="bg-white rounded-xl border p-3 space-y-2">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={showWeekend} onChange={(e) => setShowWeekend(e.target.checked)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                Mostrar fim de semana
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {modalCriar && (
        <ModalCompromisso
          defaultDate={modalCriar.date}
          defaultHora={modalCriar.hora}
          intimacoes={intimacoes}
          onClose={() => setModalCriar(null)}
          onSave={handleSave}
        />
      )}

      {modalEditar && (
        <ModalCompromisso
          compromisso={modalEditar}
          intimacoes={intimacoes}
          onClose={() => setModalEditar(null)}
          onSave={handleSave}
        />
      )}

      {modalDetalhes && !modalEditar && (
        <ModalDetalhes
          compromisso={modalDetalhes}
          onClose={() => setModalDetalhes(null)}
          onEdit={() => { setModalEditar(modalDetalhes); }}
          onDelete={() => setConfirmDelete(modalDetalhes.id)}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 fade-in" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div className="bg-white md:rounded-2xl rounded-t-2xl shadow-2xl max-w-sm w-full overflow-hidden slide-up md:mx-4" style={{ paddingBottom: 'var(--safe-bottom)' }}>
            <div className="bg-red-50 px-6 pt-6 pb-4 flex flex-col items-center text-center">
              <div className="bg-red-100 rounded-full p-3 mb-3">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Excluir compromisso?</h3>
              <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="px-6 py-4 flex gap-3 justify-center">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-5 py-3 rounded-xl border text-gray-600 hover:bg-gray-50 text-sm font-medium transition active:scale-95">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition active:scale-95">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
