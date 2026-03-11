

## Plano: Agenda + Clientes no JurisRapido

O objetivo e criar dois modulos novos: **Clientes** e **Agenda**, com layout estilo Google/Microsoft Calendar (grade semanal com slots por hora), mas com design visual completamente diferente do Escavador Connect. Os compromissos podem ser vinculados a clientes e intimacoes.

**Requisito critico**: O layout NAO pode se parecer com o Escavador Connect (que usa shadcn components com bordas suaves, cores vinho/roxo, font-heading/font-body). Aqui vamos usar o design system ja existente do JurisRapido: monocromatico preto/cinza, rounded-xl, sem sombras pesadas, tipografia Inter.

---

### 1. Banco de dados (Migracao)

**Tabela `clientes`**:
- `id` uuid PK default gen_random_uuid()
- `user_id` uuid NOT NULL
- `nome` text NOT NULL
- `email` text
- `telefone` text
- `documento` text (CPF/CNPJ)
- `observacoes` text
- `created_at` timestamptz default now()

**Tabela `compromissos`**:
- `id` uuid PK default gen_random_uuid()
- `user_id` uuid NOT NULL
- `titulo` text NOT NULL
- `descricao` text
- `categoria` text NOT NULL default 'reuniao'
- `data` date NOT NULL
- `hora_inicio` time NOT NULL
- `hora_fim` time NOT NULL
- `local` text
- `link_reuniao` text
- `lembrete_ativo` boolean default true
- `lembretes` jsonb default '["1_hora"]'
- `cliente_id` uuid REFERENCES clientes(id) ON DELETE SET NULL
- `intimacao_id` uuid REFERENCES intimacoes(id) ON DELETE SET NULL
- `recorrente` boolean default false
- `tipo_recorrencia` text
- `data_fim_recorrencia` date
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

**RLS**: Ambas tabelas com politica `auth.uid() = user_id` para ALL.

---

### 2. Modulo Clientes

Arquivos:
- `src/pages/ClientesPage.tsx` - Lista de clientes com busca, criar/editar/excluir em modais
- `src/hooks/useClientes.ts` - CRUD hooks com react-query

**Layout**: Lista de cards com nome, documento, telefone. Botao "+ Novo Cliente" no topo. Modal para criar/editar. Design monocromatico do JurisRapido (bg-gray-50, rounded-xl, border, sem shadcn Dialog - usar os mesmos modais customizados do projeto).

---

### 3. Modulo Agenda

Arquivos:
- `src/pages/AgendaPage.tsx` - Pagina principal
- `src/components/agenda/GradeHorarios.tsx` - Grade semanal (colunas = dias, linhas = horas 6h-21h)
- `src/components/agenda/MiniCalendario.tsx` - Mini calendario mensal no painel lateral
- `src/components/agenda/ModalCompromisso.tsx` - Criar/editar compromisso
- `src/components/agenda/ModalDetalhes.tsx` - Ver detalhes
- `src/components/agenda/SlotEvento.tsx` - Card do evento na grade
- `src/hooks/useCompromissos.ts` - CRUD hooks

**Funcionalidades** (mesmas do Escavador Connect):
- Grade semanal com navegacao (semana anterior/proxima, botao "Hoje")
- Mobile: visao de 1 dia por vez
- Clicar em slot vazio abre modal de novo compromisso
- Clicar em compromisso abre detalhes -> editar/excluir
- Filtro por categoria e busca por texto
- Compromissos recorrentes
- Lembretes configuraveis
- Vinculo com cliente (select) e intimacao (select)
- Semana util vs completa
- Mini calendario no painel lateral

**Design diferenciado** (vs Escavador Connect):
- **Cores**: Preto/cinza monocromatico com accent colors pasteis por categoria (azul, verde, amarelo, vermelho, roxo) em vez do esquema vinho/roxo
- **Slots**: Pill-shaped com borda esquerda colorida e fundo semi-transparente, cantos mais arredondados (rounded-xl vs rounded-md)
- **Header**: Integrado ao header existente como nova tab (Intimacoes | Alertas | Agenda | Clientes) em vez de titulo separado
- **Painel lateral**: Drawer/sheet no mobile, coluna fixa no desktop, usando o estilo de cards do JurisRapido (bg-white, border, rounded-xl)
- **Modais**: Usar o mesmo estilo fullscreen-mobile/centered-desktop que ja existe no projeto, NAO usar Dialog do shadcn
- **Tipografia**: Inter (ja em uso), sem font-heading/font-body separados

---

### 4. Navegacao

Adicionar 2 novas tabs na nav do `Index.tsx`:
- **Agenda** (icone calendario)
- **Clientes** (icone users)

Tanto no header desktop quanto no bottom nav mobile.

`MainView` passa a incluir: `"home" | "detalhe" | "cron" | "agenda" | "clientes"`

---

### 5. Resumo de arquivos

| Acao | Arquivo |
|------|---------|
| Criar | `src/pages/ClientesPage.tsx` |
| Criar | `src/hooks/useClientes.ts` |
| Criar | `src/pages/AgendaPage.tsx` |
| Criar | `src/components/agenda/GradeHorarios.tsx` |
| Criar | `src/components/agenda/MiniCalendario.tsx` |
| Criar | `src/components/agenda/ModalCompromisso.tsx` |
| Criar | `src/components/agenda/ModalDetalhes.tsx` |
| Criar | `src/components/agenda/SlotEvento.tsx` |
| Criar | `src/hooks/useCompromissos.ts` |
| Criar | `src/lib/agenda-utils.ts` (tipos, constantes, helpers) |
| Editar | `src/pages/Index.tsx` (nav + novas views) |
| Migracao | Criar tabelas `clientes` e `compromissos` com RLS |

