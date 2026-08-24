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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          data: string
          id: string
          livro_id: string | null
          observacoes: string | null
          status: string | null
          tema: string
          voluntario_abertura_id: string | null
          voluntario_apresentacao_id: string | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          data: string
          id?: string
          livro_id?: string | null
          observacoes?: string | null
          status?: string | null
          tema: string
          voluntario_abertura_id?: string | null
          voluntario_apresentacao_id?: string | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          data?: string
          id?: string
          livro_id?: string | null
          observacoes?: string | null
          status?: string | null
          tema?: string
          voluntario_abertura_id?: string | null
          voluntario_apresentacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_livro_id_fkey"
            columns: ["livro_id"]
            isOneToOne: false
            referencedRelation: "livros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_voluntario_abertura_id_fkey"
            columns: ["voluntario_abertura_id"]
            isOneToOne: false
            referencedRelation: "voluntarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_voluntario_apresentacao_id_fkey"
            columns: ["voluntario_apresentacao_id"]
            isOneToOne: false
            referencedRelation: "voluntarios"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos_enviados: {
        Row: {
          agendamento_id: string
          canal: string
          enviado_em: string | null
          id: string
          sucesso: boolean | null
          tipo: string
        }
        Insert: {
          agendamento_id: string
          canal: string
          enviado_em?: string | null
          id?: string
          sucesso?: boolean | null
          tipo: string
        }
        Update: {
          agendamento_id?: string
          canal?: string
          enviado_em?: string | null
          id?: string
          sucesso?: boolean | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_enviados_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          criado_em: string | null
          data: string
          descricao: string
          fotos: string[] | null
          id: string
        }
        Insert: {
          criado_em?: string | null
          data: string
          descricao: string
          fotos?: string[] | null
          id?: string
        }
        Update: {
          criado_em?: string | null
          data?: string
          descricao?: string
          fotos?: string[] | null
          id?: string
        }
        Relationships: []
      }
      livros: {
        Row: {
          autor: string
          capitulos: string | null
          criado_em: string | null
          id: string
          nome: string
        }
        Insert: {
          autor: string
          capitulos?: string | null
          criado_em?: string | null
          id?: string
          nome: string
        }
        Update: {
          autor?: string
          capitulos?: string | null
          criado_em?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      materiais_apoio: {
        Row: {
          criado_em: string | null
          data: string
          id: string
          livro_id: string | null
          tipo: string
          titulo: string
          url_arquivo: string | null
          url_link: string | null
        }
        Insert: {
          criado_em?: string | null
          data?: string
          id?: string
          livro_id?: string | null
          tipo: string
          titulo: string
          url_arquivo?: string | null
          url_link?: string | null
        }
        Update: {
          criado_em?: string | null
          data?: string
          id?: string
          livro_id?: string | null
          tipo?: string
          titulo?: string
          url_arquivo?: string | null
          url_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materiais_apoio_livro_id_fkey"
            columns: ["livro_id"]
            isOneToOne: false
            referencedRelation: "livros"
            referencedColumns: ["id"]
          },
        ]
      }
      voluntarios: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          data_nascimento: string | null
          eh_organizador: boolean | null
          email: string
          id: string
          nome: string
          telefone: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          data_nascimento?: string | null
          eh_organizador?: boolean | null
          email: string
          id?: string
          nome: string
          telefone: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          data_nascimento?: string | null
          eh_organizador?: boolean | null
          email?: string
          id?: string
          nome?: string
          telefone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_organizador: { Args: never; Returns: boolean }
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
