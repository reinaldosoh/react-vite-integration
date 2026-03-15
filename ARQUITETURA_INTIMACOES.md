# Arquitetura Completa: Busca, Recebimento e Cadastro de Intimações

Guia autocontido para replicar todo o fluxo em outro projeto.

---

## Visão Geral

```
┌─────────────┐      ┌──────────────────────┐      ┌──────────────────┐
│  Frontend   │ ───► │  Supabase Edge Fn    │ ───► │  EasyPanel       │
│  (React)    │ ◄─── │  "api-proxy"         │ ◄─── │  (Scraper Node)  │
└──────┬──────┘      └──────────────────────┘      └──────────────────┘
       │                                                    │
       │              ┌──────────────────┐                  │
       └────────────► │  Supabase DB     │ ◄── (não salva)──┘
                      │  (intimacoes)    │
                      └──────────────────┘
```

**Fluxo resumido:**
1. Frontend envia `buscar` → Edge Function proxy → EasyPanel inicia scraping
2. Frontend faz polling via `status` a cada 1.5s
3. Quando termina, Frontend baixa JSON via `consulta`
4. Frontend deduplica contra Supabase e faz `upsert`
5. Frontend deleta arquivo remoto via `deletar`

---

## 1. Banco de Dados (Supabase)

### 1.1 Tabela `intimacoes`

```sql
CREATE TABLE public.intimacoes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL,
  numero_processo       text NOT NULL,
  orgao                 text,
  data_disponibilizacao text,
  tipo_comunicacao      text,
  meio                  text,
  partes                text[],
  advogados             text[],
  inteiro_teor          text,
  tribunal              text,
  oab                   text,
  created_at            timestamptz DEFAULT now()
);

-- ⚠️ IMPORTANTE: Unique index com COALESCE
-- Em SQL, NULL != NULL, então um UNIQUE constraint normal não funciona
-- para campos nullable. Usamos COALESCE para tratar NULL como ''.
CREATE UNIQUE INDEX intimacoes_dedup_idx ON intimacoes (
  user_id,
  numero_processo,
  COALESCE(tribunal, ''),
  COALESCE(data_disponibilizacao, ''),
  COALESCE(orgao, '')
);

ALTER TABLE public.intimacoes ENABLE ROW LEVEL SECURITY;
```

### 1.2 Políticas RLS

```sql
CREATE POLICY "Users can view own intimacoes"
  ON public.intimacoes FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intimacoes"
  ON public.intimacoes FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intimacoes"
  ON public.intimacoes FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own intimacoes"
  ON public.intimacoes FOR DELETE
  TO public
  USING (auth.uid() = user_id);
```

---

## 2. Edge Function: `api-proxy`

Esta é a Edge Function Deno que serve de proxy entre o frontend e o scraper no EasyPanel.

### 2.1 Configuração (`supabase/config.toml`)

```toml
project_id = "SEU_PROJECT_ID"

[functions.api-proxy]
verify_jwt = false
```

> `verify_jwt = false` porque validamos manualmente no código.

### 2.2 Secrets necessários

Adicione no painel Supabase (Settings → Edge Functions → Secrets):

| Secret | Descrição |
|--------|-----------|
| `EASYPANEL_API_URL` | URL base do scraper. Ex: `https://scraper.seudominio.com` |

### 2.3 Código completo (`supabase/functions/api-proxy/index.ts`)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EASYPANEL_URL = Deno.env.get("EASYPANEL_API_URL")!;

serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();

    let url: string;
    let method: string;
    let body: string | undefined;

    switch (action) {
      // ── Iniciar busca ──────────────────────────────────────────
      case "buscar":
        url = `${EASYPANEL_URL}/buscar`;
        method = "POST";
        body = JSON.stringify(payload);
        break;

      // ── Polling de status ──────────────────────────────────────
      case "status":
        url = `${EASYPANEL_URL}/status`;
        method = "GET";
        break;

      // ── Baixar resultado específico ────────────────────────────
      case "consulta":
        url = `${EASYPANEL_URL}/consulta/${payload.arquivo}`;
        method = "GET";
        break;

      // ── Deletar arquivo de resultado ───────────────────────────
      case "deletar":
        url = `${EASYPANEL_URL}/deletar/${payload.arquivo}`;
        method = "DELETE";
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) options.body = body;

    const res = await fetch(url, options);
    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## 3. API do Scraper (EasyPanel / Node.js)

