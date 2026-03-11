
-- Tabela clientes
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  email text,
  telefone text,
  documento text,
  observacoes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user owns clientes" ON public.clientes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tabela compromissos
CREATE TABLE public.compromissos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  categoria text NOT NULL DEFAULT 'reuniao',
  data date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  local text,
  link_reuniao text,
  lembrete_ativo boolean DEFAULT true,
  lembretes jsonb DEFAULT '["1_hora"]'::jsonb,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  intimacao_id uuid REFERENCES public.intimacoes(id) ON DELETE SET NULL,
  recorrente boolean DEFAULT false,
  tipo_recorrencia text,
  data_fim_recorrencia date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.compromissos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user owns compromissos" ON public.compromissos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
