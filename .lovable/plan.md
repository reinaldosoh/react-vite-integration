

## Plano: Equipe + Tarefas no JurisRapido

Replicar as funcionalidades de **Escritorio** (Funcoes, Colaboradores, Equipes) e **Tarefas** do Escavador Connect, adaptando ao design system monocromatico do JurisRapido (rounded-xl, preto/cinza, modais customizados, sem shadcn Dialog).

---

### 1. Banco de Dados (Migracoes)

**Tabela `funcoes_escritorio`**: id, user_id, nome, salario_base (numeric default 0), created_at, updated_at

**Tabela `colaboradores`**: id, user_id, nome, cpf, sexo, estado_civil, data_nascimento, nome_mae, nome_pai, funcao_id (FK funcoes_escritorio ON DELETE SET NULL), email, telefone, logradouro, numero, bairro, estado, cidade, cep, acesso_sistema (bool default false), observacoes, ativo (bool default true), created_at, updated_at

**Tabela `equipes`**: id, user_id, nome, meta (numeric default 0), ativa (bool default true), created_at, updated_at

**Tabela `equipes_colaboradores`**: id, user_id, equipe_id (FK equipes ON DELETE CASCADE), colaborador_id (FK colaboradores ON DELETE CASCADE), created_at

**Tabela `tarefas`**: id, user_id, tipo (text default 'administrativa'), titulo, descricao, cliente_id (FK clientes ON DELETE SET NULL), intimacao_id (FK intimacoes ON DELETE SET NULL), parte_contraria, estado, comarca, prazo_fatal (date), data_vencimento (date), hora_vencimento (time default '23:59'), equipe_id (FK equipes ON DELETE SET NULL), responsavel_id (FK colaboradores ON DELETE SET NULL), status (text default 'a_fazer'), created_at, updated_at

**Tabela `etiquetas_tarefas`**: id, user_id, nome, cor (text default '#3B82F6'), created_at

**Tabela `tarefas_etiquetas`**: id, user_id, tarefa_id (FK tarefas ON DELETE CASCADE), etiqueta_id (FK etiquetas_tarefas ON DELETE CASCADE), created_at

**Tabela `logs_tarefas`**: id, user_id, tarefa_id (FK tarefas ON DELETE CASCADE), campo, valor_anterior, valor_novo, nome_usuario, created_at

RLS em todas: `auth.uid() = user_id` para ALL.

---

### 2. Modulo Escritorio (Equipe)

Pagina com 3 abas: Funcoes | Colaboradores | Equipes

**Arquivos:**
- `src/pages/EscritorioPage.tsx` - Pagina principal com tabs
- `src/Escritorio/tipos_escritorio.ts` - Tipos
- `src/Escritorio/aba_funcoes.tsx` - Tabela CRUD funcoes
- `src/Escritorio/aba_colaboradores.tsx` - Tabela CRUD colaboradores (com formulario completo: CPF, sexo, estado civil, funcao, endereco)
- `src/Escritorio/aba_equipes.tsx` - Tabela CRUD equipes (com busca de colaboradores)
- `src/Escritorio/hook_buscar_funcoes.ts`
- `src/Escritorio/hook_salvar_funcao.ts`
- `src/Escritorio/hook_buscar_colaboradores.ts`
- `src/Escritorio/hook_salvar_colaborador.ts`
- `src/Escritorio/hook_buscar_equipes.ts`
- `src/Escritorio/hook_salvar_equipe.ts`
- Modais de criar/editar/excluir para cada entidade (usando modais customizados do JurisRapido, nao shadcn Dialog)
- Linhas de tabela para cada entidade

**Funcionalidades identicas ao Escavador:**
- CRUD completo de funcoes (nome + salario base)
- CRUD completo de colaboradores (dados pessoais, endereco, funcao, acesso sistema)
- CRUD completo de equipes (nome, meta, vinculo com colaboradores via busca)
- Toggle ativo/inativo em colaboradores e equipes

---

### 3. Modulo Tarefas

**Arquivos:**
- `src/pages/TarefasPage.tsx` - Pagina principal
- `src/Tarefas/tipos_tarefas.ts` - Tipos, enums, constantes
- `src/Tarefas/utilidades_tarefas.ts` - Helpers (formatarData, contarPorStatus, etc.)
- `src/Tarefas/cabecalho_tarefas.tsx`
- `src/Tarefas/cards_resumo_tarefas.tsx` - Cards de metricas (A Vencer, Prazo do dia, Vencidas, Concluidas, etc.)
- `src/Tarefas/barra_filtros_tarefas.tsx` - Busca + filtros status/tipo/etiquetas
- `src/Tarefas/tabela_tarefas.tsx` - Tabela desktop + cards mobile + paginacao
- `src/Tarefas/linha_tarefa.tsx` - Linha da tabela desktop
- `src/Tarefas/card_tarefa_mobile.tsx` - Card mobile
- `src/Tarefas/modal_criar_tarefa.tsx` - Modal fullscreen de criacao
- `src/Tarefas/modal_editar_tarefa.tsx` - Modal de edicao com abas Dados/Historico
- `src/Tarefas/modal_gerenciar_etiquetas.tsx` - CRUD de etiquetas
- `src/Tarefas/hook_buscar_tarefas.ts`
- `src/Tarefas/hook_salvar_tarefa.ts`
- `src/Tarefas/hook_buscar_etiquetas.ts`
- `src/Tarefas/hook_salvar_etiqueta.ts`

**Funcionalidades identicas ao Escavador:**
- Cards de resumo com contadores por status
- Filtros: busca textual, status (ativas/todas/individual), tipo (processo/administrativa), etiquetas
- Tabela com selecao multipla, paginacao, menu de acoes por tarefa
- Alteracao de status inline (feito, reagendada, cancelada, reabrir)
- Mobile: cards com borda colorida por status + FAB para criar
- Criacao com: titulo, tipo, cliente, intimacao, parte contraria, estado, comarca, prazo fatal, vencimento, hora, equipe, responsavel, etiquetas, descricao
- Edicao com aba de historico (logs_tarefas)
- Gerenciamento de etiquetas (nome + cor)

**Adaptacoes para JurisRapido:**
- Sem vinculo com "processos" (nao existe essa tabela aqui) - vincula com intimacoes e clientes
- Sem anexos (nao tem storage bucket configurado)
- Sem notificacao de responsavel (nao tem edge function configurada)
- Modais no estilo JurisRapido (slide-up mobile, centered desktop)
- Design monocromatico (bg-gray-50, rounded-xl, border)

---

### 4. Navegacao

Adicionar 2 novas tabs no Index.tsx:
- **Equipe** (icone briefcase)
- **Tarefas** (icone checklist)

`MainView` passa a incluir: `"home" | "detalhe" | "cron" | "agenda" | "clientes" | "escritorio" | "tarefas"`

Desktop header e mobile bottom nav atualizados.

---

### 5. Resumo

~25 arquivos novos + 1 migracao SQL + editar Index.tsx e types.ts. Todas as funcionalidades do Escavador Connect replicadas com layout proprio do JurisRapido.

