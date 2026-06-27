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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      body_metrics: {
        Row: {
          gordura_pct: number | null
          id: string
          medido_em: string
          peso_kg: number | null
          user_id: string
        }
        Insert: {
          gordura_pct?: number | null
          id?: string
          medido_em?: string
          peso_kg?: number | null
          user_id: string
        }
        Update: {
          gordura_pct?: number | null
          id?: string
          medido_em?: string
          peso_kg?: number | null
          user_id?: string
        }
        Relationships: []
      }
      cardio_sessions: {
        Row: {
          distancia_km: number | null
          duracao_seg: number | null
          fc_media: number | null
          id: string
          notas: string | null
          performed_at: string | null
          tipo: string | null
          tiros: string | null
          user_id: string
          zona: string | null
        }
        Insert: {
          distancia_km?: number | null
          duracao_seg?: number | null
          fc_media?: number | null
          id?: string
          notas?: string | null
          performed_at?: string | null
          tipo?: string | null
          tiros?: string | null
          user_id: string
          zona?: string | null
        }
        Update: {
          distancia_km?: number | null
          duracao_seg?: number | null
          fc_media?: number | null
          id?: string
          notas?: string | null
          performed_at?: string | null
          tipo?: string | null
          tiros?: string | null
          user_id?: string
          zona?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          progresso: number | null
          provedor: string | null
          status: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          id?: string
          progresso?: number | null
          provedor?: string | null
          status?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          id?: string
          progresso?: number | null
          provedor?: string | null
          status?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_clients: {
        Row: {
          created_at: string | null
          data_proxima_acao: string | null
          fase: string | null
          id: string
          nome: string
          proxima_acao: string | null
          user_id: string
          valor_estimado: number | null
        }
        Insert: {
          created_at?: string | null
          data_proxima_acao?: string | null
          fase?: string | null
          id?: string
          nome: string
          proxima_acao?: string | null
          user_id: string
          valor_estimado?: number | null
        }
        Update: {
          created_at?: string | null
          data_proxima_acao?: string | null
          fase?: string | null
          id?: string
          nome?: string
          proxima_acao?: string | null
          user_id?: string
          valor_estimado?: number | null
        }
        Relationships: []
      }
      cycles: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_fim: string
          data_inicio: string
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_fim: string
          data_inicio: string
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          cadencia_padrao: string | null
          created_at: string | null
          cues: string | null
          grupo_muscular: string | null
          id: string
          nome: string
          user_id: string
          youtube_video_id: string | null
        }
        Insert: {
          cadencia_padrao?: string | null
          created_at?: string | null
          cues?: string | null
          grupo_muscular?: string | null
          id?: string
          nome: string
          user_id: string
          youtube_video_id?: string | null
        }
        Update: {
          cadencia_padrao?: string | null
          created_at?: string | null
          cues?: string | null
          grupo_muscular?: string | null
          id?: string
          nome?: string
          user_id?: string
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      finance_goals: {
        Row: {
          ciclo_id: string | null
          id: string
          meta_mensal: number | null
          numero_liberdade: number | null
          user_id: string
        }
        Insert: {
          ciclo_id?: string | null
          id?: string
          meta_mensal?: number | null
          numero_liberdade?: number | null
          user_id: string
        }
        Update: {
          ciclo_id?: string | null
          id?: string
          meta_mensal?: number | null
          numero_liberdade?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_goals_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      finances: {
        Row: {
          categoria: string | null
          data: string
          descricao: string | null
          id: string
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          data?: string
          descricao?: string | null
          id?: string
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string | null
          data?: string
          descricao?: string | null
          id?: string
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          data: string | null
          duracao_min: number | null
          id: string
          tarefa: string | null
          tecnica: string | null
          user_id: string
        }
        Insert: {
          data?: string | null
          duracao_min?: number | null
          id?: string
          tarefa?: string | null
          tecnica?: string | null
          user_id: string
        }
        Update: {
          data?: string | null
          duracao_min?: number | null
          id?: string
          tarefa?: string | null
          tecnica?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          area: string
          created_at: string | null
          cycle_id: string | null
          id: string
          plano_rpm: string | null
          progresso: number | null
          proposito_rpm: string | null
          resultado_rpm: string | null
          status: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string | null
          cycle_id?: string | null
          id?: string
          plano_rpm?: string | null
          progresso?: number | null
          proposito_rpm?: string | null
          resultado_rpm?: string | null
          status?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string | null
          cycle_id?: string | null
          id?: string
          plano_rpm?: string | null
          progresso?: number | null
          proposito_rpm?: string | null
          resultado_rpm?: string | null
          status?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          concluido: boolean | null
          data: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          concluido?: boolean | null
          data: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          concluido?: boolean | null
          data?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          area: string | null
          ativo: boolean | null
          id: string
          nome: string
          ordem: number | null
          user_id: string
        }
        Insert: {
          area?: string | null
          ativo?: boolean | null
          id?: string
          nome: string
          ordem?: number | null
          user_id: string
        }
        Update: {
          area?: string | null
          ativo?: boolean | null
          id?: string
          nome?: string
          ordem?: number | null
          user_id?: string
        }
        Relationships: []
      }
      health_metric_defs: {
        Row: {
          chave: string
          direcao: string | null
          id: string
          label: string
          unidade: string | null
          user_id: string
          valor_meta: number | null
        }
        Insert: {
          chave: string
          direcao?: string | null
          id?: string
          label: string
          unidade?: string | null
          user_id: string
          valor_meta?: number | null
        }
        Update: {
          chave?: string
          direcao?: string | null
          id?: string
          label?: string
          unidade?: string | null
          user_id?: string
          valor_meta?: number | null
        }
        Relationships: []
      }
      health_metrics: {
        Row: {
          chave: string
          created_at: string
          id: string
          measured_at: string
          user_id: string
          valor: number
        }
        Insert: {
          chave: string
          created_at?: string
          id?: string
          measured_at?: string
          user_id: string
          valor: number
        }
        Update: {
          chave?: string
          created_at?: string
          id?: string
          measured_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          conteudo: string | null
          data: string
          humor: number | null
          id: string
          o_que_senti: string | null
          tipo: string | null
          user_id: string
        }
        Insert: {
          conteudo?: string | null
          data?: string
          humor?: number | null
          id?: string
          o_que_senti?: string | null
          tipo?: string | null
          user_id: string
        }
        Update: {
          conteudo?: string | null
          data?: string
          humor?: number | null
          id?: string
          o_que_senti?: string | null
          tipo?: string | null
          user_id?: string
        }
        Relationships: []
      }
      key_results: {
        Row: {
          descricao: string
          goal_id: string
          id: string
          unidade: string | null
          user_id: string
          valor_atual: number | null
          valor_meta: number
        }
        Insert: {
          descricao: string
          goal_id: string
          id?: string
          unidade?: string | null
          user_id: string
          valor_atual?: number | null
          valor_meta: number
        }
        Update: {
          descricao?: string
          goal_id?: string
          id?: string
          unidade?: string | null
          user_id?: string
          valor_atual?: number | null
          valor_meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "key_results_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          calorias: number | null
          data: string
          descricao: string | null
          id: string
          proteina_g: number | null
          refeicao: number
          tipo: string | null
          user_id: string
        }
        Insert: {
          calorias?: number | null
          data?: string
          descricao?: string | null
          id?: string
          proteina_g?: number | null
          refeicao: number
          tipo?: string | null
          user_id: string
        }
        Update: {
          calorias?: number | null
          data?: string
          descricao?: string | null
          id?: string
          proteina_g?: number | null
          refeicao?: number
          tipo?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          nome: string | null
          timezone: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          nome?: string | null
          timezone?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      readings: {
        Row: {
          autor: string | null
          id: string
          nota_321: string | null
          progresso: number | null
          status: string | null
          titulo: string
          trilha: string | null
          user_id: string
        }
        Insert: {
          autor?: string | null
          id?: string
          nota_321?: string | null
          progresso?: number | null
          status?: string | null
          titulo: string
          trilha?: string | null
          user_id: string
        }
        Update: {
          autor?: string | null
          id?: string
          nota_321?: string | null
          progresso?: number | null
          status?: string | null
          titulo?: string
          trilha?: string | null
          user_id?: string
        }
        Relationships: []
      }
      set_logs: {
        Row: {
          cadencia: string | null
          carga_kg: number | null
          concluida: boolean | null
          created_at: string | null
          exercise_id: string
          id: string
          pausa_seg: number | null
          reps: number | null
          rpe: number | null
          serie_num: number
          session_id: string
          user_id: string
        }
        Insert: {
          cadencia?: string | null
          carga_kg?: number | null
          concluida?: boolean | null
          created_at?: string | null
          exercise_id: string
          id?: string
          pausa_seg?: number | null
          reps?: number | null
          rpe?: number | null
          serie_num: number
          session_id: string
          user_id: string
        }
        Update: {
          cadencia?: string | null
          carga_kg?: number | null
          concluida?: boolean | null
          created_at?: string | null
          exercise_id?: string
          id?: string
          pausa_seg?: number | null
          reps?: number | null
          rpe?: number | null
          serie_num?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          area: string | null
          data: string | null
          e_frog: boolean | null
          id: string
          status: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          area?: string | null
          data?: string | null
          e_frog?: boolean | null
          id?: string
          status?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          area?: string | null
          data?: string | null
          e_frog?: boolean | null
          id?: string
          status?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          cadencia_alvo: string | null
          exercise_id: string
          id: string
          notas: string | null
          ordem: number | null
          pausa_alvo_seg: number | null
          reps_alvo: string | null
          series_alvo: number | null
          user_id: string
          workout_id: string
        }
        Insert: {
          cadencia_alvo?: string | null
          exercise_id: string
          id?: string
          notas?: string | null
          ordem?: number | null
          pausa_alvo_seg?: number | null
          reps_alvo?: string | null
          series_alvo?: number | null
          user_id: string
          workout_id: string
        }
        Update: {
          cadencia_alvo?: string | null
          exercise_id?: string
          id?: string
          notas?: string | null
          ordem?: number | null
          pausa_alvo_seg?: number | null
          reps_alvo?: string | null
          series_alvo?: number | null
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          duracao_seg: number | null
          esforco_percebido: number | null
          id: string
          notas: string | null
          performed_at: string | null
          user_id: string
          workout_id: string | null
        }
        Insert: {
          duracao_seg?: number | null
          esforco_percebido?: number | null
          id?: string
          notas?: string | null
          performed_at?: string | null
          user_id: string
          workout_id?: string | null
        }
        Update: {
          duracao_seg?: number | null
          esforco_percebido?: number | null
          id?: string
          notas?: string | null
          performed_at?: string | null
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          ativo: boolean | null
          foco: string | null
          id: string
          nome: string
          ordem: number | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          foco?: string | null
          id?: string
          nome: string
          ordem?: number | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          foco?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