O scraper é um serviço separado (Node.js, Python, etc.) hospedado no EasyPanel (ou qualquer servidor). Ele precisa expor **4 endpoints**:

### 3.1 `POST /buscar` — Iniciar busca

**Request:**
```json
{
  "oab": "123456",
  "uf_oab": "SP",
  "data_inicio": "2025-01-01",
  "data_fim": "2025-01-31"
}
```

**Response (200):**
```json
{ "ok": true }
```

**Comportamento:** Inicia o scraping em background. Salva resultado em um arquivo JSON (ex: `resultado_1710000000.json`).

---

### 3.2 `GET /status` — Polling de status

**Response durante busca:**
```json
{
  "rodando": true,
  "log": "Acessando portal...\nBuscando página 1...\n",
  "erro": null,
  "arquivo_resultado": null,
  "zero_resultados": false
}
```

**Response quando termina com sucesso:**
```json
{
  "rodando": false,
  "log": "Concluído. 15 intimações encontradas.",
  "erro": null,
  "arquivo_resultado": "resultado_1710000000.json",
  "zero_resultados": false
}
```

**Response quando termina sem resultados:**
```json
{
  "rodando": false,
  "log": "Concluído. 0 intimações encontradas.",
  "erro": null,
  "arquivo_resultado": null,
  "zero_resultados": true
}
```

**Response quando dá erro:**
```json
{
  "rodando": false,
  "log": "Erro ao acessar portal...",
  "erro": "Timeout ao acessar o portal do CNJ",
  "arquivo_resultado": null,
  "zero_resultados": false
}
```

---

### 3.3 `GET /consulta/:arquivo` — Baixar resultado

**Response (200):**
```json
{
  "consulta": {
    "oab": "123456",
    "uf_oab": "SP",
    "data_inicio": "01/01/2025",
    "data_fim": "31/01/2025"
  },
  "intimacoes": [
    {
      "numero_processo": "0001234-56.2025.8.26.0100",
      "orgao": "2ª Vara Cível",
      "data_disponibilizacao": "15/01/2025",
      "tipo_comunicacao": "Intimação",
      "meio": "Eletrônico",
      "partes": ["JOSÉ DA SILVA", "MARIA OLIVEIRA"],
      "advogados": ["Dr. Fulano OAB/SP 123456"],
      "inteiro_teor": "Texto completo da intimação...",
      "tribunal": "TJSP",
      "_oab": "123456"
    }
  ]
}
```

> O campo `_oab` é a OAB que gerou aquela intimação (útil quando o scraper busca múltiplas OABs).

---

### 3.4 `DELETE /deletar/:arquivo` — Limpar arquivo

**Response (200):**
```json
{ "ok": true }
```

---

### 3.5 Exemplo mínimo do scraper (Node.js / Express)

