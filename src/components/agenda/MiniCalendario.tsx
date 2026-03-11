import { getMonthDays, isToday, isSameDay } from "@/lib/agenda-utils";

interface Props {
  currentDate: Date;
  onSelectDate: (d: Date) => void;
}

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

export default function MiniCalendario({ currentDate, onSelectDate }: Props) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const cells = getMonthDays(year, month);
  const monthLabel = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  function prevMonth() {
    const d = new Date(year, month - 1, 1);
    onSelectDate(d);
  }
  function nextMonth() {
    const d = new Date(year, month + 1, 1);
    onSelectDate(d);
  }

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg active:scale-95">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-xs font-semibold text-gray-700 capitalize">{monthLabel}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg active:scale-95">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-[10px] text-gray-400 font-medium py-1">{w}</span>
        ))}
        {cells.map((cell, i) => (
          <button
            key={i}
            disabled={!cell}
            onClick={() => cell && onSelectDate(cell)}
            className={`text-[11px] w-7 h-7 rounded-lg transition font-medium ${
              !cell ? "" :
              isToday(cell) ? "bg-gray-900 text-white" :
              isSameDay(cell, currentDate) ? "bg-gray-200 text-gray-900" :
              "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {cell?.getDate() || ""}
          </button>
        ))}
      </div>
    </div>
  );
}
