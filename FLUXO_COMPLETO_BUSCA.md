# Fluxo Completo: Do Clique em "Buscar" até o Salvamento no Banco

Este documento descreve **passo a passo, sem resumos**, tudo o que acontece quando o usuário clica no botão "Buscar" na tela de intimações, incluindo todas as URLs chamadas, payloads enviados, lógica de deduplicação e regras de negócio.

---

## Índice

1. [Passo 1 — Usuário clica em "Buscar"](#passo-1--usuário-clica-em-buscar)
2. [Passo 2 — Frontend chama `iniciarBusca()`](#passo-2--frontend-chama-iniciarbusca)
3. [Passo 3 — `callProxy("buscar")` invoca a Edge Function](#passo-3--callproxybuscar-invoca-a-edge-function)
4. [Passo 4 — Edge Function `api-proxy` repassa para o EasyPanel](#passo-4--edge-function-api-proxy-repassa-para-o-easypanel)
5. [Passo 5 — Frontend inicia polling a cada 1.5 segundos](#passo-5--frontend-inicia-polling-a-cada-15-segundos)
6. [Passo 6 — Cada tick do polling: `fetchStatus()`](#passo-6--cada-tick-do-polling-fetchstatus)
7. [Passo 7 — Busca termina: `rodando === false`](#passo-7--busca-termina-rodando--false)
8. [Passo 8 — Baixar o arquivo de resultado: `sincronizarNovasIntimacoes()`](#passo-8--baixar-o-arquivo-de-resultado-sincronizarnovasintimacoes)
9. [Passo 9 — Filtragem por OAB e Data no frontend](#passo-9--filtragem-por-oab-e-data-no-frontend)
10. [Passo 10 — Consultar intimações existentes no Supabase](#passo-10--consultar-intimações-existentes-no-supabase)
11. [Passo 11 — Comparação: Deduplicação no JavaScript](#passo-11--comparação-deduplicação-no-javascript)
12. [Passo 12 — Inserir apenas as novas no Supabase via `upsert`](#passo-12--inserir-apenas-as-novas-no-supabase-via-upsert)
13. [Passo 13 — Deduplicação no banco: UNIQUE INDEX com COALESCE](#passo-13--deduplicação-no-banco-unique-index-com-coalesce)
14. [Passo 14 — Limpar arquivo de resultado no EasyPanel](#passo-14--limpar-arquivo-de-resultado-no-easypanel)
15. [Passo 15 — Recarregar lista e exibir toast](#passo-15--recarregar-lista-e-exibir-toast)
16. [Proteção contra Race Condition](#proteção-contra-race-condition)
17. [Resumo das URLs chamadas em ordem](#resumo-das-urls-chamadas-em-ordem)

---

## Passo 1 — Usuário clica em "Buscar"

O usuário preenche os campos:
- **OAB**: número da OAB (ex: `12402`)
- **UF**: estado da OAB (ex: `MS`)
- **Data início**: data no formato `yyyy-mm-dd` (ex: `2026-03-13`)
- **Data fim**: data no formato `yyyy-mm-dd` (ex: `2026-03-13`)

Ao clicar em "Buscar", a função `handleBuscar` é chamada no componente `HomePage` (arquivo `src/pages/Index.tsx`):

```typescript
async function handleBuscar(oab: string, uf: string, inicio: string, fim: string) {
  // 1. Limpa a OAB removendo tudo que não é dígito
  const oabClean = oab.trim().replace(/\D/g, '');

  // 2. Se ficou vazio, mostra erro e para
  if (!oabClean) {
    showToastMsg('OAB inválida. Digite apenas números.');
    return;
  }

  // 3. Fecha o modal de busca, ativa o loading, limpa erros anteriores
  setShowBusca(false);
  setLoading(true);
  setErro(null);
  setLogBusca("Iniciando...\n");

  // 4. Guarda os parâmetros da busca atual em uma ref (para usar depois na deduplicação)
  ultimaBuscaRef.current = { oab: oabClean, data_inicio: inicio, data_fim: fim };

  try {
    // 5. Chama a função iniciarBusca do api.ts
    const data = await iniciarBusca({ oab: oabClean, uf_oab: uf, data_inicio: inicio, data_fim: fim });

    // 6. Se o scraper retornou erro, mostra e para
    if (data.erro) { setErro(data.erro); setLoading(false); return; }

    // 7. Se deu certo, inicia o polling a cada 1500ms (1.5 segundos)
    pollingRef.current = setInterval(pollStatus, 1500);
  } catch (e: unknown) {
    setErro(e instanceof Error ? e.message : "Erro desconhecido");
    setLoading(false);
  }
}
```

---

## Passo 2 — Frontend chama `iniciarBusca()`

A função `iniciarBusca` fica no arquivo `src/lib/api.ts`:

```typescript
export async function iniciarBusca(payload: {
  oab: string;
  uf_oab: string;
  data_inicio: string;
  data_fim: string;
}): Promise<{ ok: boolean; erro?: string }> {
  return await callProxy('buscar', payload)
}
```

Ela simplesmente chama `callProxy` passando a action `"buscar"` e o payload com os 4 campos.

---

## Passo 3 — `callProxy("buscar")` invoca a Edge Function

A função `callProxy` fica no mesmo arquivo `src/lib/api.ts`:

```typescript
const PROXY_FN = 'api-proxy'

async function callProxy(action: string, payload?: Record<string, unknown>) {
  const res = await supabase.functions.invoke(PROXY_FN, {
    body: { action, payload },
  })
  if (res.error) throw new Error(res.error.message)
  return res.data
}
```

O que acontece aqui:

1. O SDK do Supabase faz um `POST` para a URL da Edge Function
2. A URL completa chamada é:

```
POST https://daqzshzstzatrksdbauk.supabase.co/functions/v1/api-proxy
```

3. Os headers enviados automaticamente pelo SDK incluem:
   - `apikey`: a anon key do Supabase (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcXpzaHpzdHphdHJrc2RiYXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODMwMjAsImV4cCI6MjA4ODc1OTAyMH0.MoSG5OvxX_1E-MbxN6eNw7ES2Dw74w1czKpYcdicF_s`)
   - `authorization`: `Bearer <jwt_token_do_usuario_logado>`
   - `content-type`: `application/json`
   - `x-client-info`: `supabase-js-web/2.99.1`

4. O body enviado é:

```json
{
  "action": "buscar",
  "payload": {
    "oab": "12402",
    "uf_oab": "MS",
    "data_inicio": "2026-03-13",
    "data_fim": "2026-03-13"
  }
}
```

---

## Passo 4 — Edge Function `api-proxy` repassa para o EasyPanel

A Edge Function `api-proxy` (Deno, rodando no Supabase) recebe o request e faz o seguinte:

```typescript
const EASYPANEL_URL = Deno.env.get("EASYPANEL_API_URL")!;
// Valor atual do secret: https://reinaldo-intimacoes.sw5bxa.easypanel.host/api
```

Quando a action é `"buscar"`:

```typescript
case "buscar":
  url = `${EASYPANEL_URL}/buscar`;
  method = "POST";
  body = JSON.stringify(payload);
  break;
```

Então a Edge Function faz:

```
POST https://reinaldo-intimacoes.sw5bxa.easypanel.host/api/buscar
Content-Type: application/json

{
  "oab": "12402",
  "uf_oab": "MS",
  "data_inicio": "2026-03-13",
  "data_fim": "2026-03-13"
}
```

O scraper no EasyPanel recebe isso, inicia o processo de scraping do site `comunica.pje.jus.br` e retorna imediatamente:

```json
{
  "ok": true
}
```

A Edge Function repassa essa resposta de volta pro frontend.

---

## Passo 5 — Frontend inicia polling a cada 1.5 segundos

De volta ao `handleBuscar`, após receber `{ ok: true }`:

```typescript
pollingRef.current = setInterval(pollStatus, 1500);
```

Isso cria um `setInterval` que chama a função `pollStatus` a cada 1500 milissegundos (1.5 segundos). A referência do interval é guardada em `pollingRef` para poder ser limpa depois.

---

## Passo 6 — Cada tick do polling: `fetchStatus()`

A cada 1.5 segundos, a função `pollStatus` é executada. Ela chama `fetchStatus()`:

```typescript
export async function fetchStatus(): Promise<AutomacaoStatus> {
  return await callProxy('status')
}
```

Isso faz outro `POST` para a Edge Function:

```
POST https://daqzshzstzatrksdbauk.supabase.co/functions/v1/api-proxy
Content-Type: application/json

{
  "action": "status"
}
```

A Edge Function traduz para:

```
GET https://reinaldo-intimacoes.sw5bxa.easypanel.host/api/status
```

O scraper retorna o estado atual. Enquanto está rodando:

```json
{
  "rodando": true,
  "log": "Iniciando automação...\n[1/5] Criando driver do Chrome...\n",
  "erro": null,
  "arquivo_resultado": null,
  "zero_resultados": false
}
```

O frontend atualiza o log na tela com `setLogBusca(status.log)`.

Se `status.rodando === true`, não faz mais nada. Espera o próximo tick de 1.5 segundos.

---

## Passo 7 — Busca termina: `rodando === false`

Quando o scraper termina, o status muda para:

```json
{
  "rodando": false,
  "log": "... log completo ...",
  "erro": null,
  "arquivo_resultado": "intimacoes_OAB12402_2026-03-13_2026-03-13_20260315_193157.json",
  "zero_resultados": false
}
```

No `pollStatus`, ao detectar `!status.rodando`:

```typescript
if (!status.rodando) {
  // 1. PARA o polling IMEDIATAMENTE
  if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }

  // 2. Marca que está sincronizando (impede re-entrada)
  syncingRef.current = true;

  try {
    setLoading(false);

    // 3. Se houve erro no scraper, mostra e para
    if (status.erro) {
      setErro(status.erro);
      return;
    }

    // 4. Se não encontrou nada, mostra mensagem
    if (status.zero_resultados || !status.arquivo_resultado) {
      setZeroResultados(true);
      return;
    }

    // 5. Monta os filtros usando os parâmetros da busca original (guardados na ref)
    const filtrosBusca = {
      oab: ultimaBuscaRef.current?.oab,
      data_inicio: ultimaBuscaRef.current?.data_inicio,
      data_fim: ultimaBuscaRef.current?.data_fim,
    };

    // 6. Valida que a OAB tem dígitos
    const oabDigits = (filtrosBusca.oab || '').replace(/\D/g, '');
    if (!oabDigits) {
      setErro('OAB inválida. Verifique o campo e tente novamente.');
      return;
    }

    // 7. Chama a sincronização (download + deduplicação + insert)
    const sync = await sincronizarNovasIntimacoes(status.arquivo_resultado, filtrosBusca);

    // 8. Limpa o arquivo no EasyPanel
    await limparResultadoRemoto(status.arquivo_resultado);

    // 9. Recarrega todas as intimações do banco
    await carregarTodas();

    // 10. Mostra toast com resultado
    if (sync.novas > 0) showToastMsg(`${sync.novas} nova(s) intimação(ões)! ${sync.duplicadas} já existia(m).`);
    else if (sync.duplicadas > 0) showToastMsg(`Todas as ${sync.duplicadas} intimação(ões) já existem no sistema.`);
    else setZeroResultados(true);
  } catch (e: unknown) {
    await carregarTodas();
    const msg = e instanceof Error ? e.message : "Erro ao sincronizar resultados";
    if (msg.toLowerCase().includes("não autenticado") || msg.toLowerCase().includes("jwt")) {
      setErro("Sessão expirada. Faça login novamente para salvar os resultados.");
    } else {
      setErro(msg);
    }
  } finally {
    syncingRef.current = false;
  }
}
```

---

## Passo 8 — Baixar o arquivo de resultado: `sincronizarNovasIntimacoes()`

A função `sincronizarNovasIntimacoes` (arquivo `src/lib/api.ts`) faz a primeira chamada interna para baixar o JSON do EasyPanel:

```typescript
export async function sincronizarNovasIntimacoes(
  arquivo: string,
  filters?: {
    oab?: string;
    data_inicio?: string;
    data_fim?: string;
  }
): Promise<SyncResult> {
  // 1. Verifica se o usuário está autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // 2. Baixa o arquivo JSON do EasyPanel via proxy
  const resultado = await fetchArquivoEspecifico(arquivo)
  const consulta = resultado.consulta || {}
  const intimacoesRemoto = resultado.intimacoes || []
```

A chamada `fetchArquivoEspecifico(arquivo)` faz:

```typescript
async function fetchArquivoEspecifico(arquivo: string): Promise<{ consulta?: Record<string, string>; intimacoes?: Intimacao[] }> {
  return await callProxy('consulta', { arquivo })
}
```

Que resulta em:

```
POST https://daqzshzstzatrksdbauk.supabase.co/functions/v1/api-proxy
Content-Type: application/json

{
  "action": "consulta",
  "payload": {
    "arquivo": "intimacoes_OAB12402_2026-03-13_2026-03-13_20260315_193157.json"
  }
}
```

A Edge Function traduz para:

```
GET https://reinaldo-intimacoes.sw5bxa.easypanel.host/api/consulta?arquivo=intimacoes_OAB12402_2026-03-13_2026-03-13_20260315_193157.json
```

O EasyPanel retorna o JSON completo com todas as intimações encontradas:

```json
{
  "consulta": {
    "oab": "12402",
    "data_inicio": "2026-03-13",
    "data_fim": "2026-03-13",
    "data_extracao": "2026-03-15T19:31:57.982481",
    "total_intimacoes": 13
  },
  "intimacoes": [
    {
      "numero": 1,
      "numero_processo": "0026284-14.2025.5.24.0022",
      "orgao": "2ª Vara do Trabalho de Dourados",
      "data_disponibilizacao": "13/03/2026",
      "tipo_comunicacao": "Intimação",
      "meio": "Diário de Justiça Eletrônico Nacional",
      "partes": ["BELMIRO BORTOLIN", "CAED LOGISTICA E TRANSPORTES LTDA"],
      "advogados": ["ETHEL ELEONORA MIGUEL FERNANDO - OAB MS-12402"],
      "inteiro_teor": "PODER JUDICIÁRIO  JUSTIÇA DO TRABALHO ...",
      "tribunal": "TRT24"
    },
    {
      "numero": 2,
      "numero_processo": "0024470-30.2026.5.24.0022",
      "orgao": "2ª Vara do Trabalho de Dourados",
      "data_disponibilizacao": "13/03/2026",
      "tipo_comunicacao": "Intimação",
      "meio": "Diário de Justiça Eletrônico Nacional",
      "partes": ["ADELAIDE FERNANDES DE SOUZA MATOS", "ATACADAO S.A.", "IDEAL GUARDIAN SEGURANCA LTDA - ME"],
      "advogados": ["ETHEL ELEONORA MIGUEL FERNANDO - OAB MS-12402"],
      "inteiro_teor": "PODER JUDICIÁRIO  JUSTIÇA DO TRABALHO ...",
      "tribunal": "TRT24"
    }
  ]
}
```

---

## Passo 9 — Filtragem por OAB e Data no frontend

Após receber as intimações do EasyPanel, o código faz uma verificação de segurança e filtragem:

```typescript
  // 3. Normaliza a OAB esperada (remove tudo que não é dígito)
  const oabEsperada = normalizeOab(filters?.oab)    // ex: "12402"
  const oabConsulta = normalizeOab(consulta.oab)      // ex: "12402"

  // 4. Verifica se o resultado é da mesma OAB que foi buscada
  //    Se não for, lança erro (proteção contra resultado de outra busca)
  if (oabEsperada && oabConsulta && oabEsperada !== oabConsulta) {
    throw new Error('RESULTADO_DIVERGENTE_DA_BUSCA')
  }

  // 5. Define os filtros finais (prioriza o que o usuário digitou, senão usa o que veio do JSON)
  const oabFiltro = oabEsperada || oabConsulta
  const dataInicioFiltro = filters?.data_inicio || consulta.data_inicio
  const dataFimFiltro = filters?.data_fim || consulta.data_fim

  // 6. Filtra as intimações por OAB e por range de data
  const intimacoesFiltradas = intimacoesRemoto.filter((i) => {
    // Cada intimação pode ter _oab, oab, ou herdar do consulta.oab
    const oabItem = normalizeOab(i._oab || i.oab || consulta.oab)
    const matchOab = oabFiltro ? oabItem === oabFiltro : true

    // Verifica se a data_disponibilizacao está dentro do range
    const matchData = isWithinDateRange(i.data_disponibilizacao, dataInicioFiltro, dataFimFiltro)

    return matchOab && matchData
  })
```

A função `normalizeOab` remove tudo que não é dígito:

```typescript
function normalizeOab(value?: string) {
  return (value || '').replace(/\D/g, '')
}
```

A função `isWithinDateRange` converte datas em timestamps UTC e compara:

```typescript
function toDateKey(value?: string): number | null {
  if (!value) return null

  // Formato yyyy-mm-dd (usado pelo frontend)
  if (value.includes('-')) {
    const [y, m, d] = value.split('-').map(Number)
    if (!y || !m || !d) return null
    return Date.UTC(y, m - 1, d)
  }

  // Formato dd/mm/yyyy (usado pelo scraper/EasyPanel)
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
```

Se após a filtragem não sobrar nenhuma intimação, retorna imediatamente:

```typescript
  if (intimacoesFiltradas.length === 0) {
    return { novas: 0, duplicadas: 0, duplicadasList: [] }
  }
```

---

## Passo 10 — Consultar intimações existentes no Supabase

Agora o código precisa saber o que já existe no banco para não duplicar. Faz uma query no Supabase:

```typescript
  const { data: existentes } = await supabase
    .from('intimacoes')
    .select('numero_processo, tribunal, data_disponibilizacao, orgao')
```

Isso resulta em:

```
GET https://daqzshzstzatrksdbauk.supabase.co/rest/v1/intimacoes?select=numero_processo,tribunal,data_disponibilizacao,orgao
Authorization: Bearer <jwt_do_usuario>
apikey: <anon_key>
```

Retorna todas as intimações do usuário logado (filtradas por RLS), apenas com as 4 colunas necessárias para comparação:

```json
[
  {"numero_processo":"0802902-79.2024.8.18.0031","tribunal":"TJPI","data_disponibilizacao":"12/03/2026","orgao":"3ª Vara Cível da Comarca de Parnaíba"},
  {"numero_processo":"0000249-33.2022.5.22.0101","tribunal":"TRT22","data_disponibilizacao":"12/03/2026","orgao":"Vara do Trabalho de Parnaíba"},
  {"numero_processo":"0801566-11.2025.8.10.0069","tribunal":"TJMA","data_disponibilizacao":"12/03/2026","orgao":"2ª Vara de Araioses"}
]
```

---

## Passo 11 — Comparação: Deduplicação no JavaScript

O código monta um `Set` com chaves compostas de 4 campos, usando `|` como separador:

```typescript
  // Monta um Set com as chaves de TODAS as intimações que já existem no banco
  const chavesExistentes = new Set(
    (existentes || []).map((e) =>
      `${e.numero_processo}|${e.tribunal || ''}|${e.data_disponibilizacao || ''}|${e.orgao || ''}`
    )
  )
```

Exemplo de chaves no Set:

```
"0802902-79.2024.8.18.0031|TJPI|12/03/2026|3ª Vara Cível da Comarca de Parnaíba"
"0000249-33.2022.5.22.0101|TRT22|12/03/2026|Vara do Trabalho de Parnaíba"
"0801566-11.2025.8.10.0069|TJMA|12/03/2026|2ª Vara de Araioses"
```

Depois percorre cada intimação que veio do EasyPanel e compara:

```typescript
  const novas: Intimacao[] = []
  const duplicadasList: string[] = []

  for (const i of intimacoesFiltradas) {
    // Monta a mesma chave composta para a intimação que veio do EasyPanel
    const chave = `${i.numero_processo}|${i.tribunal || ''}|${i.data_disponibilizacao || ''}|${i.orgao || ''}`

    if (chavesExistentes.has(chave)) {
      // Se a chave já existe no Set, é duplicada — não insere
      duplicadasList.push(i.numero_processo)
    } else {
      // Se a chave NÃO existe no Set, é nova — vai inserir
      novas.push(i)
    }
  }
```

**A regra de deduplicação é:**

Uma intimação é considerada **duplicada** se já existe no banco uma outra intimação com os mesmos 4 campos:
1. `numero_processo` (ex: `0026284-14.2025.5.24.0022`)
2. `tribunal` (ex: `TRT24`)
3. `data_disponibilizacao` (ex: `13/03/2026`)
4. `orgao` (ex: `2ª Vara do Trabalho de Dourados`)

Se **qualquer um** dos 4 campos for diferente, é considerada uma intimação nova.

**Atenção com campos nulos/vazios:** quando o campo é `null` ou `undefined`, o JavaScript converte para string vazia `''` usando `|| ''`. Isso é importante porque no banco o campo pode ser `null`, mas na comparação precisa ser consistente.

---

## Passo 12 — Inserir apenas as novas no Supabase via `upsert`

Se existem intimações novas, o código monta as rows e faz o `upsert`:

```typescript
  if (novas.length > 0) {
    const rows = novas.map((i) => ({
      user_id: user.id,                              // ID do usuário logado
      numero_processo: i.numero_processo || '',       // Nunca null, sempre string
      orgao: i.orgao || '',                           // Nunca null, sempre string
      data_disponibilizacao: i.data_disponibilizacao || '',  // Nunca null, sempre string
      tipo_comunicacao: i.tipo_comunicacao || null,    // Pode ser null
      meio: i.meio || null,                           // Pode ser null
      partes: i.partes || null,                       // Array ou null
      advogados: i.advogados || null,                 // Array ou null
      inteiro_teor: i.inteiro_teor || null,           // Texto ou null
      tribunal: i.tribunal || '',                     // Nunca null, sempre string
      oab: i._oab || i.oab || consulta.oab || null,  // Prioridade: _oab > oab > consulta.oab
    }))

    const { error } = await supabase.from('intimacoes').upsert(rows, {
      onConflict: 'user_id,numero_processo,tribunal,data_disponibilizacao',
      ignoreDuplicates: true,
    })
    if (error) throw new Error(error.message)
  }
```

Isso resulta em:

```
POST https://daqzshzstzatrksdbauk.supabase.co/rest/v1/intimacoes?on_conflict=user_id,numero_processo,tribunal,data_disponibilizacao&columns="user_id","numero_processo","orgao","data_disponibilizacao","tipo_comunicacao","meio","partes","advogados","inteiro_teor","tribunal","oab"
Authorization: Bearer <jwt_do_usuario>
apikey: <anon_key>
Content-Type: application/json
Prefer: resolution=ignore-duplicates

[
  {
    "user_id": "a70c71c7-a395-435f-9069-de72c065ca79",
    "numero_processo": "0026284-14.2025.5.24.0022",
    "orgao": "2ª Vara do Trabalho de Dourados",
    "data_disponibilizacao": "13/03/2026",
    "tipo_comunicacao": "Intimação",
    "meio": "Diário de Justiça Eletrônico Nacional",
    "partes": ["BELMIRO BORTOLIN", "CAED LOGISTICA E TRANSPORTES LTDA"],
    "advogados": ["ETHEL ELEONORA MIGUEL FERNANDO - OAB MS-12402"],
    "inteiro_teor": "PODER JUDICIÁRIO  JUSTIÇA DO TRABALHO ...",
    "tribunal": "TRT24",
    "oab": "12402"
  },
  {
    "user_id": "a70c71c7-a395-435f-9069-de72c065ca79",
    "numero_processo": "0024470-30.2026.5.24.0022",
    "orgao": "2ª Vara do Trabalho de Dourados",
    "data_disponibilizacao": "13/03/2026",
    "tipo_comunicacao": "Intimação",
    "meio": "Diário de Justiça Eletrônico Nacional",
    "partes": ["ADELAIDE FERNANDES DE SOUZA MATOS", "ATACADAO S.A.", "IDEAL GUARDIAN SEGURANCA LTDA - ME"],
    "advogados": ["ETHEL ELEONORA MIGUEL FERNANDO - OAB MS-12402"],
    "inteiro_teor": "PODER JUDICIÁRIO  JUSTIÇA DO TRABALHO ...",
    "tribunal": "TRT24",
    "oab": "12402"
  }
]
```

**Parâmetros do upsert:**
- `onConflict: 'user_id,numero_processo,tribunal,data_disponibilizacao'` → se já existir uma row com esses 4 campos iguais, não atualiza
- `ignoreDuplicates: true` → se conflitar, simplesmente ignora (não dá erro, não sobrescreve)

O Supabase retorna `201 Created` para as novas e silenciosamente ignora as duplicadas.

---

## Passo 13 — Deduplicação no banco: UNIQUE INDEX com COALESCE

Além da deduplicação no JavaScript (Passo 11), o banco tem uma segunda camada de proteção. A tabela `intimacoes` tem um `UNIQUE INDEX`:

```sql
CREATE UNIQUE INDEX idx_intimacoes_dedup
ON intimacoes (
  user_id,
  COALESCE(numero_processo, ''),
  COALESCE(tribunal, ''),
  COALESCE(data_disponibilizacao, '')
);
```

**Por que COALESCE?**

No PostgreSQL, `NULL != NULL`. Ou seja, se `tribunal` for `NULL` em duas rows, o banco **não** considera como duplicata. O `COALESCE` converte `NULL` para string vazia `''`, garantindo que:
- `NULL` e `''` são tratados como a mesma coisa
- Duas intimações com `tribunal = NULL` e `tribunal = ''` são consideradas duplicatas

**Fluxo de deduplicação duplo:**

1. **JavaScript (Passo 11)**: compara as intimações do EasyPanel com as do banco e separa novas vs duplicadas. Isso evita enviar dados desnecessários ao banco.
2. **PostgreSQL (UNIQUE INDEX)**: mesmo se o JavaScript falhar na comparação (race condition, dados inconsistentes), o banco rejeita a inserção duplicada silenciosamente graças ao `ignoreDuplicates: true`.

---

## Passo 14 — Limpar arquivo de resultado no EasyPanel

Após a sincronização, o frontend pede para o EasyPanel deletar o arquivo JSON:

```typescript
export async function limparResultadoRemoto(arquivo: string): Promise<void> {
  try {
    await callProxy('deletar', { arquivo })
  } catch {
    // não é crítico se falhar
  }
}
```

Isso resulta em:

```
POST https://daqzshzstzatrksdbauk.supabase.co/functions/v1/api-proxy
Content-Type: application/json

{
  "action": "deletar",
  "payload": {
    "arquivo": "intimacoes_OAB12402_2026-03-13_2026-03-13_20260315_193157.json"
  }
}
```

A Edge Function traduz para:

```
POST https://reinaldo-intimacoes.sw5bxa.easypanel.host/api/deletar
Content-Type: application/json

{
  "arquivo": "intimacoes_OAB12402_2026-03-13_2026-03-13_20260315_193157.json"
}
```

O EasyPanel retorna:

```json
{
  "ok": true,
  "removidos": [
    "intimacoes_OAB12402_2026-03-13_2026-03-13_20260315_193157.json",
    "intimacoes_OAB12402_2026-03-13_2026-03-13_20260315_193157.csv"
  ]
}
```

Se essa chamada falhar, não é um problema crítico — o arquivo fica lá até a próxima busca sobrescrever.

---

## Passo 15 — Recarregar lista e exibir toast

Após tudo:

```typescript
  // Recarrega TODAS as intimações do banco
  await carregarTodas();
```

Que faz:

```
GET https://daqzshzstzatrksdbauk.supabase.co/rest/v1/intimacoes?select=*&order=created_at.desc
```

E exibe o toast com o resultado:

```typescript
  if (sync.novas > 0)
    showToastMsg(`${sync.novas} nova(s) intimação(ões)! ${sync.duplicadas} já existia(m).`);
  else if (sync.duplicadas > 0)
    showToastMsg(`Todas as ${sync.duplicadas} intimação(ões) já existem no sistema.`);
  else
    setZeroResultados(true);
```

---

## Proteção contra Race Condition

O sistema tem duas proteções para evitar que o polling processe o resultado mais de uma vez:

### 1. `pollingRef` + `clearInterval`

```typescript
const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
```

Quando a busca termina (`rodando === false`), a PRIMEIRA coisa que o código faz é parar o polling:

```typescript
if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
```

### 2. `syncingRef` (guard booleano)

```typescript
const syncingRef = useRef(false);
```

Mesmo após o `clearInterval`, pode haver um tick de polling que já estava "em voo" (a requisição HTTP já saiu). O `syncingRef` bloqueia:

```typescript
const pollStatus = useCallback(async () => {
  // Se já está sincronizando, nem executa
  if (syncingRef.current) return;

  // ... quando detecta que terminou:
  syncingRef.current = true;  // Bloqueia qualquer outro tick

  try {
    // ... faz a sincronização ...
  } finally {
    syncingRef.current = false;  // Libera ao final
  }
}, []);
```

Sem essas proteções, o que acontecia era:
- Tick 1 detecta `rodando === false`, começa a processar
- Tick 2 (já em voo) também detecta `rodando === false`, tenta processar o mesmo arquivo
- Tick 2 dá erro 404 porque o Tick 1 já deletou o arquivo

---

## Resumo das URLs chamadas em ordem

| # | Quem chama | URL completa | Método | Quando |
|---|-----------|-------------|--------|--------|
| 1 | Frontend → Supabase | `POST https://daqzshzstzatrksdbauk.supabase.co/functions/v1/api-proxy` com `action: "buscar"` | POST | Ao clicar Buscar |
| 2 | Edge Function → EasyPanel | `POST https://reinaldo-intimacoes.sw5bxa.easypanel.host/api/buscar` | POST | Imediato (proxy) |
| 3 | Frontend → Supabase | `POST https://daqzshzstzatrksdbauk.supabase.co/functions/v1/api-proxy` com `action: "status"` | POST | A cada 1.5s |
| 4 | Edge Function → EasyPanel | `GET https://reinaldo-intimacoes.sw5bxa.easypanel.host/api/status` | GET | A cada 1.5s (proxy) |
| 5 | Frontend → Supabase | `GET https://daqzshzstzatrksdbauk.supabase.co/auth/v1/user` | GET | Quando busca termina (verificar auth) |
| 6 | Frontend → Supabase | `POST https://daqzshzstzatrksdbauk.supabase.co/functions/v1/api-proxy` com `action: "consulta"` | POST | Baixar JSON resultado |
| 7 | Edge Function → EasyPanel | `GET https://reinaldo-intimacoes.sw5bxa.easypanel.host/api/consulta?arquivo=intimacoes_OAB12402_...json` | GET | Baixar JSON (proxy) |
| 8 | Frontend → Supabase | `GET https://daqzshzstzatrksdbauk.supabase.co/rest/v1/intimacoes?select=numero_processo,tribunal,data_disponibilizacao,orgao` | GET | Buscar existentes para dedup |
| 9 | Frontend → Supabase | `POST https://daqzshzstzatrksdbauk.supabase.co/rest/v1/intimacoes?on_conflict=user_id,numero_processo,tribunal,data_disponibilizacao` com `Prefer: resolution=ignore-duplicates` | POST | Inserir novas |
| 10 | Frontend → Supabase | `POST https://daqzshzstzatrksdbauk.supabase.co/functions/v1/api-proxy` com `action: "deletar"` | POST | Limpar arquivo |
| 11 | Edge Function → EasyPanel | `POST https://reinaldo-intimacoes.sw5bxa.easypanel.host/api/deletar` | POST | Limpar arquivo (proxy) |
| 12 | Frontend → Supabase | `GET https://daqzshzstzatrksdbauk.supabase.co/rest/v1/intimacoes?select=*&order=created_at.desc` | GET | Recarregar lista final |