```javascript
const express = require("express");
const app = express();
app.use(express.json());

let estado = {
  rodando: false,
  log: "",
  erro: null,
  arquivo_resultado: null,
  zero_resultados: false,
};

const resultados = {}; // { "arquivo.json": { consulta, intimacoes } }

app.post("/buscar", (req, res) => {
  const { oab, uf_oab, data_inicio, data_fim } = req.body;
  estado = { rodando: true, log: "Iniciando...\n", erro: null, arquivo_resultado: null, zero_resultados: false };

  // Inicia scraping em background
  (async () => {
    try {
      estado.log += "Acessando portal do CNJ...\n";
      
      // >>> AQUI VAI SUA LÓGICA DE SCRAPING <<<
      // Exemplo: Puppeteer, Playwright, API do tribunal, etc.
      const intimacoes = await fazerScraping(oab, uf_oab, data_inicio, data_fim);

      if (intimacoes.length === 0) {
        estado.rodando = false;
        estado.zero_resultados = true;
        estado.log += "Nenhuma intimação encontrada.\n";
        return;
      }

      const nomeArquivo = `resultado_${Date.now()}.json`;
      resultados[nomeArquivo] = {
        consulta: { oab, uf_oab, data_inicio, data_fim },
        intimacoes,
      };

      estado.rodando = false;
      estado.arquivo_resultado = nomeArquivo;
      estado.log += `Concluído. ${intimacoes.length} intimações encontradas.\n`;
    } catch (err) {
      estado.rodando = false;
      estado.erro = err.message;
      estado.log += `ERRO: ${err.message}\n`;
    }
  })();

  res.json({ ok: true });
});

app.get("/status", (req, res) => {
  res.json(estado);
});

app.get("/consulta/:arquivo", (req, res) => {
  const data = resultados[req.params.arquivo];
  if (!data) return res.status(404).json({ error: "Arquivo não encontrado" });
  res.json(data);
});

app.delete("/deletar/:arquivo", (req, res) => {
  delete resultados[req.params.arquivo];
  res.json({ ok: true });
});

app.listen(3000, () => console.log("Scraper rodando na porta 3000"));
```

---

## 4. Frontend: `src/lib/api.ts`

Código completo das funções de comunicação.

