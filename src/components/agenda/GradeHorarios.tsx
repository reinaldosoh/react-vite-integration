import { HOURS, formatDateISO, formatDateBR, formatWeekday, isToday, getCategoria, type Compromisso } from "@/lib/agenda-utils";

interface Props {
  days: Date[];
  compromissos: Compromisso[];
  onSlotClick: (date: string, hora: string) => void;
  onEventClick: (c: Compromisso) => void;
}

export default function GradeHorarios({ days, compromissos, onSlotClick, onEventClick }: Props) {
  function eventosNoDia(date: Date) {
    const iso = formatDateISO(date);
    return compromissos.filter((c) => c.data === iso);
  }

  function eventosNaHora(date: Date, hour: number) {
    return eventosNoDia(date).filter((c) => {
      const h = parseInt(c.hora_inicio.split(":")[0], 10);
      return h === hour;
    });
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header: dias da semana */}
      <div className="grid border-b sticky top-0 bg-white z-10" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
        <div className="border-r" />
        {days.map((d) => (
          <div key={d.toISOString()} className={`text-center py-2.5 border-r last:border-r-0 ${isToday(d) ? "bg-gray-900" : ""}`}>
            <p className={`text-[10px] uppercase font-medium ${isToday(d) ? "text-gray-300" : "text-gray-400"}`}>{formatWeekday(d)}</p>
            <p className={`text-lg font-bold ${isToday(d) ? "text-white" : "text-gray-900"}`}>{d.getDate()}</p>
            <p className={`text-[10px] ${isToday(d) ? "text-gray-400" : "text-gray-300"}`}>{formatDateBR(d)}</p>
          </div>
        ))}
      </div>

      {/* Grade horária */}
      <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
        {HOURS.map((hour) => (
          <div key={hour} className="grid border-b last:border-b-0" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
            <div className="border-r px-2 py-2 flex items-start justify-end">
              <span className="text-[10px] text-gray-400 font-medium -mt-1">{String(hour).padStart(2, "0")}:00</span>
            </div>
            {days.map((d) => {
              const events = eventosNaHora(d, hour);
              const iso = formatDateISO(d);
              return (
                <div
                  key={d.toISOString()}
                  className="border-r last:border-r-0 min-h-[48px] p-0.5 cursor-pointer hover:bg-gray-50/50 transition relative"
                  onClick={() => onSlotClick(iso, `${String(hour).padStart(2, "0")}:00`)}
                >
                  {events.map((ev) => {
                    const cat = getCategoria(ev.categoria);
                    return (
                      <button
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                        className={`w-full text-left rounded-lg px-1.5 py-1 mb-0.5 border-l-[3px] text-[11px] transition hover:opacity-80 active:scale-[0.97] truncate ${cat.bg}`}
                        title={ev.titulo}
                      >
                        <span className="font-semibold truncate block">{ev.titulo}</span>
                        <span className="opacity-60">{ev.hora_inicio.slice(0, 5)}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
