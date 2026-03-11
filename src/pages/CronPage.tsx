import { useState, useEffect, useCallback } from 'react'
import {
  loadCronSlots,
  saveCronSlots,
  fetchCronLogs,
  DEFAULT_SLOTS,
  type CronSlot,
  type CronLog,
} from '@/lib/cron'
import TimePicker from '@/components/TimePicker'

// ── Toggle Switch ──────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-gray-900' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-[22px]' : 'translate-x-[3px]'
        }`}
        style={{ width: 18, height: 18 }}
      />
    </button>
  )
}

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: CronLog['status'] }) {
  if (status === 'success')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        Sucesso
      </span>
    )
  if (status === 'zero')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
        Sem novas
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      Erro
    </span>
  )
}

// ── Slot Card ──────────────────────────────────────────────────────────────────
function SlotCard({ slot, onChange }: { slot: CronSlot; onChange: (updated: CronSlot) => void }) {
  const [newOab, setNewOab] = useState('')
  const [newUf, setNewUf] = useState('')
  const index = slot.slot_index

  function addOab() {
    if (!newOab.trim()) return
    onChange({ ...slot, oabs: [...slot.oabs, { oab: newOab.trim(), uf: newUf.trim().toUpperCase() }] })
    setNewOab('')
    setNewUf('')
  }

  function removeOab(i: number) {
    onChange({ ...slot, oabs: slot.oabs.filter((_, idx) => idx !== i) })
  }

  return (
    <div className={`bg-white rounded-xl border transition-all ${slot.enabled ? 'border-gray-900 shadow-sm' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors flex-shrink-0 ${slot.enabled ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>
            {index + 1}
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${slot.enabled ? 'text-gray-900' : 'text-gray-400'}`}>Horário {index + 1}</p>
            {slot.enabled && slot.oabs.length > 0 && (
              <p className="text-[11px] text-gray-400 truncate">{slot.oabs.length} OAB(s) · às {slot.hora}</p>
            )}
            {slot.enabled && slot.oabs.length === 0 && (
              <p className="text-[11px] text-amber-500">Adicione ao menos uma OAB</p>
            )}
          </div>
        </div>
        <Toggle enabled={slot.enabled} onChange={(v) => onChange({ ...slot, enabled: v })} />
      </div>

      {slot.enabled && (
        <div className="px-4 pb-4 border-t bg-gray-50/50 pt-4 space-y-4">
          <TimePicker
            label="Horário de execução (BRT)"
            value={slot.hora}
            onChange={(h) => onChange({ ...slot, hora: h })}
            className="w-full md:w-36"
          />

          {slot.oabs.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">OABs monitoradas</label>
              <div className="space-y-1.5">
                {slot.oabs.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5">
                    <span className="text-sm font-semibold text-gray-800 flex-1 min-w-0 truncate">
                      {entry.oab}
                      {entry.uf && <span className="ml-2 text-xs font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{entry.uf}</span>}
                    </span>
                    <button onClick={() => removeOab(i)} className="text-gray-300 hover:text-red-400 transition p-1 active:scale-95">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Adicionar OAB</label>
            <div className="flex gap-2">
              <input
                type="text" placeholder="Número OAB" value={newOab} onChange={(e) => setNewOab(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addOab()}
                className="flex-1 min-w-0 px-3 py-2.5 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
              <input
                type="text" placeholder="UF" maxLength={2} value={newUf} onChange={(e) => setNewUf(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && addOab()}
                className="w-16 px-3 py-2.5 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none uppercase"
              />
              <button onClick={addOab} disabled={!newOab.trim()}
                className="px-3 py-2.5 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800 transition disabled:opacity-40 active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Log Card (mobile) ───────────────────────────────────────────────────────
function LogCard({ log }: { log: CronLog }) {
  function formatDate(iso?: string) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-800">{log.oab}</span>
          {log.uf_oab && <span className="ml-1.5 text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{log.uf_oab}</span>}
        </div>
        <StatusBadge status={log.status} />
      </div>
      <div className="space-y-1 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Executado</span>
          <span className="text-gray-700">{formatDate(log.executed_at)}</span>
        </div>
        <div className="flex justify-between">
          <span>Horário</span>
          <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{log.horario}</span>
        </div>
        {log.data_busca && (
          <div className="flex justify-between">
            <span>Data buscada</span>
            <span className="text-gray-700">{new Date(log.data_busca + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
          </div>
        )}
        {log.status !== 'error' && (
          <div className="flex justify-between">
            <span>Resultados</span>
            <span className="text-gray-700">
              {log.total_encontradas} total
              {log.status === 'success' && log.novas > 0 && <span className="ml-1 text-green-600 font-semibold">+{log.novas} novas</span>}
            </span>
          </div>
        )}
      </div>
      {log.erro && <p className="text-[10px] text-red-400 mt-2 truncate" title={log.erro}>{log.erro}</p>}
    </div>
  )
}

// ── Logs Table (desktop) ────────────────────────────────────────────────────
function LogsTable({ logs, loading }: { logs: CronLog[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Carregando...
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium">Nenhuma execução registrada</p>
        <p className="text-xs mt-1">Os logs aparecem aqui após as primeiras buscas</p>
      </div>
    )
  }

  function formatDate(iso?: string) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <div className="md:hidden space-y-2 p-4">
        {logs.map((log, i) => <LogCard key={log.id || i} log={log} />)}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/80">
              <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Executado em</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Agendamento</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">OAB</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Data buscada</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Total</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Novas</th>
              <th className="text-left px-4 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={log.id || i} className="border-b last:border-0 hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(log.executed_at)}</td>
                <td className="px-4 py-3"><span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{log.horario}</span></td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-gray-800">{log.oab}</span>
                  {log.uf_oab && <span className="ml-1.5 text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{log.uf_oab}</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{log.data_busca ? new Date(log.data_busca + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-700">{log.status !== 'error' ? log.total_encontradas : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-right">
                  {log.status === 'success' && log.novas > 0 ? <span className="text-sm font-bold text-green-600">+{log.novas}</span>
                    : log.status !== 'error' ? <span className="text-xs text-gray-400">0</span>
                    : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <StatusBadge status={log.status} />
                    {log.erro && <p className="text-[10px] text-red-400 max-w-[200px] truncate" title={log.erro}>{log.erro}</p>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CronPage() {
  const [slots, setSlots] = useState<CronSlot[]>(DEFAULT_SLOTS.map(s => ({ ...s })))
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [logs, setLogs] = useState<CronLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true)
    const data = await fetchCronLogs()
    setLogs(data)
    setLoadingLogs(false)
  }, [])

  useEffect(() => {
    loadCronSlots().then((data) => { setSlots(data); setLoadingConfig(false) })
    loadLogs()
  }, [loadLogs])

  function updateSlot(updated: CronSlot) {
    setSlots((prev) => prev.map((s) => s.slot_index === updated.slot_index ? updated : s))
    setSaveResult(null)
  }

  async function handleSave() {
    setSaving(true); setSaveResult(null)
    const result = await saveCronSlots(slots)
    setSaving(false)
    if (result.ok) {
      const activeSlots = slots.filter(s => s.enabled && s.oabs.length > 0)
      const totalJobs = activeSlots.reduce((acc, s) => acc + s.oabs.length, 0)
      setSaveResult({ ok: true, msg: `${totalJobs} job(s) agendado(s)` })
    } else {
      setSaveResult({ ok: false, msg: result.erro || 'Erro desconhecido' })
    }
    setTimeout(() => setSaveResult(null), 4000)
  }

  const activeCount = slots.filter((s) => s.enabled && s.oabs.length > 0).length
  const totalOabs = slots.filter(s => s.enabled).reduce((acc, s) => acc + s.oabs.length, 0)

  return (
    <div className="fade-in">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900">Alertas Automáticos</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {activeCount > 0
              ? `${activeCount} horário(s) · ${totalOabs} OAB(s) · servidor`
              : 'Buscas diárias automáticas no servidor'}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loadingConfig}
          className={`flex items-center gap-1.5 px-4 py-2.5 md:py-1.5 rounded-xl text-sm font-medium transition disabled:opacity-50 active:scale-95 flex-shrink-0 ${
            saveResult?.ok === true ? 'bg-green-600 text-white'
              : saveResult?.ok === false ? 'bg-red-600 text-white'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {saving ? (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : saveResult?.ok === true ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
          {saving ? 'Salvando...' : saveResult?.ok === true ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      {saveResult?.ok === false && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-700">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {saveResult.msg}
        </div>
      )}

      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5 text-xs text-emerald-700">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p>
          Buscas agendadas via <strong>pg_cron</strong> no Supabase.
          Executam todos os dias <strong>sem precisar do browser aberto</strong>.
        </p>
      </div>

      {loadingConfig ? (
        <div className="space-y-3 mb-6">
          {[0, 1, 2].map((i) => <div key={i} className="bg-white rounded-xl border h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-3 md:gap-4 md:space-y-0 mb-6">
          {slots.map((slot) => <SlotCard key={slot.slot_index} slot={slot} onChange={updateSlot} />)}
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Histórico de Execuções</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Últimas 100 execuções</p>
          </div>
          <button onClick={loadLogs} className="p-2 -m-1 text-gray-400 hover:text-gray-600 transition active:scale-95" title="Atualizar logs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <LogsTable logs={logs} loading={loadingLogs} />
      </div>
    </div>
  )
}
