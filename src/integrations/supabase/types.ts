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
      agent_conversations: {
        Row: {
          agent_id: string
          brand: string
          created_at: string | null
          id: string
          last_analysis: string | null
          last_analysis_at: string | null
          messages: Json | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          brand: string
          created_at?: string | null
          id?: string
          last_analysis?: string | null
          last_analysis_at?: string | null
          messages?: Json | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          brand?: string
          created_at?: string | null
          id?: string
          last_analysis?: string | null
          last_analysis_at?: string | null
          messages?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_daily_runs: {
        Row: {
          agent_id: string
          brand: string
          error_message: string | null
          id: string
          ran_at: string | null
          result: string | null
          status: string | null
        }
        Insert: {
          agent_id: string
          brand: string
          error_message?: string | null
          id?: string
          ran_at?: string | null
          result?: string | null
          status?: string | null
        }
        Update: {
          agent_id?: string
          brand?: string
          error_message?: string | null
          id?: string
          ran_at?: string | null
          result?: string | null
          status?: string | null
        }
        Relationships: []
      }
      creativos: {
        Row: {
          angulo: string | null
          brand: string
          clicks: number | null
          conversiones: number | null
          cpa: number | null
          cpc: number | null
          creador: string | null
          created_at: string | null
          ctr: number | null
          duracion_seg: number | null
          estado: string | null
          fecha_lanzamiento: string | null
          formato: string | null
          hook_text: string | null
          id: string
          impresiones: number | null
          nombre: string
          plataforma: string | null
          revenue: number | null
          roas: number | null
          spend: number | null
          tags: string[] | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          angulo?: string | null
          brand: string
          clicks?: number | null
          conversiones?: number | null
          cpa?: number | null
          cpc?: number | null
          creador?: string | null
          created_at?: string | null
          ctr?: number | null
          duracion_seg?: number | null
          estado?: string | null
          fecha_lanzamiento?: string | null
          formato?: string | null
          hook_text?: string | null
          id?: string
          impresiones?: number | null
          nombre: string
          plataforma?: string | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          tags?: string[] | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          angulo?: string | null
          brand?: string
          clicks?: number | null
          conversiones?: number | null
          cpa?: number | null
          cpc?: number | null
          creador?: string | null
          created_at?: string | null
          ctr?: number | null
          duracion_seg?: number | null
          estado?: string | null
          fecha_lanzamiento?: string | null
          formato?: string | null
          hook_text?: string | null
          id?: string
          impresiones?: number | null
          nombre?: string
          plataforma?: string | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          tags?: string[] | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          anuncios: number | null
          brand: string
          canal: string
          cogs: number | null
          comision_tts: number | null
          costo_host: number | null
          created_at: string | null
          date: string
          descuentos: number | null
          devoluciones: number | null
          edited_by: string | null
          gastos_fijos: number | null
          guias: number | null
          id: string
          iva_ads: number | null
          nomina: number | null
          pedidos: number | null
          retenciones: number | null
          source: string | null
          updated_at: string | null
          ventas_brutas: number | null
        }
        Insert: {
          anuncios?: number | null
          brand: string
          canal: string
          cogs?: number | null
          comision_tts?: number | null
          costo_host?: number | null
          created_at?: string | null
          date: string
          descuentos?: number | null
          devoluciones?: number | null
          edited_by?: string | null
          gastos_fijos?: number | null
          guias?: number | null
          id?: string
          iva_ads?: number | null
          nomina?: number | null
          pedidos?: number | null
          retenciones?: number | null
          source?: string | null
          updated_at?: string | null
          ventas_brutas?: number | null
        }
        Update: {
          anuncios?: number | null
          brand?: string
          canal?: string
          cogs?: number | null
          comision_tts?: number | null
          costo_host?: number | null
          created_at?: string | null
          date?: string
          descuentos?: number | null
          devoluciones?: number | null
          edited_by?: string | null
          gastos_fijos?: number | null
          guias?: number | null
          id?: string
          iva_ads?: number | null
          nomina?: number | null
          pedidos?: number | null
          retenciones?: number | null
          source?: string | null
          updated_at?: string | null
          ventas_brutas?: number | null
        }
        Relationships: []
      }
      kpis_monthly: {
        Row: {
          brand: string
          clasificacion: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          kpi_name: string
          kpi_slug: string
          periodo: string
          status: string | null
          unidad: string | null
          updated_at: string | null
          valor_actual: number | null
          valor_target: number | null
        }
        Insert: {
          brand: string
          clasificacion?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          kpi_name: string
          kpi_slug: string
          periodo: string
          status?: string | null
          unidad?: string | null
          updated_at?: string | null
          valor_actual?: number | null
          valor_target?: number | null
        }
        Update: {
          brand?: string
          clasificacion?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          kpi_name?: string
          kpi_slug?: string
          periodo?: string
          status?: string | null
          unidad?: string | null
          updated_at?: string | null
          valor_actual?: number | null
          valor_target?: number | null
        }
        Relationships: []
      }
      lives_analysis: {
        Row: {
          ads: number | null
          aov: number | null
          brand: string | null
          costo_host: number | null
          created_at: string | null
          dalilo: number | null
          duracion: string | null
          envio_comision_tt: number | null
          fecha: string
          gasto_total: number | null
          hora: string | null
          host: string | null
          id: string
          impuestos: number | null
          iva_ads: number | null
          margen: number | null
          mercancias: number | null
          notas: string | null
          pedidos: number | null
          roas_live: number | null
          roi: number | null
          tatuajes: number | null
          updated_at: string | null
          utilidad: number | null
          venta: number | null
        }
        Insert: {
          ads?: number | null
          aov?: number | null
          brand?: string | null
          costo_host?: number | null
          created_at?: string | null
          dalilo?: number | null
          duracion?: string | null
          envio_comision_tt?: number | null
          fecha: string
          gasto_total?: number | null
          hora?: string | null
          host?: string | null
          id?: string
          impuestos?: number | null
          iva_ads?: number | null
          margen?: number | null
          mercancias?: number | null
          notas?: string | null
          pedidos?: number | null
          roas_live?: number | null
          roi?: number | null
          tatuajes?: number | null
          updated_at?: string | null
          utilidad?: number | null
          venta?: number | null
        }
        Update: {
          ads?: number | null
          aov?: number | null
          brand?: string | null
          costo_host?: number | null
          created_at?: string | null
          dalilo?: number | null
          duracion?: string | null
          envio_comision_tt?: number | null
          fecha?: string
          gasto_total?: number | null
          hora?: string | null
          host?: string | null
          id?: string
          impuestos?: number | null
          iva_ads?: number | null
          margen?: number | null
          mercancias?: number | null
          notas?: string | null
          pedidos?: number | null
          roas_live?: number | null
          roi?: number | null
          tatuajes?: number | null
          updated_at?: string | null
          utilidad?: number | null
          venta?: number | null
        }
        Relationships: []
      }
      margin_scenarios: {
        Row: {
          aov: number | null
          brand: string
          costo_host: number | null
          cpa_proyectado: number | null
          created_at: string | null
          id: string
          margen_estimado: number | null
          nombre: string
          profit_unitario: number | null
          roas_objetivo: number | null
          updated_at: string | null
        }
        Insert: {
          aov?: number | null
          brand: string
          costo_host?: number | null
          cpa_proyectado?: number | null
          created_at?: string | null
          id?: string
          margen_estimado?: number | null
          nombre: string
          profit_unitario?: number | null
          roas_objetivo?: number | null
          updated_at?: string | null
        }
        Update: {
          aov?: number | null
          brand?: string
          costo_host?: number | null
          cpa_proyectado?: number | null
          created_at?: string | null
          id?: string
          margen_estimado?: number | null
          nombre?: string
          profit_unitario?: number | null
          roas_objetivo?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      objetivos: {
        Row: {
          actual_value: number | null
          asana_gid: string | null
          brand: string
          canal: string | null
          cantidad_lives: number | null
          comentarios_bien: string | null
          comentarios_mal: string | null
          created_at: string
          data_source: string | null
          horas_lives: number | null
          id: string
          meta_roas: number | null
          meta_value: number | null
          objetivo: string
          periodo: string
          presupuesto_invertido: number | null
          presupuesto_mensual: number | null
          responsable: string | null
          resultado_venta: number | null
          semaforo: string | null
          tareas_prioritarias: string | null
          tipo: string | null
          unidad: string | null
          updated_at: string
          weekly_feedback: Json | null
        }
        Insert: {
          actual_value?: number | null
          asana_gid?: string | null
          brand: string
          canal?: string | null
          cantidad_lives?: number | null
          comentarios_bien?: string | null
          comentarios_mal?: string | null
          created_at?: string
          data_source?: string | null
          horas_lives?: number | null
          id?: string
          meta_roas?: number | null
          meta_value?: number | null
          objetivo: string
          periodo: string
          presupuesto_invertido?: number | null
          presupuesto_mensual?: number | null
          responsable?: string | null
          resultado_venta?: number | null
          semaforo?: string | null
          tareas_prioritarias?: string | null
          tipo?: string | null
          unidad?: string | null
          updated_at?: string
          weekly_feedback?: Json | null
        }
        Update: {
          actual_value?: number | null
          asana_gid?: string | null
          brand?: string
          canal?: string | null
          cantidad_lives?: number | null
          comentarios_bien?: string | null
          comentarios_mal?: string | null
          created_at?: string
          data_source?: string | null
          horas_lives?: number | null
          id?: string
          meta_roas?: number | null
          meta_value?: number | null
          objetivo?: string
          periodo?: string
          presupuesto_invertido?: number | null
          presupuesto_mensual?: number | null
          responsable?: string | null
          resultado_venta?: number | null
          semaforo?: string | null
          tareas_prioritarias?: string | null
          tipo?: string | null
          unidad?: string | null
          updated_at?: string
          weekly_feedback?: Json | null
        }
        Relationships: []
      }
      organico_posts: {
        Row: {
          angulo: string | null
          brand: string
          caption: string | null
          comentarios: number | null
          created_at: string | null
          es_viral: boolean | null
          fecha_publicacion: string | null
          hashtags: string[] | null
          id: string
          likes: number | null
          plataforma: string
          saves: number | null
          shares: number | null
          tipo: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          angulo?: string | null
          brand: string
          caption?: string | null
          comentarios?: number | null
          created_at?: string | null
          es_viral?: boolean | null
          fecha_publicacion?: string | null
          hashtags?: string[] | null
          id?: string
          likes?: number | null
          plataforma: string
          saves?: number | null
          shares?: number | null
          tipo?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          angulo?: string | null
          brand?: string
          caption?: string | null
          comentarios?: number | null
          created_at?: string | null
          es_viral?: boolean | null
          fecha_publicacion?: string | null
          hashtags?: string[] | null
          id?: string
          likes?: number | null
          plataforma?: string
          saves?: number | null
          shares?: number | null
          tipo?: string | null
          updated_at?: string | null
          views?: number | null
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
