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
      achievements: {
        Row: {
          codigo: string
          conquistado_em: string | null
          descricao: string | null
          emoji: string | null
          id: string
          nome: string
          user_id: string
          xp_bonus: number | null
        }
        Insert: {
          codigo: string
          conquistado_em?: string | null
          descricao?: string | null
          emoji?: string | null
          id?: string
          nome: string
          user_id: string
          xp_bonus?: number | null
        }
        Update: {
          codigo?: string
          conquistado_em?: string | null
          descricao?: string | null
          emoji?: string | null
          id?: string
          nome?: string
          user_id?: string
          xp_bonus?: number | null
        }
        Relationships: []
      }
      activity_calendar: {
        Row: {
          cardio: boolean | null
          data: string
          habitos_pct: number | null
          id: string
          refeicoes_pct: number | null
          score: number | null
          treino: boolean | null
          user_id: string
        }
        Insert: {
          cardio?: boolean | null
          data: string
          habitos_pct?: number | null
          id?: string
          refeicoes_pct?: number | null
          score?: number | null
          treino?: boolean | null
          user_id: string
        }
        Update: {
          cardio?: boolean | null
          data?: string
          habitos_pct?: number | null
          id?: string
          refeicoes_pct?: number | null
          score?: number | null
          treino?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          agente: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          agente: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          agente?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      body_goals: {
        Row: {
          agua_meta_pct: number | null
          created_at: string | null
          cycle_id: string | null
          gordura_meta_pct: number | null
          gordura_visceral_meta: number | null
          id: string
          imc_meta: number | null
          massa_muscular_meta_kg: number | null
          musculo_pct_meta: number | null
          objetivo: string | null
          peso_meta_kg: number | null
          tmb_meta_kcal: number | null
          user_id: string
        }
        Insert: {
          agua_meta_pct?: number | null
          created_at?: string | null
          cycle_id?: string | null
          gordura_meta_pct?: number | null
          gordura_visceral_meta?: number | null
          id?: string
          imc_meta?: number | null
          massa_muscular_meta_kg?: number | null
          musculo_pct_meta?: number | null
          objetivo?: string | null
          peso_meta_kg?: number | null
          tmb_meta_kcal?: number | null
          user_id: string
        }
        Update: {
          agua_meta_pct?: number | null
          created_at?: string | null
          cycle_id?: string | null
          gordura_meta_pct?: number | null
          gordura_visceral_meta?: number | null
          id?: string
          imc_meta?: number | null
          massa_muscular_meta_kg?: number | null
          musculo_pct_meta?: number | null
          objetivo?: string | null
          peso_meta_kg?: number | null
          tmb_meta_kcal?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "body_goals_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      body_metrics: {
        Row: {
          agua_pct: number | null
          fonte: string | null
          gordura_corporal_kg: number | null
          gordura_pct: number | null
          gordura_subcutanea_pct: number | null
          gordura_visceral: number | null
          id: string
          idade_corporal: number | null
          imc: number | null
          massa_ossea_kg: number | null
          medido_em: string
          musculo_pct: number | null
          peso_ideal_kg: number | null
          peso_kg: number | null
          peso_muscular_kg: number | null
          peso_sem_gordura_kg: number | null
          proteina_kg: number | null
          proteina_pct: number | null
          tgc_pct: number | null
          tmb_kcal: number | null
          user_id: string
        }
        Insert: {
          agua_pct?: number | null
          fonte?: string | null
          gordura_corporal_kg?: number | null
          gordura_pct?: number | null
          gordura_subcutanea_pct?: number | null
          gordura_visceral?: number | null
          id?: string
          idade_corporal?: number | null
          imc?: number | null
          massa_ossea_kg?: number | null
          medido_em?: string
          musculo_pct?: number | null
          peso_ideal_kg?: number | null
          peso_kg?: number | null
          peso_muscular_kg?: number | null
          peso_sem_gordura_kg?: number | null
          proteina_kg?: number | null
          proteina_pct?: number | null
          tgc_pct?: number | null
          tmb_kcal?: number | null
          user_id: string
        }
        Update: {
          agua_pct?: number | null
          fonte?: string | null
          gordura_corporal_kg?: number | null
          gordura_pct?: number | null
          gordura_subcutanea_pct?: number | null
          gordura_visceral?: number | null
          id?: string
          idade_corporal?: number | null
          imc?: number | null
          massa_ossea_kg?: number | null
          medido_em?: string
          musculo_pct?: number | null
          peso_ideal_kg?: number | null
          peso_kg?: number | null
          peso_muscular_kg?: number | null
          peso_sem_gordura_kg?: number | null
          proteina_kg?: number | null
          proteina_pct?: number | null
          tgc_pct?: number | null
          tmb_kcal?: number | null
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
          acao_1: string | null
          aplicacao_1: string | null
          aplicacao_2: string | null
          aprendizado_1: string | null
          aprendizado_2: string | null
          aprendizado_3: string | null
          carga_horaria: number | null
          certificado_url: string | null
          citacao_favorita: string | null
          data_conclusao: string | null
          data_inicio: string | null
          dev_area_id: string | null
          habilidades_desenvolvidas: string[] | null
          id: string
          nota_geral: number | null
          plataforma: string | null
          progresso: number | null
          provedor: string | null
          resumo: string | null
          status: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          acao_1?: string | null
          aplicacao_1?: string | null
          aplicacao_2?: string | null
          aprendizado_1?: string | null
          aprendizado_2?: string | null
          aprendizado_3?: string | null
          carga_horaria?: number | null
          certificado_url?: string | null
          citacao_favorita?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          dev_area_id?: string | null
          habilidades_desenvolvidas?: string[] | null
          id?: string
          nota_geral?: number | null
          plataforma?: string | null
          progresso?: number | null
          provedor?: string | null
          resumo?: string | null
          status?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          acao_1?: string | null
          aplicacao_1?: string | null
          aplicacao_2?: string | null
          aprendizado_1?: string | null
          aprendizado_2?: string | null
          aprendizado_3?: string | null
          carga_horaria?: number | null
          certificado_url?: string | null
          citacao_favorita?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          dev_area_id?: string | null
          habilidades_desenvolvidas?: string[] | null
          id?: string
          nota_geral?: number | null
          plataforma?: string | null
          progresso?: number | null
          provedor?: string | null
          resumo?: string | null
          status?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_dev_area_id_fkey"
            columns: ["dev_area_id"]
            isOneToOne: false
            referencedRelation: "dev_areas"
            referencedColumns: ["id"]
          },
        ]
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
      daily_scores: {
        Row: {
          bonus: number
          data: string
          id: string
          pontos: number
          rest_day: boolean
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus?: number
          data: string
          id?: string
          pontos?: number
          rest_day?: boolean
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus?: number
          data?: string
          id?: string
          pontos?: number
          rest_day?: boolean
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dev_areas: {
        Row: {
          ativo: boolean | null
          categoria: string
          cor: string | null
          created_at: string | null
          descricao: string | null
          id: string
          nivel_atual: number | null
          nivel_meta: number | null
          nome: string
          ordem: number | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nivel_atual?: number | null
          nivel_meta?: number | null
          nome: string
          ordem?: number | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nivel_atual?: number | null
          nivel_meta?: number | null
          nome?: string
          ordem?: number | null
          user_id?: string
        }
        Relationships: []
      }
      dev_media: {
        Row: {
          acao_1: string | null
          aplicacao_1: string | null
          aplicacao_2: string | null
          aprendizado_1: string | null
          aprendizado_2: string | null
          aprendizado_3: string | null
          created_at: string | null
          data_conclusao: string | null
          dev_area_id: string | null
          diretor_ou_host: string | null
          habilidades_desenvolvidas: string[] | null
          id: string
          nota_geral: number | null
          notas: string | null
          origem: string | null
          plataforma: string | null
          status: string | null
          tipo: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          acao_1?: string | null
          aplicacao_1?: string | null
          aplicacao_2?: string | null
          aprendizado_1?: string | null
          aprendizado_2?: string | null
          aprendizado_3?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          dev_area_id?: string | null
          diretor_ou_host?: string | null
          habilidades_desenvolvidas?: string[] | null
          id?: string
          nota_geral?: number | null
          notas?: string | null
          origem?: string | null
          plataforma?: string | null
          status?: string | null
          tipo?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          acao_1?: string | null
          aplicacao_1?: string | null
          aplicacao_2?: string | null
          aprendizado_1?: string | null
          aprendizado_2?: string | null
          aprendizado_3?: string | null
          created_at?: string | null
          data_conclusao?: string | null
          dev_area_id?: string | null
          diretor_ou_host?: string | null
          habilidades_desenvolvidas?: string[] | null
          id?: string
          nota_geral?: number | null
          notas?: string | null
          origem?: string | null
          plataforma?: string | null
          status?: string | null
          tipo?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_media_dev_area_id_fkey"
            columns: ["dev_area_id"]
            isOneToOne: false
            referencedRelation: "dev_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_progress: {
        Row: {
          evidencia: string | null
          id: string
          nivel: number
          registrado_em: string | null
          skill_id: string | null
          user_id: string
        }
        Insert: {
          evidencia?: string | null
          id?: string
          nivel: number
          registrado_em?: string | null
          skill_id?: string | null
          user_id: string
        }
        Update: {
          evidencia?: string | null
          id?: string
          nivel?: number
          registrado_em?: string | null
          skill_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_progress_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_suggestions: {
        Row: {
          autor_ou_diretor: string | null
          created_at: string | null
          dev_area_id: string | null
          habilidades_alvo: string[] | null
          id: string
          motivo: string | null
          plataforma: string | null
          semana_sugestao: string | null
          status: string | null
          tipo: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          autor_ou_diretor?: string | null
          created_at?: string | null
          dev_area_id?: string | null
          habilidades_alvo?: string[] | null
          id?: string
          motivo?: string | null
          plataforma?: string | null
          semana_sugestao?: string | null
          status?: string | null
          tipo?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          autor_ou_diretor?: string | null
          created_at?: string | null
          dev_area_id?: string | null
          habilidades_alvo?: string[] | null
          id?: string
          motivo?: string | null
          plataforma?: string | null
          semana_sugestao?: string | null
          status?: string | null
          tipo?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_suggestions_dev_area_id_fkey"
            columns: ["dev_area_id"]
            isOneToOne: false
            referencedRelation: "dev_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plans: {
        Row: {
          ativo: boolean | null
          calorias_alvo: number | null
          carbo_g: number | null
          created_at: string | null
          cycle_id: string | null
          gordura_g: number | null
          id: string
          nome: string
          observacoes: string | null
          proteina_g: number | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          calorias_alvo?: number | null
          carbo_g?: number | null
          created_at?: string | null
          cycle_id?: string | null
          gordura_g?: number | null
          id?: string
          nome: string
          observacoes?: string | null
          proteina_g?: number | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          calorias_alvo?: number | null
          carbo_g?: number | null
          created_at?: string | null
          cycle_id?: string | null
          gordura_g?: number | null
          id?: string
          nome?: string
          observacoes?: string | null
          proteina_g?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_plans_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_imports: {
        Row: {
          created_at: string | null
          dados_confirmados: Json | null
          dados_extraidos: Json | null
          erro: string | null
          id: string
          status: string | null
          storage_path: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dados_confirmados?: Json | null
          dados_extraidos?: Json | null
          erro?: string | null
          id?: string
          status?: string | null
          storage_path: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          dados_confirmados?: Json | null
          dados_extraidos?: Json | null
          erro?: string | null
          id?: string
          status?: string | null
          storage_path?: string
          tipo?: string
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
          task_id: string | null
          tecnica: string | null
          user_id: string
        }
        Insert: {
          data?: string | null
          duracao_min?: number | null
          id?: string
          tarefa?: string | null
          task_id?: string | null
          tecnica?: string | null
          user_id: string
        }
        Update: {
          data?: string | null
          duracao_min?: number | null
          id?: string
          tarefa?: string | null
          task_id?: string | null
          tecnica?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      food_substitutions: {
        Row: {
          aprovado_ia: boolean | null
          created_at: string | null
          equivalencia_g: number | null
          food_id_original: string | null
          food_id_substituto: string | null
          id: string
          motivo: string | null
          user_id: string
        }
        Insert: {
          aprovado_ia?: boolean | null
          created_at?: string | null
          equivalencia_g?: number | null
          food_id_original?: string | null
          food_id_substituto?: string | null
          id?: string
          motivo?: string | null
          user_id: string
        }
        Update: {
          aprovado_ia?: boolean | null
          created_at?: string | null
          equivalencia_g?: number | null
          food_id_original?: string | null
          food_id_substituto?: string | null
          id?: string
          motivo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_substitutions_food_id_original_fkey"
            columns: ["food_id_original"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_substitutions_food_id_substituto_fkey"
            columns: ["food_id_substituto"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          acucar_100g: number | null
          barcode: string | null
          calorias_100g: number | null
          carbo_100g: number | null
          categoria: string | null
          created_at: string | null
          disponivel_rio_verde: boolean | null
          favorito: boolean
          fibra_100g: number | null
          fonte: string | null
          gordura_100g: number | null
          gordura_saturada_100g: number | null
          id: string
          imagem_url: string | null
          marca: string | null
          nome: string
          nova_group: number | null
          nutriscore: string | null
          off_barcode: string | null
          proteina_100g: number | null
          ref_externa: string | null
          sodio_100g: number | null
          user_id: string
        }
        Insert: {
          acucar_100g?: number | null
          barcode?: string | null
          calorias_100g?: number | null
          carbo_100g?: number | null
          categoria?: string | null
          created_at?: string | null
          disponivel_rio_verde?: boolean | null
          favorito?: boolean
          fibra_100g?: number | null
          fonte?: string | null
          gordura_100g?: number | null
          gordura_saturada_100g?: number | null
          id?: string
          imagem_url?: string | null
          marca?: string | null
          nome: string
          nova_group?: number | null
          nutriscore?: string | null
          off_barcode?: string | null
          proteina_100g?: number | null
          ref_externa?: string | null
          sodio_100g?: number | null
          user_id: string
        }
        Update: {
          acucar_100g?: number | null
          barcode?: string | null
          calorias_100g?: number | null
          carbo_100g?: number | null
          categoria?: string | null
          created_at?: string | null
          disponivel_rio_verde?: boolean | null
          favorito?: boolean
          fibra_100g?: number | null
          fonte?: string | null
          gordura_100g?: number | null
          gordura_saturada_100g?: number | null
          id?: string
          imagem_url?: string | null
          marca?: string | null
          nome?: string
          nova_group?: number | null
          nutriscore?: string | null
          off_barcode?: string | null
          proteina_100g?: number | null
          ref_externa?: string | null
          sodio_100g?: number | null
          user_id?: string
        }
        Relationships: []
      }
      foods_cache: {
        Row: {
          acucar_100g: number | null
          barcode: string | null
          busca: unknown
          cached_at: string | null
          calorias_100g: number | null
          carbo_100g: number | null
          categoria: string | null
          confianca: string | null
          consulta: string | null
          fibra_100g: number | null
          fonte: string | null
          gordura_100g: number | null
          gordura_saturada_100g: number | null
          id: string
          imagem_url: string | null
          marca: string | null
          nome: string
          nova_group: number | null
          nutriscore: string | null
          off_data: Json | null
          pais: string | null
          prioridade: number
          proteina_100g: number | null
          sodio_100g: number | null
          taco_id: string | null
          usda_fdc_id: string | null
        }
        Insert: {
          acucar_100g?: number | null
          barcode?: string | null
          busca?: unknown
          cached_at?: string | null
          calorias_100g?: number | null
          carbo_100g?: number | null
          categoria?: string | null
          confianca?: string | null
          consulta?: string | null
          fibra_100g?: number | null
          fonte?: string | null
          gordura_100g?: number | null
          gordura_saturada_100g?: number | null
          id?: string
          imagem_url?: string | null
          marca?: string | null
          nome: string
          nova_group?: number | null
          nutriscore?: string | null
          off_data?: Json | null
          pais?: string | null
          prioridade?: number
          proteina_100g?: number | null
          sodio_100g?: number | null
          taco_id?: string | null
          usda_fdc_id?: string | null
        }
        Update: {
          acucar_100g?: number | null
          barcode?: string | null
          busca?: unknown
          cached_at?: string | null
          calorias_100g?: number | null
          carbo_100g?: number | null
          categoria?: string | null
          confianca?: string | null
          consulta?: string | null
          fibra_100g?: number | null
          fonte?: string | null
          gordura_100g?: number | null
          gordura_saturada_100g?: number | null
          id?: string
          imagem_url?: string | null
          marca?: string | null
          nome?: string
          nova_group?: number | null
          nutriscore?: string | null
          off_data?: Json | null
          pais?: string | null
          prioridade?: number
          proteina_100g?: number | null
          sodio_100g?: number | null
          taco_id?: string | null
          usda_fdc_id?: string | null
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
      health_metrics_derived: {
        Row: {
          calculado_em: string | null
          dados_input: Json | null
          dados_output: Json | null
          id: string
          interpretacao: string | null
          risco: string | null
          tipo: string
          user_id: string
          valor: number | null
        }
        Insert: {
          calculado_em?: string | null
          dados_input?: Json | null
          dados_output?: Json | null
          id?: string
          interpretacao?: string | null
          risco?: string | null
          tipo: string
          user_id: string
          valor?: number | null
        }
        Update: {
          calculado_em?: string | null
          dados_input?: Json | null
          dados_output?: Json | null
          id?: string
          interpretacao?: string | null
          risco?: string | null
          tipo?: string
          user_id?: string
          valor?: number | null
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
      meal_logs: {
        Row: {
          calorias: number | null
          carbo_g: number | null
          created_at: string | null
          data: string
          descricao: string | null
          fonte: string | null
          food_id: string | null
          gordura_g: number | null
          id: string
          meal_slot_id: string | null
          proteina_g: number | null
          user_id: string
        }
        Insert: {
          calorias?: number | null
          carbo_g?: number | null
          created_at?: string | null
          data?: string
          descricao?: string | null
          fonte?: string | null
          food_id?: string | null
          gordura_g?: number | null
          id?: string
          meal_slot_id?: string | null
          proteina_g?: number | null
          user_id: string
        }
        Update: {
          calorias?: number | null
          carbo_g?: number | null
          created_at?: string | null
          data?: string
          descricao?: string | null
          fonte?: string | null
          food_id?: string | null
          gordura_g?: number | null
          id?: string
          meal_slot_id?: string | null
          proteina_g?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_meal_slot_id_fkey"
            columns: ["meal_slot_id"]
            isOneToOne: false
            referencedRelation: "meal_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_slots: {
        Row: {
          calorias_alvo: number | null
          carbo_g_alvo: number | null
          diet_plan_id: string
          gordura_g_alvo: number | null
          horario_alvo: string | null
          id: string
          nome: string
          notas: string | null
          numero: number
          proteina_g_alvo: number | null
          tipo: string | null
          user_id: string
        }
        Insert: {
          calorias_alvo?: number | null
          carbo_g_alvo?: number | null
          diet_plan_id: string
          gordura_g_alvo?: number | null
          horario_alvo?: string | null
          id?: string
          nome: string
          notas?: string | null
          numero: number
          proteina_g_alvo?: number | null
          tipo?: string | null
          user_id: string
        }
        Update: {
          calorias_alvo?: number | null
          carbo_g_alvo?: number | null
          diet_plan_id?: string
          gordura_g_alvo?: number | null
          horario_alvo?: string | null
          id?: string
          nome?: string
          notas?: string | null
          numero?: number
          proteina_g_alvo?: number | null
          tipo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_slots_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_suggestions: {
        Row: {
          ativa: boolean | null
          calorias: number | null
          carbo_g: number | null
          created_at: string | null
          descricao: string | null
          gordura_g: number | null
          id: string
          ingredientes: Json | null
          meal_slot_id: string | null
          nome: string
          origem: string | null
          proteina_g: number | null
          user_id: string
        }
        Insert: {
          ativa?: boolean | null
          calorias?: number | null
          carbo_g?: number | null
          created_at?: string | null
          descricao?: string | null
          gordura_g?: number | null
          id?: string
          ingredientes?: Json | null
          meal_slot_id?: string | null
          nome: string
          origem?: string | null
          proteina_g?: number | null
          user_id: string
        }
        Update: {
          ativa?: boolean | null
          calorias?: number | null
          carbo_g?: number | null
          created_at?: string | null
          descricao?: string | null
          gordura_g?: number | null
          id?: string
          ingredientes?: Json | null
          meal_slot_id?: string | null
          nome?: string
          origem?: string | null
          proteina_g?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_suggestions_meal_slot_id_fkey"
            columns: ["meal_slot_id"]
            isOneToOne: false
            referencedRelation: "meal_slots"
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
      notifications: {
        Row: {
          corpo: string | null
          created_at: string
          dedupe_key: string
          id: string
          lida: boolean
          link: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          corpo?: string | null
          created_at?: string
          dedupe_key: string
          id?: string
          lida?: boolean
          link?: string | null
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          corpo?: string | null
          created_at?: string
          dedupe_key?: string
          id?: string
          lida?: boolean
          link?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          nome: string | null
          onboarding_completo: boolean | null
          onboarding_step: number | null
          timezone: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          nome?: string | null
          onboarding_completo?: boolean | null
          onboarding_step?: number | null
          timezone?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string | null
          onboarding_completo?: boolean | null
          onboarding_step?: number | null
          timezone?: string | null
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          data: string
          id: string
          notas: string | null
          peso_kg: number | null
          relatorio_ia: string | null
          storage_path: string
          tipo: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          notas?: string | null
          peso_kg?: number | null
          relatorio_ia?: string | null
          storage_path: string
          tipo?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          notas?: string | null
          peso_kg?: number | null
          relatorio_ia?: string | null
          storage_path?: string
          tipo?: string | null
          user_id?: string
        }
        Relationships: []
      }
      protocol_compounds: {
        Row: {
          categoria: string | null
          dose_mg: number | null
          frequencia: string | null
          id: string
          nome: string
          notas: string | null
          ordem: number | null
          protocol_id: string
          semana_fim: number | null
          semana_inicio: number | null
          user_id: string
          via: string | null
        }
        Insert: {
          categoria?: string | null
          dose_mg?: number | null
          frequencia?: string | null
          id?: string
          nome: string
          notas?: string | null
          ordem?: number | null
          protocol_id: string
          semana_fim?: number | null
          semana_inicio?: number | null
          user_id: string
          via?: string | null
        }
        Update: {
          categoria?: string | null
          dose_mg?: number | null
          frequencia?: string | null
          id?: string
          nome?: string
          notas?: string | null
          ordem?: number | null
          protocol_id?: string
          semana_fim?: number | null
          semana_inicio?: number | null
          user_id?: string
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocol_compounds_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_exams: {
        Row: {
          data_prevista: string | null
          data_realizada: string | null
          health_metric_snapshot: Json | null
          id: string
          nome: string
          observacoes: string | null
          protocol_id: string
          semana_alvo: number | null
          status: string | null
          tipo: string | null
          user_id: string
        }
        Insert: {
          data_prevista?: string | null
          data_realizada?: string | null
          health_metric_snapshot?: Json | null
          id?: string
          nome: string
          observacoes?: string | null
          protocol_id: string
          semana_alvo?: number | null
          status?: string | null
          tipo?: string | null
          user_id: string
        }
        Update: {
          data_prevista?: string | null
          data_realizada?: string | null
          health_metric_snapshot?: Json | null
          id?: string
          nome?: string
          observacoes?: string | null
          protocol_id?: string
          semana_alvo?: number | null
          status?: string | null
          tipo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_exams_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_goals: {
        Row: {
          forca_meta: string | null
          gordura_inicial_pct: number | null
          gordura_meta_pct: number | null
          id: string
          musculo_inicial_kg: number | null
          musculo_meta_kg: number | null
          notas: string | null
          peso_inicial_kg: number | null
          peso_meta_kg: number | null
          protocol_id: string
          user_id: string
        }
        Insert: {
          forca_meta?: string | null
          gordura_inicial_pct?: number | null
          gordura_meta_pct?: number | null
          id?: string
          musculo_inicial_kg?: number | null
          musculo_meta_kg?: number | null
          notas?: string | null
          peso_inicial_kg?: number | null
          peso_meta_kg?: number | null
          protocol_id: string
          user_id: string
        }
        Update: {
          forca_meta?: string | null
          gordura_inicial_pct?: number | null
          gordura_meta_pct?: number | null
          id?: string
          musculo_inicial_kg?: number | null
          musculo_meta_kg?: number | null
          notas?: string | null
          peso_inicial_kg?: number | null
          peso_meta_kg?: number | null
          protocol_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_goals_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_logs: {
        Row: {
          compound_id: string | null
          data_aplicacao: string
          dose_aplicada_mg: number | null
          efeitos_percebidos: string | null
          energia: number | null
          humor: number | null
          id: string
          libido: number | null
          local_aplicacao: string | null
          observacoes: string | null
          protocol_id: string
          user_id: string
        }
        Insert: {
          compound_id?: string | null
          data_aplicacao?: string
          dose_aplicada_mg?: number | null
          efeitos_percebidos?: string | null
          energia?: number | null
          humor?: number | null
          id?: string
          libido?: number | null
          local_aplicacao?: string | null
          observacoes?: string | null
          protocol_id: string
          user_id: string
        }
        Update: {
          compound_id?: string | null
          data_aplicacao?: string
          dose_aplicada_mg?: number | null
          efeitos_percebidos?: string | null
          energia?: number | null
          humor?: number | null
          id?: string
          libido?: number | null
          local_aplicacao?: string | null
          observacoes?: string | null
          protocol_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_logs_compound_id_fkey"
            columns: ["compound_id"]
            isOneToOne: false
            referencedRelation: "protocol_compounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_logs_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_support: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          dose: string | null
          id: string
          momento: string | null
          motivo: string | null
          nome: string
          protocol_id: string
          semana_fim: number | null
          semana_inicio: number | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          dose?: string | null
          id?: string
          momento?: string | null
          motivo?: string | null
          nome: string
          protocol_id: string
          semana_fim?: number | null
          semana_inicio?: number | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          dose?: string | null
          id?: string
          momento?: string | null
          motivo?: string | null
          nome?: string
          protocol_id?: string
          semana_fim?: number | null
          semana_inicio?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_support_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocols: {
        Row: {
          created_at: string | null
          data_fim_prevista: string | null
          data_inicio: string | null
          duracao_semanas: number | null
          id: string
          medico_responsavel: string | null
          nome: string
          notas: string | null
          objetivo: string
          status: string | null
          user_id: string
          via: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim_prevista?: string | null
          data_inicio?: string | null
          duracao_semanas?: number | null
          id?: string
          medico_responsavel?: string | null
          nome: string
          notas?: string | null
          objetivo: string
          status?: string | null
          user_id: string
          via?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim_prevista?: string | null
          data_inicio?: string | null
          duracao_semanas?: number | null
          id?: string
          medico_responsavel?: string | null
          nome?: string
          notas?: string | null
          objetivo?: string
          status?: string | null
          user_id?: string
          via?: string | null
        }
        Relationships: []
      }
      readings: {
        Row: {
          acao_1: string | null
          aplicacao_1: string | null
          aplicacao_2: string | null
          aprendizado_1: string | null
          aprendizado_2: string | null
          aprendizado_3: string | null
          autor: string | null
          citacao_favorita: string | null
          data_conclusao: string | null
          data_inicio: string | null
          dev_area_id: string | null
          habilidades_desenvolvidas: string[] | null
          id: string
          nota_321: string | null
          nota_geral: number | null
          progresso: number | null
          relido: boolean | null
          resumo: string | null
          status: string | null
          titulo: string
          trilha: string | null
          user_id: string
        }
        Insert: {
          acao_1?: string | null
          aplicacao_1?: string | null
          aplicacao_2?: string | null
          aprendizado_1?: string | null
          aprendizado_2?: string | null
          aprendizado_3?: string | null
          autor?: string | null
          citacao_favorita?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          dev_area_id?: string | null
          habilidades_desenvolvidas?: string[] | null
          id?: string
          nota_321?: string | null
          nota_geral?: number | null
          progresso?: number | null
          relido?: boolean | null
          resumo?: string | null
          status?: string | null
          titulo: string
          trilha?: string | null
          user_id: string
        }
        Update: {
          acao_1?: string | null
          aplicacao_1?: string | null
          aplicacao_2?: string | null
          aprendizado_1?: string | null
          aprendizado_2?: string | null
          aprendizado_3?: string | null
          autor?: string | null
          citacao_favorita?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          dev_area_id?: string | null
          habilidades_desenvolvidas?: string[] | null
          id?: string
          nota_321?: string | null
          nota_geral?: number | null
          progresso?: number | null
          relido?: boolean | null
          resumo?: string | null
          status?: string | null
          titulo?: string
          trilha?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readings_dev_area_id_fkey"
            columns: ["dev_area_id"]
            isOneToOne: false
            referencedRelation: "dev_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_scores: {
        Row: {
          classificacao: string | null
          componentes: Json | null
          data: string
          dor_muscular: number | null
          fc_repouso: number | null
          id: string
          recomendacao: string | null
          score: number | null
          sono_horas: number | null
          user_id: string
          volume_ontem: number | null
        }
        Insert: {
          classificacao?: string | null
          componentes?: Json | null
          data?: string
          dor_muscular?: number | null
          fc_repouso?: number | null
          id?: string
          recomendacao?: string | null
          score?: number | null
          sono_horas?: number | null
          user_id: string
          volume_ontem?: number | null
        }
        Update: {
          classificacao?: string | null
          componentes?: Json | null
          data?: string
          dor_muscular?: number | null
          fc_repouso?: number | null
          id?: string
          recomendacao?: string | null
          score?: number | null
          sono_horas?: number | null
          user_id?: string
          volume_ontem?: number | null
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
      skills: {
        Row: {
          dev_area_id: string | null
          evidencias: string | null
          id: string
          nivel_atual: number | null
          nivel_meta: number | null
          nome: string
          ordem: number | null
          proximos_passos: string | null
          tipo: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          dev_area_id?: string | null
          evidencias?: string | null
          id?: string
          nivel_atual?: number | null
          nivel_meta?: number | null
          nome: string
          ordem?: number | null
          proximos_passos?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          dev_area_id?: string | null
          evidencias?: string | null
          id?: string
          nivel_atual?: number | null
          nivel_meta?: number | null
          nome?: string
          ordem?: number | null
          proximos_passos?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_dev_area_id_fkey"
            columns: ["dev_area_id"]
            isOneToOne: false
            referencedRelation: "dev_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      sleep_logs: {
        Row: {
          data: string
          duracao_min: number | null
          fonte: string | null
          hora_acordar: string | null
          hora_dormir: string | null
          id: string
          notas: string | null
          qualidade: number | null
          user_id: string
        }
        Insert: {
          data: string
          duracao_min?: number | null
          fonte?: string | null
          hora_acordar?: string | null
          hora_dormir?: string | null
          id?: string
          notas?: string | null
          qualidade?: number | null
          user_id: string
        }
        Update: {
          data?: string
          duracao_min?: number | null
          fonte?: string | null
          hora_acordar?: string | null
          hora_dormir?: string | null
          id?: string
          notas?: string | null
          qualidade?: number | null
          user_id?: string
        }
        Relationships: []
      }
      supplement_logs: {
        Row: {
          data: string
          horario: string | null
          id: string
          supplement_id: string
          tomado: boolean | null
          user_id: string
        }
        Insert: {
          data?: string
          horario?: string | null
          id?: string
          supplement_id: string
          tomado?: boolean | null
          user_id: string
        }
        Update: {
          data?: string
          horario?: string | null
          id?: string
          supplement_id?: string
          tomado?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_logs_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplements: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          dias_semana: string[] | null
          dose: string | null
          id: string
          momento: string | null
          nome: string
          notas: string | null
          tipo: string | null
          unidade: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          dias_semana?: string[] | null
          dose?: string | null
          id?: string
          momento?: string | null
          nome: string
          notas?: string | null
          tipo?: string | null
          unidade?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          dias_semana?: string[] | null
          dose?: string | null
          id?: string
          momento?: string | null
          nome?: string
          notas?: string | null
          tipo?: string | null
          unidade?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          area: string | null
          created_at: string
          data: string | null
          e_frog: boolean | null
          goal_id: string | null
          id: string
          status: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          data?: string | null
          e_frog?: boolean | null
          goal_id?: string | null
          id?: string
          status?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          area?: string | null
          created_at?: string
          data?: string | null
          e_frog?: boolean | null
          goal_id?: string | null
          id?: string
          status?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp: {
        Row: {
          coins: number | null
          id: string
          nivel: number | null
          streak_protegido: boolean | null
          updated_at: string | null
          user_id: string
          xp_total: number | null
        }
        Insert: {
          coins?: number | null
          id?: string
          nivel?: number | null
          streak_protegido?: boolean | null
          updated_at?: string | null
          user_id: string
          xp_total?: number | null
        }
        Update: {
          coins?: number | null
          id?: string
          nivel?: number | null
          streak_protegido?: boolean | null
          updated_at?: string | null
          user_id?: string
          xp_total?: number | null
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
      xp_logs: {
        Row: {
          acao: string
          coins_ganho: number | null
          created_at: string | null
          descricao: string | null
          id: string
          referencia_id: string | null
          user_id: string
          xp_ganho: number
        }
        Insert: {
          acao: string
          coins_ganho?: number | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          referencia_id?: string | null
          user_id: string
          xp_ganho: number
        }
        Update: {
          acao?: string
          coins_ganho?: number | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          referencia_id?: string | null
          user_id?: string
          xp_ganho?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      f_unaccent: { Args: { "": string }; Returns: string }
      search_foods_cache: {
        Args: { p_fonte?: string; p_limit?: number; q: string }
        Returns: {
          acucar_100g: number | null
          barcode: string | null
          busca: unknown
          cached_at: string | null
          calorias_100g: number | null
          carbo_100g: number | null
          categoria: string | null
          confianca: string | null
          consulta: string | null
          fibra_100g: number | null
          fonte: string | null
          gordura_100g: number | null
          gordura_saturada_100g: number | null
          id: string
          imagem_url: string | null
          marca: string | null
          nome: string
          nova_group: number | null
          nutriscore: string | null
          off_data: Json | null
          pais: string | null
          prioridade: number
          proteina_100g: number | null
          sodio_100g: number | null
          taco_id: string | null
          usda_fdc_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "foods_cache"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
