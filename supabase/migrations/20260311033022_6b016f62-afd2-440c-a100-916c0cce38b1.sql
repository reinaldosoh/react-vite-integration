
-- Tabela funcoes_escritorio
CREATE TABLE public.funcoes_escritorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  salario_base numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE POLICY "user owns funcoes_escritorio" ON public.funcoes_escritorio FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela colaboradores
CREATE TABLE public.colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  cpf text,
  sexo text,
  estado_civil text,
  data_nascimento date,
  nome_mae text,
  nome_pai text,
  funcao_id uuid REFERENCES public.funcoes_escritorio(id) ON DELETE SET NULL,
  email text,
  telefone text,
  logradouro text,
  numero text,
  bairro text,
  estado text,
  cidade text,
  cep text,
  acesso_sistema boolean NOT NULL DEFAULT false,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE POLICY "user owns colaboradores" ON public.colaboradores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela equipes
CREATE TABLE public.equipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  meta numeric NOT NULL DEFAULT 0,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE POLICY "user owns equipes" ON public.equipes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela equipes_colaboradores (vinculo N:N)
CREATE TABLE public.equipes_colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  equipe_id uuid NOT NULL REFERENCES public.equipes(id) ON DELETE CASCADE,
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(equipe_id, colaborador_id)
);
CREATE POLICY "user owns equipes_colaboradores" ON public.equipes_colaboradores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela etiquetas_tarefas
CREATE TABLE public.etiquetas_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  cor text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);
CREATE POLICY "user owns etiquetas_tarefas" ON public.etiquetas_tarefas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela tarefas
CREATE TABLE public.tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'administrativa',
  titulo text NOT NULL,
  descricao text,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  intimacao_id uuid REFERENCES public.intimacoes(id) ON DELETE SET NULL,
  parte_contraria text,
  estado text,
  comarca text,
  prazo_fatal date,
  data_vencimento date,
  hora_vencimento time NOT NULL DEFAULT '23:59',
  equipe_id uuid REFERENCES public.equipes(id) ON DELETE SET NULL,
  responsavel_id uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'a_fazer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE POLICY "user owns tarefas" ON public.tarefas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela tarefas_etiquetas (vinculo N:N)
CREATE TABLE public.tarefas_etiquetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tarefa_id uuid NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  etiqueta_id uuid NOT NULL REFERENCES public.etiquetas_tarefas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tarefa_id, etiqueta_id)
);
CREATE POLICY "user owns tarefas_etiquetas" ON public.tarefas_etiquetas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela logs_tarefas
CREATE TABLE public.logs_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tarefa_id uuid NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  campo text,
  valor_anterior text,
  valor_novo text,
  nome_usuario text,
  created_at timestamptz DEFAULT now()
);
CREATE POLICY "user owns logs_tarefas" ON public.logs_tarefas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
