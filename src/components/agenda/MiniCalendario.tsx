import { getMonthDays, isToday, isSameDay } from "@/lib/agenda-utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentDate: Date;
  onSelectDate: (d: Date) => void;
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

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

  // Find which week row the current date is in to highlight the row
  const dayOfMonth = currentDate.getDate();
  const firstDayIndex = cells.findIndex(c => c && c.getDate() === 1);
  const selectedIndex = cells.findIndex(c => c && isSameDay(c, currentDate));
  const selectedRow = selectedIndex >= 0 ? Math.floor(selectedIndex / 7) : -1;

  // Group cells into rows
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition active:scale-90"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-foreground capitalize tracking-tight">
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition active:scale-90"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="flex items-center justify-center">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{w}</span>
          </div>
        ))}
      </div>

      {/* Days grid - row by row */}
      <div className="space-y-0.5">
        {rows.map((row, rowIdx) => {
          const isSelectedRow = rowIdx === selectedRow;
          return (
            <div
              key={rowIdx}
              className={`grid grid-cols-7 rounded-lg transition-colors ${
                isSelectedRow ? "bg-primary/10" : ""
              }`}
            >
              {row.map((cell, colIdx) => {
                if (!cell) {
                  return (
                    <div key={colIdx} className="flex items-center justify-center h-9">
                      <span className="text-[13px] text-muted-foreground/30 font-medium" />
                    </div>
                  );
                }

                const today = isToday(cell);
                const selected = isSameDay(cell, currentDate);
                const isCurrentMonth = cell.getMonth() === month;

                return (
                  <div key={colIdx} className="flex items-center justify-center h-9">
                    <button
                      onClick={() => onSelectDate(cell)}
                      className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                        today
                          ? "bg-primary text-primary-foreground shadow-sm font-bold"
                          : selected
                          ? "bg-primary/20 text-primary font-semibold"
                          : isCurrentMonth
                          ? "text-foreground hover:bg-muted active:bg-muted/80"
                          : "text-muted-foreground/40"
                      }`}
                    >
                      {cell.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
