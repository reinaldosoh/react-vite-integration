export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          created_at: string | null
          documento: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          documento?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          documento?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          acesso_sistema: boolean
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          email: string | null
          estado: string | null
          estado_civil: string | null
          funcao_id: string | null
          id: string
          logradouro: string | null
          nome: string
          nome_mae: string | null
          nome_pai: string | null
          numero: string | null
          observacoes: string | null
          sexo: string | null
          telefone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acesso_sistema?: boolean
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          estado_civil?: string | null
          funcao_id?: string | null
          id?: string
          logradouro?: string | null
          nome: string
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          observacoes?: string | null
          sexo?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acesso_sistema?: boolean
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          estado_civil?: string | null
          funcao_id?: string | null
          id?: string
          logradouro?: string | null
          nome?: string
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          observacoes?: string | null
          sexo?: string | null
          telefone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes_escritorio"
            referencedColumns: ["id"]
          },
        ]
      }
      compromissos: {
        Row: {
          categoria: string
          cliente_id: string | null
          created_at: string | null
          data: string
          data_fim_recorrencia: string | null
          descricao: string | null
          hora_fim: string
          hora_inicio: string
          id: string
          intimacao_id: string | null
          lembrete_ativo: boolean | null
          lembretes: Json | null
          link_reuniao: string | null
          local: string | null
          recorrente: boolean | null
          tipo_recorrencia: string | null
          titulo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categoria?: string
          cliente_id?: string | null
          created_at?: string | null
          data: string
          data_fim_recorrencia?: string | null
          descricao?: string | null
          hora_fim: string
          hora_inicio: string
          id?: string
          intimacao_id?: string | null
          lembrete_ativo?: boolean | null
          lembretes?: Json | null
          link_reuniao?: string | null
          local?: string | null
          recorrente?: boolean | null
          tipo_recorrencia?: string | null
          titulo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categoria?: string
          cliente_id?: string | null
          created_at?: string | null
          data?: string
          data_fim_recorrencia?: string | null
          descricao?: string | null
          hora_fim?: string
          hora_inicio?: string
          id?: string
          intimacao_id?: string | null
          lembrete_ativo?: boolean | null
          lembretes?: Json | null
          link_reuniao?: string | null
          local?: string | null
          recorrente?: boolean | null
          tipo_recorrencia?: string | null
          titulo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compromissos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compromissos_intimacao_id_fkey"
            columns: ["intimacao_id"]
            isOneToOne: false
            referencedRelation: "intimacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_configs: {
        Row: {
          enabled: boolean | null
          hora: string
          id: string
          oabs: Json | null
          slot_index: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          enabled?: boolean | null
          hora?: string
          id?: string
          oabs?: Json | null
          slot_index: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          enabled?: boolean | null
          hora?: string
          id?: string
          oabs?: Json | null
          slot_index?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cron_logs: {
        Row: {
          data_busca: string | null
          duplicadas: number | null
          erro: string | null
          executed_at: string | null
          horario: string | null
          id: string
          novas: number | null
          oab: string | null
          status: string | null
          total_encontradas: number | null
          uf_oab: string | null
          user_id: string | null
        }
        Insert: {
          data_busca?: string | null
          duplicadas?: number | null
          erro?: string | null
          executed_at?: string | null
          horario?: string | null
          id?: string
          novas?: number | null
          oab?: string | null
          status?: string | null
          total_encontradas?: number | null
          uf_oab?: string | null
          user_id?: string | null
        }
        Update: {
          data_busca?: string | null
          duplicadas?: number | null
          erro?: string | null
          executed_at?: string | null
          horario?: string | null
          id?: string
          novas?: number | null
          oab?: string | null
          status?: string | null
          total_encontradas?: number | null
          uf_oab?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      equipes: {
        Row: {
          ativa: boolean
          created_at: string | null
          id: string
          meta: number
          nome: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string | null
          id?: string
          meta?: number
          nome: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativa?: boolean
          created_at?: string | null
          id?: string
          meta?: number
          nome?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      equipes_colaboradores: {
        Row: {
          colaborador_id: string
          created_at: string | null
          equipe_id: string
          id: string
          user_id: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string | null
          equipe_id: string
          id?: string
          user_id: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string | null
          equipe_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_colaboradores_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipes_colaboradores_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      etiquetas_tarefas: {
        Row: {
          cor: string
          created_at: string | null
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          cor?: string
          created_at?: string | null
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          cor?: string
          created_at?: string | null
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      funcoes_escritorio: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          salario_base: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          salario_base?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          salario_base?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      intimacoes: {
        Row: {
          advogados: string[] | null
          created_at: string | null
          data_disponibilizacao: string | null
          id: string
          inteiro_teor: string | null
          meio: string | null
          numero_processo: string
          oab: string | null
          orgao: string | null
          partes: string[] | null
          tipo_comunicacao: string | null
          tribunal: string | null
          user_id: string
        }
        Insert: {
          advogados?: string[] | null
          created_at?: string | null
          data_disponibilizacao?: string | null
          id?: string
          inteiro_teor?: string | null
          meio?: string | null
          numero_processo: string
          oab?: string | null
          orgao?: string | null
          partes?: string[] | null
          tipo_comunicacao?: string | null
          tribunal?: string | null
          user_id: string
        }
        Update: {
          advogados?: string[] | null
          created_at?: string | null
          data_disponibilizacao?: string | null
          id?: string
          inteiro_teor?: string | null
          meio?: string | null
          numero_processo?: string
          oab?: string | null
          orgao?: string | null
          partes?: string[] | null
          tipo_comunicacao?: string | null
          tribunal?: string | null
          user_id?: string
        }
        Relationships: []
      }
      logs_tarefas: {
        Row: {
          campo: string | null
          created_at: string | null
          id: string
          nome_usuario: string | null
          tarefa_id: string
          user_id: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          campo?: string | null
          created_at?: string | null
          id?: string
          nome_usuario?: string | null
          tarefa_id: string
          user_id: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo?: string | null
          created_at?: string | null
          id?: string
          nome_usuario?: string | null
          tarefa_id?: string
          user_id?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_tarefas_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          cliente_id: string | null
          comarca: string | null
          created_at: string | null
          data_vencimento: string | null
          descricao: string | null
          equipe_id: string | null
          estado: string | null
          hora_vencimento: string
          id: string
          intimacao_id: string | null
          parte_contraria: string | null
          prazo_fatal: string | null
          responsavel_id: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          comarca?: string | null
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          equipe_id?: string | null
          estado?: string | null
          hora_vencimento?: string
          id?: string
          intimacao_id?: string | null
          parte_contraria?: string | null
          prazo_fatal?: string | null
          responsavel_id?: string | null
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          comarca?: string | null
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          equipe_id?: string | null
          estado?: string | null
          hora_vencimento?: string
          id?: string
          intimacao_id?: string | null
          parte_contraria?: string | null
          prazo_fatal?: string | null
          responsavel_id?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_intimacao_id_fkey"
            columns: ["intimacao_id"]
            isOneToOne: false
            referencedRelation: "intimacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas_etiquetas: {
        Row: {
          created_at: string | null
          etiqueta_id: string
          id: string
          tarefa_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          etiqueta_id: string
          id?: string
          tarefa_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          etiqueta_id?: string
          id?: string
          tarefa_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_etiquetas_etiqueta_id_fkey"
            columns: ["etiqueta_id"]
            isOneToOne: false
            referencedRelation: "etiquetas_tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_etiquetas_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      sync_user_cron_jobs: { Args: { p_user_id: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
