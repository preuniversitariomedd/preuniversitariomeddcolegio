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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      biblioteca: {
        Row: {
          categoria: string | null
          created_at: string | null
          curso_id: string | null
          descripcion: string | null
          id: string
          tipo: string
          titulo: string
          url: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          curso_id?: string | null
          descripcion?: string | null
          id?: string
          tipo: string
          titulo: string
          url: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          curso_id?: string | null
          descripcion?: string | null
          id?: string
          tipo?: string
          titulo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "biblioteca_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      competencia_participantes: {
        Row: {
          competencia_id: string
          id: string
          joined_at: string | null
          powerups: Json | null
          puntos: number | null
          racha: number | null
          user_id: string
        }
        Insert: {
          competencia_id: string
          id?: string
          joined_at?: string | null
          powerups?: Json | null
          puntos?: number | null
          racha?: number | null
          user_id: string
        }
        Update: {
          competencia_id?: string
          id?: string
          joined_at?: string | null
          powerups?: Json | null
          puntos?: number | null
          racha?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competencia_participantes_competencia_id_fkey"
            columns: ["competencia_id"]
            isOneToOne: false
            referencedRelation: "competencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competencia_participantes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competencia_preguntas: {
        Row: {
          competencia_id: string
          explicacion: string | null
          id: string
          imagen_url: string | null
          opciones: Json
          orden: number
          pregunta: string
          respuesta_correcta: number
          tiempo_limite: number | null
        }
        Insert: {
          competencia_id: string
          explicacion?: string | null
          id?: string
          imagen_url?: string | null
          opciones: Json
          orden: number
          pregunta: string
          respuesta_correcta: number
          tiempo_limite?: number | null
        }
        Update: {
          competencia_id?: string
          explicacion?: string | null
          id?: string
          imagen_url?: string | null
          opciones?: Json
          orden?: number
          pregunta?: string
          respuesta_correcta?: number
          tiempo_limite?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competencia_preguntas_competencia_id_fkey"
            columns: ["competencia_id"]
            isOneToOne: false
            referencedRelation: "competencias"
            referencedColumns: ["id"]
          },
        ]
      }
      competencia_respuestas: {
        Row: {
          competencia_id: string
          correcta: boolean
          created_at: string | null
          id: string
          pregunta_id: string
          puntos_ganados: number | null
          respuesta: number | null
          tiempo_usado: number | null
          user_id: string
        }
        Insert: {
          competencia_id: string
          correcta: boolean
          created_at?: string | null
          id?: string
          pregunta_id: string
          puntos_ganados?: number | null
          respuesta?: number | null
          tiempo_usado?: number | null
          user_id: string
        }
        Update: {
          competencia_id?: string
          correcta?: boolean
          created_at?: string | null
          id?: string
          pregunta_id?: string
          puntos_ganados?: number | null
          respuesta?: number | null
          tiempo_usado?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competencia_respuestas_competencia_id_fkey"
            columns: ["competencia_id"]
            isOneToOne: false
            referencedRelation: "competencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competencia_respuestas_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "competencia_preguntas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competencia_respuestas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competencias: {
        Row: {
          codigo: string
          config: Json | null
          created_at: string | null
          created_by: string
          estado: string
          id: string
          pregunta_actual: number
          titulo: string
        }
        Insert: {
          codigo: string
          config?: Json | null
          created_at?: string | null
          created_by: string
          estado?: string
          id?: string
          pregunta_actual?: number
          titulo: string
        }
        Update: {
          codigo?: string
          config?: Json | null
          created_at?: string | null
          created_by?: string
          estado?: string
          id?: string
          pregunta_actual?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "competencias_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contenido: {
        Row: {
          grupo: string | null
          id: string
          imagen_url: string | null
          orden: number | null
          pestana_id: string
          solucion: string | null
          texto: string | null
          titulo: string | null
          video_url: string | null
        }
        Insert: {
          grupo?: string | null
          id?: string
          imagen_url?: string | null
          orden?: number | null
          pestana_id: string
          solucion?: string | null
          texto?: string | null
          titulo?: string | null
          video_url?: string | null
        }
        Update: {
          grupo?: string | null
          id?: string
          imagen_url?: string | null
          orden?: number | null
          pestana_id?: string
          solucion?: string | null
          texto?: string | null
          titulo?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contenido_pestana_id_fkey"
            columns: ["pestana_id"]
            isOneToOne: false
            referencedRelation: "pestanas"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          activo: boolean | null
          color: string | null
          descripcion: string | null
          id: string
          orden: number
          titulo: string
        }
        Insert: {
          activo?: boolean | null
          color?: string | null
          descripcion?: string | null
          id?: string
          orden: number
          titulo: string
        }
        Update: {
          activo?: boolean | null
          color?: string | null
          descripcion?: string | null
          id?: string
          orden?: number
          titulo?: string
        }
        Relationships: []
      }
      grupo_miembros: {
        Row: {
          created_at: string | null
          grupo_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          grupo_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          grupo_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupo_miembros_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupo_miembros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      inscripciones: {
        Row: {
          created_at: string | null
          curso_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          curso_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          curso_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes: {
        Row: {
          archivo_nombre: string | null
          archivo_url: string | null
          contenido: string
          created_at: string | null
          destinatario_id: string
          id: string
          leido: boolean | null
          remitente_id: string
        }
        Insert: {
          archivo_nombre?: string | null
          archivo_url?: string | null
          contenido: string
          created_at?: string | null
          destinatario_id: string
          id?: string
          leido?: boolean | null
          remitente_id: string
        }
        Update: {
          archivo_nombre?: string | null
          archivo_url?: string | null
          contenido?: string
          created_at?: string | null
          destinatario_id?: string
          id?: string
          leido?: boolean | null
          remitente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_remitente_id_fkey"
            columns: ["remitente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pestanas: {
        Row: {
          activa: boolean | null
          id: string
          nombre: string
          orden: number
          sesion_id: string
        }
        Insert: {
          activa?: boolean | null
          id?: string
          nombre: string
          orden: number
          sesion_id: string
        }
        Update: {
          activa?: boolean | null
          id?: string
          nombre?: string
          orden?: number
          sesion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pestanas_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      presencia: {
        Row: {
          dispositivo: string | null
          id: string
          ip: string | null
          last_seen: string
          updated_at: string
          user_id: string
        }
        Insert: {
          dispositivo?: string | null
          id?: string
          ip?: string | null
          last_seen?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          dispositivo?: string | null
          id?: string
          ip?: string | null
          last_seen?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presencia_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apellidos: string
          avatar_url: string | null
          cedula: string
          colegio: string | null
          created_at: string | null
          fecha_nacimiento: string | null
          id: string
          nombre: string
          password_changed: boolean | null
        }
        Insert: {
          apellidos: string
          avatar_url?: string | null
          cedula: string
          colegio?: string | null
          created_at?: string | null
          fecha_nacimiento?: string | null
          id: string
          nombre: string
          password_changed?: boolean | null
        }
        Update: {
          apellidos?: string
          avatar_url?: string | null
          cedula?: string
          colegio?: string | null
          created_at?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre?: string
          password_changed?: boolean | null
        }
        Relationships: []
      }
      progreso_estudiante: {
        Row: {
          id: string
          intentos_quiz: number | null
          porcentaje: number | null
          preguntas_correctas: number | null
          sesion_id: string
          tiempo_invertido: number | null
          user_id: string
        }
        Insert: {
          id?: string
          intentos_quiz?: number | null
          porcentaje?: number | null
          preguntas_correctas?: number | null
          sesion_id: string
          tiempo_invertido?: number | null
          user_id: string
        }
        Update: {
          id?: string
          intentos_quiz?: number | null
          porcentaje?: number | null
          preguntas_correctas?: number | null
          sesion_id?: string
          tiempo_invertido?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progreso_estudiante_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progreso_estudiante_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_preguntas: {
        Row: {
          explicacion: string | null
          id: string
          imagen_url: string | null
          opciones: Json
          pregunta: string
          respuesta_correcta: number
          sesion_id: string
          tiempo_limite: number | null
        }
        Insert: {
          explicacion?: string | null
          id?: string
          imagen_url?: string | null
          opciones: Json
          pregunta: string
          respuesta_correcta: number
          sesion_id: string
          tiempo_limite?: number | null
        }
        Update: {
          explicacion?: string | null
          id?: string
          imagen_url?: string | null
          opciones?: Json
          pregunta?: string
          respuesta_correcta?: number
          sesion_id?: string
          tiempo_limite?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_preguntas_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_respuestas: {
        Row: {
          correcta: boolean
          created_at: string | null
          id: string
          pregunta_id: string
          tiempo_usado: number | null
          user_id: string
        }
        Insert: {
          correcta: boolean
          created_at?: string | null
          id?: string
          pregunta_id: string
          tiempo_usado?: number | null
          user_id: string
        }
        Update: {
          correcta?: boolean
          created_at?: string | null
          id?: string
          pregunta_id?: string
          tiempo_usado?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_respuestas_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "quiz_preguntas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_respuestas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resultados_ejercicios_concentracion: {
        Row: {
          completado: boolean
          ejercicio_id: string
          fecha: string
          id: string
          metricas: Json
          user_id: string
        }
        Insert: {
          completado?: boolean
          ejercicio_id: string
          fecha?: string
          id?: string
          metricas?: Json
          user_id: string
        }
        Update: {
          completado?: boolean
          ejercicio_id?: string
          fecha?: string
          id?: string
          metricas?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resultados_ejercicios_concentracion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resultados_tests: {
        Row: {
          completado: boolean
          fecha: string
          id: string
          interpretacion: string | null
          puntaje_por_subescala: Json | null
          puntaje_total: number | null
          test_id: string
          tiempo_real_segundos: number | null
          user_id: string
        }
        Insert: {
          completado?: boolean
          fecha?: string
          id?: string
          interpretacion?: string | null
          puntaje_por_subescala?: Json | null
          puntaje_total?: number | null
          test_id: string
          tiempo_real_segundos?: number | null
          user_id: string
        }
        Update: {
          completado?: boolean
          fecha?: string
          id?: string
          interpretacion?: string | null
          puntaje_por_subescala?: Json | null
          puntaje_total?: number | null
          test_id?: string
          tiempo_real_segundos?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resultados_tests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones: {
        Row: {
          curso_id: string
          descripcion: string | null
          estado: string | null
          id: string
          orden: number
          titulo: string
        }
        Insert: {
          curso_id: string
          descripcion?: string | null
          estado?: string | null
          id?: string
          orden: number
          titulo: string
        }
        Update: {
          curso_id?: string
          descripcion?: string | null
          estado?: string | null
          id?: string
          orden?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones_usuarios: {
        Row: {
          created_at: string | null
          desbloqueada: boolean
          id: string
          sesion_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          desbloqueada?: boolean
          id?: string
          sesion_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          desbloqueada?: boolean
          id?: string
          sesion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_usuarios_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_usuarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          activo: boolean | null
          id: string
          rol: string | null
          user_id: string
        }
        Insert: {
          activo?: boolean | null
          id?: string
          rol?: string | null
          user_id: string
        }
        Update: {
          activo?: boolean | null
          id?: string
          rol?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_enrolled: {
        Args: { _curso_id: string; _user_id: string }
        Returns: boolean
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
