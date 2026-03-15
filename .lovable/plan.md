

## Plano: Criar documentação completa do fluxo de intimações

Criar o arquivo `ARQUITETURA_INTIMACOES.md` na raiz do projeto com **toda** a estrutura necessária para replicar o fluxo em outro projeto, incluindo:

1. **Diagrama da arquitetura** (Frontend → Edge Function → EasyPanel → Supabase)
2. **SQL completo** da tabela `intimacoes` com RLS e unique index
3. **Edge Function `api-proxy`** — código completo do proxy Deno que roteia para o EasyPanel
4. **API do Scraper (EasyPanel)** — os 4 endpoints que o scraper precisa expor, com exemplos de request/response
5. **Frontend `src/lib/api.ts`** — código completo com todas as funções (callProxy, iniciarBusca, fetchStatus, sincronizarNovasIntimacoes, etc.)
6. **Frontend `Index.tsx`** — fluxo de polling com proteção contra race condition (syncingRef + clearInterval)
7. **Armadilhas** (NULL vs '', race condition, divergência de OAB)
8. **config.toml** — configuração necessária para a Edge Function

O arquivo será autocontido — qualquer desenvolvedor consegue montar o sistema inteiro apenas seguindo o MD.

