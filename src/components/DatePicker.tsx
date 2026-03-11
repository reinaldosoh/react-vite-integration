import { useState, useRef, useEffect } from 'react'

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseYMD(val: string): Date | null {
  if (!val || val.length !== 10) return null
  const [a, m, d] = val.split('-').map(Number)
  return new Date(a, m - 1, d)
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getDaysGrid(mes: number, ano: number) {
  const firstDay = new Date(ano, mes, 1).getDay()
  const totalDias = new Date(ano, mes + 1, 0).getDate()
  const prevTotal = new Date(ano, mes, 0).getDate()
  const cells: { day: number; current: boolean; date: Date }[] = []
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: prevTotal - i, current: false, date: new Date(ano, mes - 1, prevTotal - i) })
  for (let d = 1; d <= totalDias; d++)
    cells.push({ day: d, current: true, date: new Date(ano, mes, d) })
  const rest = 42 - cells.length
  for (let d = 1; d <= rest; d++)
    cells.push({ day: d, current: false, date: new Date(ano, mes + 1, d) })
  return cells
}

interface Props {
  value: string
  onChange: (v: string) => void
  label: string
  required?: boolean
  minWidth?: string
  placeholder?: string
}

export default function DatePicker({ value, onChange, label, placeholder = 'Selecione' }: Props) {
  const selected = parseYMD(value)
  const today = new Date()
  const [open, setOpen] = useState(false)
  const [viewMes, setViewMes] = useState(selected?.getMonth() ?? today.getMonth())
  const [viewAno, setViewAno] = useState(selected?.getFullYear() ?? today.getFullYear())
  const ref = useRef<HTMLDivElement>(null)

  const display = selected
    ? `${String(selected.getDate()).padStart(2, '0')}/${String(selected.getMonth() + 1).padStart(2, '0')}/${selected.getFullYear()}`
    : placeholder

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && selected) {
      setViewMes(selected.getMonth())
      setViewAno(selected.getFullYear())
    }
  }, [open])

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function prevMonth() {
    if (viewMes === 0) { setViewMes(11); setViewAno(viewAno - 1) } else setViewMes(viewMes - 1)
  }
  function nextMonth() {
    if (viewMes === 11) { setViewMes(0); setViewAno(viewAno + 1) } else setViewMes(viewMes + 1)
  }
  function pick(date: Date) { onChange(toYMD(date)); setOpen(false) }

  const cells = getDaysGrid(viewMes, viewAno)

  const calendarContent = (
    <>
      {/* Header nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <button type="button" onClick={prevMonth} className="p-2 -m-1 hover:bg-gray-200 rounded-lg transition active:scale-95">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-900">{MESES[viewMes]} {viewAno}</span>
        <button type="button" onClick={nextMonth} className="p-2 -m-1 hover:bg-gray-200 rounded-lg transition active:scale-95">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {/* Weekdays */}
      <div className="grid grid-cols-7 px-3 pt-3">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">{d}</div>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
        {cells.map((cell, i) => {
          const isSelected = selected && isSameDay(cell.date, selected)
          const isToday = isSameDay(cell.date, today)
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(cell.date)}
              className={`
                h-10 w-10 mx-auto rounded-xl text-sm font-medium transition flex items-center justify-center active:scale-95
                ${!cell.current ? 'text-gray-300' : 'text-gray-700'}
                ${isSelected ? '!bg-gray-900 !text-white' : 'hover:bg-gray-100 active:bg-gray-200'}
                ${isToday && !isSelected ? 'ring-1 ring-gray-900 ring-inset' : ''}
              `}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
      {/* Footer */}
      <div className="border-t px-4 py-3 flex justify-between items-center">
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-400 font-medium">Cancelar</button>
        <button type="button" onClick={() => pick(today)} className="text-sm font-semibold text-gray-900 bg-gray-100 px-4 py-1.5 rounded-lg active:bg-gray-200">Hoje</button>
      </div>
    </>
  )

  return (
    <div ref={ref} className="flex-1 relative min-w-0">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 w-full px-3 py-2.5 border rounded-lg bg-white cursor-pointer hover:border-gray-400 transition text-left focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={`text-sm truncate ${selected ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{display}</span>
        </div>
        <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Mobile: bottom sheet */}
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div className="bg-white rounded-t-2xl slide-up max-h-[85vh] overflow-hidden" style={{ paddingBottom: 'var(--safe-bottom)' }}>
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-1" />
              {calendarContent}
            </div>
          </div>
          {/* Desktop: dropdown */}
          <div className="hidden md:block absolute z-50 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl w-[300px] overflow-hidden fade-in">
            {calendarContent}
          </div>
        </>
      )}
    </div>
  )
}