```typescript
import { supabase } from "@/integrations/supabase/client";

const PROXY_FN = "api-proxy";

// ── Tipos ──────────────────────────────────────────────────────────────────────

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
  _oab?: string;       // OAB vinda do scraper (campo interno)
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

// ── Proxy para Edge Function ───────────────────────────────────────────────────

async function callProxy(action: string, payload?: Record<string, unknown>) {
  const res = await supabase.functions.invoke(PROXY_FN, {
    body: { action, payload },
  });
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

// ── Normalização de OAB (remove tudo que não é dígito) ─────────────────────────

function normalizeOab(value?: string) {
  return (value || "").replace(/\D/g, "");
}

// ── Helpers de data ────────────────────────────────────────────────────────────

function toDateKey(value?: string): number | null {
  if (!value) return null;

  // yyyy-mm-dd
  if (value.includes("-")) {
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return null;
    return Date.UTC(y, m - 1, d);
  }

  // dd/mm/yyyy
  if (value.includes("/")) {
    const [d, m, y] = value.split("/").map(Number);
    if (!y || !m || !d) return null;
    return Date.UTC(y, m - 1, d);
  }

  return null;
}

function isWithinDateRange(dateValue?: string, start?: string, end?: string) {
  const current = toDateKey(dateValue);
  if (current === null) return false;

  const startKey = toDateKey(start);
  const endKey = toDateKey(end);

  if (startKey !== null && current < startKey) return false;
  if (endKey !== null && current > endKey) return false;
  return true;
}

// ── Funções públicas ───────────────────────────────────────────────────────────

/** Inicia busca no scraper via proxy */
export async function iniciarBusca(payload: {
  oab: string;
  uf_oab: string;
  data_inicio: string;
  data_fim: string;
}): Promise<{ ok: boolean; erro?: string }> {
  return await callProxy("buscar", payload);
}

/** Consulta status da busca em andamento */
export async function fetchStatus(): Promise<AutomacaoStatus> {
  return await callProxy("status");
}

/** Busca todas as intimações do usuário no Supabase */
export async function fetchTodasIntimacoes(): Promise<Intimacao[]> {
  const { data, error } = await supabase
    .from("intimacoes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

/** Exclui uma intimação do Supabase */
export async function deletarIntimacao(
  id: string
): Promise<{ ok: boolean; erro?: string }> {
  const { error } = await supabase.from("intimacoes").delete().eq("id", id);
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

/** Limpa o arquivo de resultado no EasyPanel após sync */
export async function limparResultadoRemoto(arquivo: string): Promise<void> {
  try {
    await callProxy("deletar", { arquivo });
  } catch {
    // não é crítico se falhar
  }
}

/**
 * Sincroniza intimações do scraper com o Supabase.
 *
 * 1. Baixa o resultado do scraper (arquivo JSON específico)
 * 2. Filtra por OAB e range de datas
 * 3. Compara com registros existentes no Supabase (deduplicação)
 * 4. Insere apenas as novas via upsert
 *
 * ⚠️ ARMADILHA: campos da chave (tribunal, data, orgao) são normalizados
 * com `|| ''` para evitar que null !== '' cause duplicatas.
 */
export async function sincronizarNovasIntimacoes(
  arquivo: string,
  filters?: {
    oab?: string;
    data_inicio?: string;
    data_fim?: string;
  }
): Promise<SyncResult> {
  // 1. Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  // 2. Baixar resultado do scraper
  const resultado = await callProxy("consulta", { arquivo });
  const consulta = resultado.consulta || {};
  const intimacoesRemoto = resultado.intimacoes || [];

  // 3. Validar OAB (evitar resultado de busca diferente)
  const oabEsperada = normalizeOab(filters?.oab);
  const oabConsulta = normalizeOab(consulta.oab);

  if (oabEsperada && oabConsulta && oabEsperada !== oabConsulta) {
    throw new Error("RESULTADO_DIVERGENTE_DA_BUSCA");
  }

  // 4. Determinar filtros efetivos
  const oabFiltro = oabEsperada || oabConsulta;
  const dataInicioFiltro = filters?.data_inicio || consulta.data_inicio;
  const dataFimFiltro = filters?.data_fim || consulta.data_fim;

  // 5. Filtrar intimações por OAB e data
  const intimacoesFiltradas = intimacoesRemoto.filter((i: Intimacao) => {
    const oabItem = normalizeOab(i._oab || i.oab || consulta.oab);
    const matchOab = oabFiltro ? oabItem === oabFiltro : true;
    const matchData = isWithinDateRange(
      i.data_disponibilizacao,
      dataInicioFiltro,
      dataFimFiltro
    );
    return matchOab && matchData;
  });

  if (intimacoesFiltradas.length === 0) {
    return { novas: 0, duplicadas: 0, duplicadasList: [] };
  }

  // 6. Buscar chaves existentes no Supabase
  const { data: existentes } = await supabase
    .from("intimacoes")
    .select("numero_processo, tribunal, data_disponibilizacao, orgao");

  // ⚠️ IMPORTANTE: usar `|| ''` para normalizar null → ''
  // Sem isso, null.toString() vira "null" (string) e nunca bate
  const chavesExistentes = new Set(
    (existentes || []).map(
      (e) =>
        `${e.numero_processo}|${e.tribunal || ""}|${e.data_disponibilizacao || ""}|${e.orgao || ""}`
    )
  );

  // 7. Separar novas vs duplicadas
  const novas: Intimacao[] = [];
  const duplicadasList: string[] = [];

  for (const i of intimacoesFiltradas) {
    const chave = `${i.numero_processo}|${i.tribunal || ""}|${i.data_disponibilizacao || ""}|${i.orgao || ""}`;
    if (chavesExistentes.has(chave)) {
      duplicadasList.push(i.numero_processo);
    } else {
      novas.push(i);
    }
  }

  // 8. Inserir novas no Supabase
  if (novas.length > 0) {
    const rows = novas.map((i) => ({
      user_id: user.id,
      numero_processo: i.numero_processo || "",
      // ⚠️ Campos da chave: normalizar null → '' para bater com o UNIQUE INDEX
      orgao: i.orgao || "",
      data_disponibilizacao: i.data_disponibilizacao || "",
      tribunal: i.tribunal || "",
      // Campos opcionais (podem ser null)
      tipo_comunicacao: i.tipo_comunicacao || null,
      meio: i.meio || null,
      partes: i.partes || null,
      advogados: i.advogados || null,
      inteiro_teor: i.inteiro_teor || null,
      oab: i._oab || i.oab || consulta.oab || null,
    }));

    const { error } = await supabase.from("intimacoes").upsert(rows, {
      onConflict: "user_id,numero_processo,tribunal,data_disponibilizacao",
      ignoreDuplicates: true,
    });
    if (error) throw new Error(error.message);
  }

  return {
    novas: novas.length,
    duplicadas: duplicadasList.length,
    duplicadasList,
  };
}
```

