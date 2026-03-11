import { supabase } from '@/integrations/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface OabEntry {
  oab: string
  uf: string
}

export interface CronSlot {
  slot_index: number  // 0, 1, 2
  enabled: boolean
  hora: string        // "HH:MM"
  oabs: OabEntry[]
}

export interface CronLog {
  id?: string
  executed_at?: string
  horario: string
  oab: string
  uf_oab: string
  data_busca: string
  total_encontradas: number
  novas: number
  duplicadas: number
  status: 'success' | 'error' | 'zero'
  erro?: string | null
}

// ── Config padrão ──────────────────────────────────────────────────────────────

export const DEFAULT_SLOTS: CronSlot[] = [
  { slot_index: 0, enabled: false, hora: '08:00', oabs: [] },
  { slot_index: 1, enabled: false, hora: '13:00', oabs: [] },
  { slot_index: 2, enabled: false, hora: '18:00', oabs: [] },
]

// ── Config (Supabase) ──────────────────────────────────────────────────────────

export async function loadCronSlots(): Promise<CronSlot[]> {
  const { data, error } = await supabase
    .from('cron_configs')
    .select('*')
    .order('slot_index')

  if (error || !data || data.length === 0) {
    return DEFAULT_SLOTS.map(s => ({ ...s }))
  }

  return DEFAULT_SLOTS.map((def) => {
    const row = data.find((r) => r.slot_index === def.slot_index)
    if (!row) return { ...def }
    return {
      slot_index: row.slot_index,
      enabled: row.enabled ?? false,
      hora: row.hora,
      oabs: (row.oabs as unknown as OabEntry[]) || [],
    }
  })
}

export async function saveCronSlots(slots: CronSlot[]): Promise<{ ok: boolean; erro?: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, erro: 'Não autenticado' }

  const rows = slots.map((s) => ({
    user_id: user.id,
    slot_index: s.slot_index,
    enabled: s.enabled,
    hora: s.hora,
    oabs: s.oabs as unknown as Record<string, unknown>[],
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('cron_configs')
    .upsert(rows, { onConflict: 'user_id,slot_index' })

  if (error) return { ok: false, erro: error.message }

  const { data: rpcData, error: rpcError } = await supabase.rpc('sync_user_cron_jobs', {
    p_user_id: user.id,
  })

  if (rpcError) return { ok: false, erro: `Config salva, mas erro ao sincronizar cron: ${rpcError.message}` }

  const result = rpcData as unknown as { ok: boolean; jobs_created: number; erro?: string }
  if (!result?.ok) return { ok: false, erro: result?.erro || 'Erro desconhecido na sincronização' }

  return { ok: true }
}

// ── Logs (Supabase) ────────────────────────────────────────────────────────────

export async function fetchCronLogs(): Promise<CronLog[]> {
  const { data, error } = await supabase
    .from('cron_logs')
    .select('*')
    .order('executed_at', { ascending: false })
    .limit(100)
  if (error) return []
  return (data || []) as unknown as CronLog[]
}
