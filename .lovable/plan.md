

## Plano: Corrigir deduplicação de intimações (null vs empty string)

### Problema
Duas falhas combinadas permitem duplicatas:
1. **JS**: chave do DB usa `"null"` (string) para campos nulos, enquanto itens novos usam `""`. Nunca batem.
2. **SQL**: `UNIQUE(user_id, numero_processo, tribunal, data_disponibilizacao)` ignora NULLs — `NULL != NULL` em SQL, então a constraint não impede duplicatas quando `tribunal` é null.

### Mudanças

**1. Migration SQL — Criar unique index funcional com COALESCE**
```sql
-- Remover a constraint existente que não pega nulls
ALTER TABLE intimacoes DROP CONSTRAINT IF EXISTS intimacoes_user_id_numero_processo_tribunal_data_disponibil_key;

-- Criar unique index que trata NULL como string vazia
CREATE UNIQUE INDEX intimacoes_dedup_idx ON intimacoes (
  user_id,
  numero_processo,
  COALESCE(tribunal, ''),
  COALESCE(data_disponibilizacao, ''),
  COALESCE(orgao, '')
);

-- Limpar duplicata existente (manter a mais antiga)
DELETE FROM intimacoes a USING intimacoes b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.numero_processo = b.numero_processo
  AND COALESCE(a.tribunal, '') = COALESCE(b.tribunal, '')
  AND COALESCE(a.data_disponibilizacao, '') = COALESCE(b.data_disponibilizacao, '')
  AND COALESCE(a.orgao, '') = COALESCE(b.orgao, '');
```

**2. `src/lib/api.ts` — Normalizar nulls na comparação JS**

Linha ~169-171, trocar a montagem de chave dos existentes:
```typescript
// ANTES (bug: null vira "null")
`${e.numero_processo}|${e.tribunal}|${e.data_disponibilizacao}|${e.orgao}`

// DEPOIS
`${e.numero_processo}|${e.tribunal || ''}|${e.data_disponibilizacao || ''}|${e.orgao || ''}`
```

Linha ~201-203, ajustar o onConflict do upsert para usar o novo index:
```typescript
// Inserir com valores normalizados (null → '')
const rows = novas.map((i) => ({
  ...existingMapping,
  tribunal: i.tribunal || '',
  orgao: i.orgao || '',
  data_disponibilizacao: i.data_disponibilizacao || '',
}))
```

### Resultado
- Deduplicação funciona corretamente tanto no JS quanto no banco
- A duplicata existente será removida pela migration
- Novos dados nunca terão campos null nas colunas da chave