---

## 5. Frontend: Polling com proteção contra race condition

Trecho do `Index.tsx` que implementa o fluxo de busca → polling → sync.

```typescript
import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchTodasIntimacoes,
  iniciarBusca,
  fetchStatus,
  sincronizarNovasIntimacoes,
  limparResultadoRemoto,
  type Intimacao,
} from "@/lib/api";

export default function HomePage() {
  const [intimacoes, setIntimacoes] = useState<Intimacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [logBusca, setLogBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [zeroResultados, setZeroResultados] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncingRef = useRef(false);

  // Guarda os parâmetros da última busca para validação cruzada
  const ultimaBuscaRef = useRef<{
    oab: string;
    data_inicio: string;
    data_fim: string;
  } | null>(null);

  // ── Carregar todas do Supabase ─────────────────────────────────────────────
  async function carregarTodas() {
    try {
      const data = await fetchTodasIntimacoes();
      setIntimacoes(data);
    } catch (e) {
      console.error("Erro ao carregar intimações:", e);
    }
  }

  useEffect(() => {
    carregarTodas();
  }, []);

  // ── Polling ────────────────────────────────────────────────────────────────
  //
  // syncingRef evita que o callback do setInterval execute duas vezes
  // quando o intervalo dispara enquanto a sync anterior ainda está rodando.
  //
  // clearInterval é chamado IMEDIATAMENTE ao detectar rodando: false,
  // antes de qualquer await, para garantir que não haverá re-entry.
  //
  const pollStatus = useCallback(async () => {
    if (syncingRef.current) return; // Guard: sync em andamento

    try {
      const status = await fetchStatus();
      setLogBusca(status.log || "");

      if (!status.rodando) {
        // ⚠️ PARAR POLLING IMEDIATAMENTE (antes de qualquer await)
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        syncingRef.current = true;

        try {
          setLoading(false);

          if (status.erro) {
            setErro(status.erro);
            return;
          }

          if (status.zero_resultados || !status.arquivo_resultado) {
            setZeroResultados(true);
            return;
          }

          // Usar os filtros da busca original para validação
          const filtrosBusca = {
            oab: ultimaBuscaRef.current?.oab,
            data_inicio: ultimaBuscaRef.current?.data_inicio,
            data_fim: ultimaBuscaRef.current?.data_fim,
          };

          // Validar OAB
          const oabDigits = (filtrosBusca.oab || "").replace(/\D/g, "");
          if (!oabDigits) {
            setErro("OAB inválida.");
            return;
          }

          // Sincronizar (deduplica + insere)
          const sync = await sincronizarNovasIntimacoes(
            status.arquivo_resultado,
            filtrosBusca
          );

          // Limpar arquivo remoto
          await limparResultadoRemoto(status.arquivo_resultado);

          // Recarregar lista
          await carregarTodas();

          // Feedback ao usuário
          if (sync.novas > 0) {
            alert(`${sync.novas} nova(s)! ${sync.duplicadas} já existia(m).`);
          } else if (sync.duplicadas > 0) {
            alert(`Todas as ${sync.duplicadas} já existem no sistema.`);
          } else {
            setZeroResultados(true);
          }
        } catch (e: unknown) {
          await carregarTodas();
          const msg =
            e instanceof Error ? e.message : "Erro ao sincronizar resultados";
          setErro(msg);
        } finally {
          syncingRef.current = false;
        }
      }
    } catch {
      /* ignora erros de polling (rede instável) */
    }
  }, []);

  // ── Iniciar busca ──────────────────────────────────────────────────────────
  async function handleBuscar(
    oab: string,
    uf: string,
    inicio: string,
    fim: string
  ) {
    // Limpar OAB (remover caracteres não-numéricos)
    const oabClean = oab.trim().replace(/\D/g, "");
    if (!oabClean) {
      alert("OAB inválida. Digite apenas números.");
      return;
    }

    setLoading(true);
    setErro(null);
    setLogBusca("Iniciando...\n");

    // Salvar parâmetros para validação cruzada posterior
    ultimaBuscaRef.current = {
      oab: oabClean,
      data_inicio: inicio,
      data_fim: fim,
    };

    try {
      const data = await iniciarBusca({
        oab: oabClean,
        uf_oab: uf,
        data_inicio: inicio,
        data_fim: fim,
      });

      if (data.erro) {
        setErro(data.erro);
        setLoading(false);
        return;
      }

      // Iniciar polling a cada 1.5s
      pollingRef.current = setInterval(pollStatus, 1500);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
      setLoading(false);
    }
  }

  // ... resto do componente (UI)
}
```

