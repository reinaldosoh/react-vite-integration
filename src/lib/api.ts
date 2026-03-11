import { supabase } from './supabase'

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

// ── Sync TODAS: busca /api/todas do EasyPanel, insere no Supabase só as que faltam
export async function sincronizarTodasRemoto(): Promise<SyncResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const remoto: Intimacao[] = await callProxy('todas')
  if (!remoto || remoto.length === 0) {
    return { novas: 0, duplicadas: 0, duplicadasList: [] }
  }

  const { data: existentes } = await supabase
    .from('intimacoes')
    .select('numero_processo, tribunal, data_disponibilizacao')

  const chavesExistentes = new Set(
    (existentes || []).map((e) =>
      `${e.numero_processo}|${e.tribunal}|${e.data_disponibilizacao}`
    )
  )

  const novas: Intimacao[] = []
  const duplicadasList: string[] = []

  for (const i of remoto) {
    const chave = `${i.numero_processo}|${i.tribunal || ''}|${i.data_disponibilizacao || ''}`
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
      oab: i._oab || i.oab || null,
    }))

    const { error } = await supabase.from('intimacoes').insert(rows)
    if (error) throw new Error(error.message)
  }

  return { novas: novas.length, duplicadas: duplicadasList.length, duplicadasList }
}

// ── Sync arquivo específico: compara EasyPanel com Supabase, insere SÓ novas
export async function sincronizarNovasIntimacoes(arquivo: string): Promise<SyncResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // 1. Busca o arquivo específico do EasyPanel
  const resultado = await fetchArquivoEspecifico(arquivo)
  const intimacoesRemoto = resultado.intimacoes || []
  const oab = resultado.consulta?.oab || ''

  if (intimacoesRemoto.length === 0) {
    return { novas: 0, duplicadas: 0, duplicadasList: [] }
  }

  // 2. Busca as chaves existentes no Supabase
  const { data: existentes } = await supabase
    .from('intimacoes')
    .select('numero_processo, tribunal, data_disponibilizacao')

  const chavesExistentes = new Set(
    (existentes || []).map((e) =>
      `${e.numero_processo}|${e.tribunal}|${e.data_disponibilizacao}`
    )
  )

  // 3. Separa novas vs duplicadas
  const novas: Intimacao[] = []
  const duplicadasList: string[] = []

  for (const i of intimacoesRemoto) {
    const chave = `${i.numero_processo}|${i.tribunal || ''}|${i.data_disponibilizacao || ''}`
    if (chavesExistentes.has(chave)) {
      duplicadasList.push(i.numero_processo)
    } else {
      novas.push(i)
    }
  }

  // 4. Insere SOMENTE as novas no Supabase
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
      oab: oab || null,
    }))

    const { error } = await supabase.from('intimacoes').insert(rows)
    if (error) throw new Error(error.message)
  }

  return {
    novas: novas.length,
    duplicadas: duplicadasList.length,
    duplicadasList,
  }
}
