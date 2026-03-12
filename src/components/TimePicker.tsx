import { useState, useRef, useEffect } from 'react'

function parseHM(val: string): { h: number; m: number } | null {
  const match = val.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  return { h: parseInt(match[1]), m: parseInt(match[2]) }
}
function fmt(n: number) { return String(n).padStart(2, '0') }

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

interface Props {
  value: string
  onChange: (v: string) => void
  label?: string
  className?: string
}

export default function TimePicker({ value, onChange, label, className = '' }: Props) {
  const parsed = parseHM(value)
  const [open, setOpen] = useState(false)
  const [selH, setSelH] = useState(parsed?.h ?? 8)
  const [selM, setSelM] = useState(parsed?.m ?? 0)
  const ref = useRef<HTMLDivElement>(null)
  const hoursRef = useRef<HTMLDivElement>(null)

  const display = parsed ? `${fmt(parsed.h)}:${fmt(parsed.m)}` : '--:--'

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      if (parsed) { setSelH(parsed.h); setSelM(parsed.m) }
      requestAnimationFrame(() => {
        if (hoursRef.current) {
          const sel = hoursRef.current.querySelector('[data-selected="true"]')
          sel?.scrollIntoView({ block: 'center', behavior: 'instant' })
        }
      })
    }
  }, [open])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function confirm() {
    onChange(`${fmt(selH)}:${fmt(selM)}`)
    setOpen(false)
  }

  function selectMinute(m: number) {
    setSelM(m)
    onChange(`${fmt(selH)}:${fmt(m)}`)
    setOpen(false)
  }

  const pickerContent = (
    <>
      <div className="flex flex-1 min-h-0">
        <div ref={hoursRef} className="w-20 border-r overflow-y-auto no-scrollbar">
          <div className="px-2 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider sticky top-0 bg-white z-10">Hora</div>
          {HOURS.map(h => (
            <button
              key={h}
              type="button"
              data-selected={h === selH}
              onClick={() => setSelH(h)}
              className={`w-full text-center py-2.5 text-sm font-medium transition active:scale-95 ${
                h === selH ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {fmt(h)}
            </button>
          ))}
        </div>
        <div className="flex-1 p-3 overflow-y-auto no-scrollbar">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Minuto</div>
          <div className="grid grid-cols-6 gap-1">
            {MINUTES.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => selectMinute(m)}
                className={`py-2.5 rounded-xl text-sm font-medium transition active:scale-95 ${
                  m === selM && selH === (parsed?.h ?? -1) ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                {fmt(m)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t px-4 py-3 flex justify-between items-center">
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-400 font-medium">Cancelar</button>
        <button type="button" onClick={confirm} className="text-sm font-semibold text-white bg-gray-900 px-5 py-1.5 rounded-lg active:bg-gray-700">
          {fmt(selH)}:{fmt(selM)} — OK
        </button>
      </div>
    </>
  )

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 w-full px-3 py-2.5 border rounded-lg bg-white cursor-pointer hover:border-gray-400 transition text-left focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`text-sm ${parsed ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{display}</span>
        </div>
        <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div className="bg-white rounded-t-2xl slide-up flex flex-col max-h-[60vh]" style={{ paddingBottom: 'var(--safe-bottom)' }}>
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-1" />
              {pickerContent}
            </div>
          </div>
          <div className="hidden md:flex flex-col absolute z-50 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl w-[280px] h-[320px] overflow-hidden fade-in">
            {pickerContent}
          </div>
        </>
      )}
    </div>
  )
}