---

## 6. Armadilhas e Soluções

### 6.1 NULL vs '' (a mais perigosa)

**Problema:** No JavaScript, quando um campo vem como `null` do banco:
```javascript
// e.tribunal é null
`${e.tribunal}` // → "null" (string!)
```
E quando vem do scraper como `undefined`:
```javascript
`${i.tribunal || ''}` // → "" (string vazia)
```
Resultado: `"null"` !== `""` → duplicata!

**Solução:**
- **No JS:** Sempre usar `e.tribunal || ''` na montagem de chaves
- **No SQL:** Usar `COALESCE(tribunal, '')` no unique index

### 6.2 Race condition no polling

**Problema:** `setInterval` pode disparar o callback enquanto a sync anterior ainda está rodando, causando inserções duplicadas.

**Solução:**
```javascript
const syncingRef = useRef(false);

const pollStatus = useCallback(async () => {
  if (syncingRef.current) return; // Guard

  const status = await fetchStatus();
  if (!status.rodando) {
    // PARAR IMEDIATAMENTE (antes de qualquer await)
    clearInterval(pollingRef.current);
    pollingRef.current = null;
    syncingRef.current = true;

    try {
      // ... sync ...
    } finally {
      syncingRef.current = false;
    }
  }
}, []);
```

### 6.3 Divergência de OAB

**Problema:** Se o scraper retorna resultado de uma OAB diferente da buscada (ex: resultado cacheado de busca anterior).

**Solução:** Validar cruzado:
```javascript
if (oabEsperada && oabConsulta && oabEsperada !== oabConsulta) {
  throw new Error("RESULTADO_DIVERGENTE_DA_BUSCA");
}
```

### 6.4 Limite de 1000 rows do Supabase

**Problema:** `supabase.from('intimacoes').select('*')` retorna no máximo 1000 registros por padrão.

**Solução:** Se tiver mais de 1000 intimações, paginar:
```javascript
const { data } = await supabase
  .from("intimacoes")
  .select("numero_processo, tribunal, data_disponibilizacao, orgao")
  .range(0, 9999); // ou paginar
```

---

## 7. Fluxo Completo (9 passos)

```
1. Usuário preenche OAB + UF + datas → clica "Buscar"
2. Frontend chama supabase.functions.invoke("api-proxy", { body: { action: "buscar", payload } })
3. Edge Function repassa POST /buscar para EasyPanel
4. Frontend inicia setInterval(pollStatus, 1500)
5. Cada poll: supabase.functions.invoke("api-proxy", { body: { action: "status" } })
6. Quando rodando === false && arquivo_resultado existe:
   a. clearInterval IMEDIATO
   b. Baixa resultado via action: "consulta"
   c. Filtra por OAB e datas
   d. Busca chaves existentes no Supabase
   e. Compara (deduplicação com || '')
   f. Insere novas via upsert
7. Deleta arquivo remoto via action: "deletar"
8. Recarrega lista do Supabase
9. Exibe feedback (X novas, Y duplicadas)
```

---

## 8. Checklist de implementação

- [ ] Criar tabela `intimacoes` no Supabase com RLS
- [ ] Criar unique index com COALESCE
- [ ] Adicionar secret `EASYPANEL_API_URL` nas Edge Functions
- [ ] Deploy da Edge Function `api-proxy`
- [ ] Implementar scraper com os 4 endpoints
- [ ] Implementar `src/lib/api.ts` com todas as funções
- [ ] Implementar polling no componente React
- [ ] Testar com OAB real
- [ ] Verificar deduplicação (buscar 2x a mesma OAB/período)
