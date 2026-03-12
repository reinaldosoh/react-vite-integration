-- Limpar TODAS as duplicatas (manter apenas uma por ctid)
DELETE FROM intimacoes
WHERE ctid NOT IN (
  SELECT MIN(ctid)
  FROM intimacoes
  GROUP BY user_id, numero_processo, COALESCE(tribunal, ''), COALESCE(data_disponibilizacao, ''), COALESCE(orgao, '')
);

-- Criar unique index funcional com COALESCE
CREATE UNIQUE INDEX intimacoes_dedup_idx ON intimacoes (
  user_id,
  numero_processo,
  COALESCE(tribunal, ''),
  COALESCE(data_disponibilizacao, ''),
  COALESCE(orgao, '')
);