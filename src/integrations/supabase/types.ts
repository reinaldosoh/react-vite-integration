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
