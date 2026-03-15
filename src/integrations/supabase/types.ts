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
      applications: {
        Row: {
          created_at: string
          freelancer_id: string
          id: string
          job_id: string
          status: string
        }
        Insert: {
          created_at?: string
          freelancer_id: string
          id?: string
          job_id: string
          status?: string
        }
        Update: {
          created_at?: string
          freelancer_id?: string
          id?: string
          job_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          cnpj: string | null
          created_at: string
          descricao: string | null
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_estado: string | null
          endereco_numero: string | null
          endereco_rua: string | null
          id: string
          nome: string | null
          telefone: string | null
          tipo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          descricao?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          descricao?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_estado?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      freelancer_profiles: {
        Row: {
          bio: string | null
          cidade: string | null
          cpf: string | null
          created_at: string
          disponibilidade: string[] | null
          estado: string | null
          experiencia: number | null
          funcoes: string[] | null
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          disponibilidade?: string[] | null
          estado?: string | null
          experiencia?: number | null
          funcoes?: string[] | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          disponibilidade?: string[] | null
          estado?: string | null
          experiencia?: number | null
          funcoes?: string[] | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          company_id: string
          created_at: string
          data_evento: string
          descricao: string | null
          funcao: string
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          num_vagas: number
          requisitos: string | null
          status: string
          tipo_pagamento: string
          valor: number
        }
        Insert: {
          company_id: string
          created_at?: string
          data_evento: string
          descricao?: string | null
          funcao: string
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          num_vagas?: number
          requisitos?: string | null
          status?: string
          tipo_pagamento?: string
          valor?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          data_evento?: string
          descricao?: string | null
          funcao?: string
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          num_vagas?: number
          requisitos?: string | null
          status?: string
          tipo_pagamento?: string
          valor?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_role: "company" | "freelancer"
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
    Enums: {
      app_role: ["company", "freelancer"],
    },
  },
} as const
