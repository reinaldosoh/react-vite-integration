import { supabase } from '@/integrations/supabase/client'

const PROXY_FN = 'api-proxy'

export interface Intimacao {
  id?: string;
  numero_processo: string;
  orgao?: string;
  data_disponibilizacao?: string;
  tipo_comunicacao?: string;
  meio?: string;
  partes?: string[];
  advogados?: string[];
  inteiro_teor?: string;
  tribunal?: string;
  oab?: string;
  _oab?: string;
  created_at?: string;
}

export interface AutomacaoStatus {
  rodando: boolean;
  log: string;
  erro: string | null;
  arquivo_resultado: string | null;
  zero_resultados?: boolean;
}

export interface SyncResult {
  novas: number;
  duplicadas: number;
  duplicadasList: string[];
}

// ── Proxy para EasyPanel (só usado durante busca) ──────────────────────────
async function callProxy(action: string, payload?: Record<string, unknown>) {
  const res = await supabase.functions.invoke(PROXY_FN, {
    body: { action, payload },
  })
  if (res.error) throw new Error(res.error.message)
  return res.data
}

function normalizeOab(value?: string) {
  return (value || '').replace(/\D/g, '')
}

function toDateKey(value?: string): number | null {
  if (!value) return null

  // yyyy-mm-dd
  if (value.includes('-')) {
    const [y, m, d] = value.split('-').map(Number)
    if (!y || !m || !d) return null
    return Date.UTC(y, m - 1, d)
  }

  // dd/mm/yyyy
  if (value.includes('/')) {
    const [d, m, y] = value.split('/').map(Number)
    if (!y || !m || !d) return null
    return Date.UTC(y, m - 1, d)
  }

  return null
}

function isWithinDateRange(dateValue?: string, start?: string, end?: string) {
  const current = toDateKey(dateValue)
  if (current === null) return false

  const startKey = toDateKey(start)
  const endKey = toDateKey(end)

  if (startKey !== null && current < startKey) return false
  if (endKey !== null && current > endKey) return false
  return true
}

export async function iniciarBusca(payload: {
  oab: string;
  uf_oab: string;
  data_inicio: string;
  data_fim: string;
}): Promise<{ ok: boolean; erro?: string }> {
  return await callProxy('buscar', payload)
}

export async function fetchStatus(): Promise<AutomacaoStatus> {
  return await callProxy('status')
}

async function fetchArquivoEspecifico(arquivo: string): Promise<{ consulta?: Record<string, string>; intimacoes?: Intimacao[] }> {
  return await callProxy('consulta', { arquivo })
}

// ── Supabase: leitura ──────────────────────────────────────────────────────
export async function fetchTodasIntimacoes(): Promise<Intimacao[]> {
  const { data, error } = await supabase
    .from('intimacoes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

// ── Supabase: exclusão ─────────────────────────────────────────────────────
export async function deletarIntimacao(id: string): Promise<{ ok: boolean; erro?: string }> {
  const { error } = await supabase
    .from('intimacoes')
    .delete()
    .eq('id', id)
  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}

// ── Limpar arquivo de resultado no EasyPanel após sync ─────────────────────
export async function limparResultadoRemoto(arquivo: string): Promise<void> {
  try {
    await callProxy('deletar', { arquivo })
  } catch {
    // não é crítico se falhar
  }
}

// ── Sync arquivo específico: compara EasyPanel com Supabase, insere SÓ novas
export async function sincronizarNovasIntimacoes(
  arquivo: string,
  filters?: {
    oab?: string;
    data_inicio?: string;
    data_fim?: string;
  }
): Promise<SyncResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const resultado = await fetchArquivoEspecifico(arquivo)
  const consulta = resultado.consulta || {}
  const intimacoesRemoto = resultado.intimacoes || []

  const oabEsperada = normalizeOab(filters?.oab)
  const oabConsulta = normalizeOab(consulta.oab)

  if (oabEsperada && oabConsulta && oabEsperada !== oabConsulta) {
    throw new Error('RESULTADO_DIVERGENTE_DA_BUSCA')
  }

  const oabFiltro = oabEsperada || oabConsulta
  const dataInicioFiltro = filters?.data_inicio || consulta.data_inicio
  const dataFimFiltro = filters?.data_fim || consulta.data_fim

  const intimacoesFiltradas = intimacoesRemoto.filter((i) => {
    const oabItem = normalizeOab(i._oab || i.oab || consulta.oab)
    const matchOab = oabFiltro ? oabItem === oabFiltro : true
    const matchData = isWithinDateRange(i.data_disponibilizacao, dataInicioFiltro, dataFimFiltro)
    return matchOab && matchData
  })

  if (intimacoesFiltradas.length === 0) {
    return { novas: 0, duplicadas: 0, duplicadasList: [] }
  }

  const { data: existentes } = await supabase
    .from('intimacoes')
    .select('numero_processo, tribunal, data_disponibilizacao, orgao')

  const chavesExistentes = new Set(
    (existentes || []).map((e) =>
      `${e.numero_processo}|${e.tribunal}|${e.data_disponibilizacao}|${e.orgao}`
    )
  )

  const novas: Intimacao[] = []
  const duplicadasList: string[] = []

  for (const i of intimacoesFiltradas) {
    const chave = `${i.numero_processo}|${i.tribunal || ''}|${i.data_disponibilizacao || ''}|${i.orgao || ''}`
    if (chavesExistentes.has(chave)) {
      duplicadasList.push(i.numero_processo)
    } else {
      novas.push(i)
    }
  }

  if (novas.length > 0) {
    const rows = novas.map((i) => ({
      user_id: user.id,
      numero_processo: i.numero_processo || '',
      orgao: i.orgao || null,
      data_disponibilizacao: i.data_disponibilizacao || null,
      tipo_comunicacao: i.tipo_comunicacao || null,
      meio: i.meio || null,
      partes: i.partes || null,
      advogados: i.advogados || null,
      inteiro_teor: i.inteiro_teor || null,
      tribunal: i.tribunal || null,
      oab: i._oab || i.oab || consulta.oab || null,
    }))

    const { error } = await supabase.from('intimacoes').upsert(rows, {
      onConflict: 'user_id,numero_processo,tribunal,data_disponibilizacao',
      ignoreDuplicates: true,
    })
    if (error) throw new Error(error.message)
  }

  return {
    novas: novas.length,
    duplicadas: duplicadasList.length,
    duplicadasList,
  }
}
