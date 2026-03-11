

## Plano: Remover `/api/todas` e sincronizar apenas o arquivo específico

### Problema Atual
O código ainda usa `sincronizarTodasRemoto()` como fallback — essa função chama `/api/todas` no EasyPanel, que retorna arquivos acumulados de buscas de TODOS os usuários, causando vazamento de dados entre contas.

### Mudanças

**1. `src/lib/api.ts`**
- Remover `sincronizarTodasRemoto()` inteira (linhas ~117-187)
- Adicionar nova função `limparResultadoRemoto(arquivo)` que chama `callProxy('deletar', { arquivo })` com try/catch silencioso

**2. `src/pages/Index.tsx`**
- Trocar imports: remover `sincronizarTodasRemoto`, adicionar `limparResultadoRemoto`
- Reescrever o bloco `pollStatus` (linhas 567-618) com esta lógica:

```text
se !status.rodando:
  ├─ se status.erro → mostrar erro
  ├─ se status.zero_resultados → mostrar modal "nenhuma intimação"
  ├─ se status.arquivo_resultado:
  │   ├─ sincronizarNovasIntimacoes(arquivo, filtros)
  │   ├─ limparResultadoRemoto(arquivo)
  │   └─ recarregar lista
  └─ senão → mostrar modal "nenhuma intimação"
```

- Remover o fallback para `sincronizarTodasRemoto` no catch de `RESULTADO_DIVERGENTE_DA_BUSCA` — agora esse erro será exibido ao usuário como mensagem de erro normal

### Resultado
O sistema nunca mais chamará `/api/todas`. Apenas o arquivo específico da busca atual será processado e depois deletado do EasyPanel.

