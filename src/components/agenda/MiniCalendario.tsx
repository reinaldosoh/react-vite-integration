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
    onSelectDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    onSelectDate(new Date(year, month + 1, 1));
  }

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition active:scale-90"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-800 capitalize tracking-tight">
          {monthLabel.replace(/^./, c => c.toUpperCase())}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition active:scale-90"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="flex items-center justify-center h-8">
            <span className="text-xs font-medium text-gray-400">{w}</span>
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={i} className="h-9" />;
          }

          const today = isToday(cell);
          const selected = !today && isSameDay(cell, currentDate);

          return (
            <div key={i} className="flex items-center justify-center h-9">
              <button
                onClick={() => onSelectDate(cell)}
                className={`w-8 h-8 rounded-full text-[13px] font-medium transition-all duration-150 ${
                  today
                    ? "bg-gray-900 text-white shadow-sm"
                    : selected
                    ? "bg-gray-100 text-gray-900 ring-1 ring-gray-300"
                    : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                {cell.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
