import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday as fnsIsToday,
  isSameDay as fnsIsSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentDate: Date;
  onSelectDate: (d: Date) => void;
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function MiniCalendario({ currentDate, onSelectDate }: Props) {
  const dias = useMemo(() => {
    const inicio = startOfMonth(currentDate);
    const fim = endOfMonth(currentDate);
    const diasMes = eachDayOfInterval({ start: inicio, end: fim });
    const primeiroDia = getDay(inicio);
    const padding: (Date | null)[] = Array(primeiroDia).fill(null);

    // Trailing days from next month
    const totalCells = padding.length + diasMes.length;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    const trailing: (Date | null)[] = Array(remaining).fill(null);

    return [...padding, ...diasMes, ...trailing];
  }, [currentDate]);

  const mesLabel = format(currentDate, "MMMM yyyy", { locale: ptBR });

  // Find selected week row
  const selectedIndex = dias.findIndex(
    (d) => d && fnsIsSameDay(d, currentDate)
  );
  const selectedRow = selectedIndex >= 0 ? Math.floor(selectedIndex / 7) : -1;

  // Build rows
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < dias.length; i += 7) {
    rows.push(dias.slice(i, i + 7));
  }

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onSelectDate(subMonths(currentDate, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground capitalize min-w-[120px] text-center">
          {mesLabel}
        </span>
        <button
          onClick={() => onSelectDate(addMonths(currentDate, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="text-center text-[11px] text-muted-foreground py-1 font-medium"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="space-y-0.5">
        {rows.map((row, rowIdx) => {
          const isSelectedRow = rowIdx === selectedRow;
          return (
            <div
              key={rowIdx}
              className={`grid grid-cols-7 gap-1 rounded-md transition-colors ${
                isSelectedRow ? "bg-primary/10" : ""
              }`}
            >
              {row.map((dia, colIdx) => {
                if (!dia) {
                  return (
                    <div
                      key={`empty-${rowIdx}-${colIdx}`}
                      className="aspect-square"
                    />
                  );
                }

                const today = fnsIsToday(dia);
                const selected = fnsIsSameDay(dia, currentDate);

                return (
                  <button
                    key={format(dia, "yyyy-MM-dd")}
                    onClick={() => onSelectDate(dia)}
                    className={`aspect-square flex items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      today
                        ? "bg-primary text-primary-foreground font-bold"
                        : selected
                        ? "bg-primary/20 text-foreground font-semibold"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {format(dia, "d")}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
