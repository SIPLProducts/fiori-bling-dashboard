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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          contact: string | null
          created_at: string
          department: string | null
          display_name: string | null
          distribution_channel: string | null
          email: string | null
          employee_id: string | null
          first_name: string | null
          id: string
          info1: string | null
          info2: string | null
          last_name: string | null
          plant: string | null
          purchase_group: string | null
          status: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          contact?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          distribution_channel?: string | null
          email?: string | null
          employee_id?: string | null
          first_name?: string | null
          id: string
          info1?: string | null
          info2?: string | null
          last_name?: string | null
          plant?: string | null
          purchase_group?: string | null
          status?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          contact?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          distribution_channel?: string | null
          email?: string | null
          employee_id?: string | null
          first_name?: string | null
          id?: string
          info1?: string | null
          info2?: string | null
          last_name?: string | null
          plant?: string | null
          purchase_group?: string | null
          status?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      role_screens: {
        Row: {
          created_at: string
          role_key: string
          screen_key: string
        }
        Insert: {
          created_at?: string
          role_key: string
          screen_key: string
        }
        Update: {
          created_at?: string
          role_key?: string
          screen_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_screens_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["key"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          is_system: boolean
          key: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_system?: boolean
          key: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_system?: boolean
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      sap_endpoints: {
        Row: {
          auth_type: string
          body_template: string | null
          created_at: string
          description: string | null
          endpoint_path: string
          headers: Json
          http_method: string
          id: string
          is_active: boolean
          last_run_at: string | null
          last_run_status: string | null
          last_synced_at: string | null
          last_test_duration_ms: number | null
          last_test_message: string | null
          last_test_status: string | null
          module_key: string
          name: string
          query_params: Json
          response_notes: string | null
          response_root: string | null
          sample_response: string | null
          schedule_expression: string | null
          scheduler_enabled: boolean
          system_key: string | null
          updated_at: string
        }
        Insert: {
          auth_type?: string
          body_template?: string | null
          created_at?: string
          description?: string | null
          endpoint_path?: string
          headers?: Json
          http_method?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_status?: string | null
          last_synced_at?: string | null
          last_test_duration_ms?: number | null
          last_test_message?: string | null
          last_test_status?: string | null
          module_key?: string
          name: string
          query_params?: Json
          response_notes?: string | null
          response_root?: string | null
          sample_response?: string | null
          schedule_expression?: string | null
          scheduler_enabled?: boolean
          system_key?: string | null
          updated_at?: string
        }
        Update: {
          auth_type?: string
          body_template?: string | null
          created_at?: string
          description?: string | null
          endpoint_path?: string
          headers?: Json
          http_method?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_status?: string | null
          last_synced_at?: string | null
          last_test_duration_ms?: number | null
          last_test_message?: string | null
          last_test_status?: string | null
          module_key?: string
          name?: string
          query_params?: Json
          response_notes?: string | null
          response_root?: string | null
          sample_response?: string | null
          schedule_expression?: string | null
          scheduler_enabled?: boolean
          system_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sap_middleware_config: {
        Row: {
          connection_mode: string
          created_at: string
          deployment_mode: string
          id: string
          last_test_at: string | null
          last_test_message: string | null
          last_test_status: string | null
          middleware_port: number
          middleware_url: string
          singleton: boolean
          updated_at: string
        }
        Insert: {
          connection_mode?: string
          created_at?: string
          deployment_mode?: string
          id?: string
          last_test_at?: string | null
          last_test_message?: string | null
          last_test_status?: string | null
          middleware_port?: number
          middleware_url?: string
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          connection_mode?: string
          created_at?: string
          deployment_mode?: string
          id?: string
          last_test_at?: string | null
          last_test_message?: string | null
          last_test_status?: string | null
          middleware_port?: number
          middleware_url?: string
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sap_systems: {
        Row: {
          base_url: string
          created_at: string
          environment: string
          id: string
          is_active: boolean
          key: string
          label: string
          last_test_at: string | null
          last_test_message: string | null
          last_test_status: string | null
          sap_client: string | null
          sort_order: number
          updated_at: string
          username: string | null
        }
        Insert: {
          base_url?: string
          created_at?: string
          environment?: string
          id?: string
          is_active?: boolean
          key: string
          label: string
          last_test_at?: string | null
          last_test_message?: string | null
          last_test_status?: string | null
          sap_client?: string | null
          sort_order?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          base_url?: string
          created_at?: string
          environment?: string
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          last_test_at?: string | null
          last_test_message?: string | null
          last_test_status?: string | null
          sap_client?: string | null
          sort_order?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      tile_groups: {
        Row: {
          created_at: string
          id: string
          key: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      tiles: {
        Row: {
          allowed_roles: Database["public"]["Enums"]["app_role"][]
          created_at: string
          group_key: string
          icon: string
          id: string
          kind: string
          kpi_key: string | null
          sort_order: number
          subtitle: string | null
          target_path: string | null
          title: string
        }
        Insert: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][]
          created_at?: string
          group_key: string
          icon?: string
          id?: string
          kind?: string
          kpi_key?: string | null
          sort_order?: number
          subtitle?: string | null
          target_path?: string | null
          title: string
        }
        Update: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][]
          created_at?: string
          group_key?: string
          icon?: string
          id?: string
          kind?: string
          kpi_key?: string | null
          sort_order?: number
          subtitle?: string | null
          target_path?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiles_group_key_fkey"
            columns: ["group_key"]
            isOneToOne: false
            referencedRelation: "tile_groups"
            referencedColumns: ["key"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          created_at: string
          id: string
          role_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["key"]
          },
        ]
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
      admin_confirm_user_email: {
        Args: { _user_id: string }
        Returns: undefined
      }
      admin_set_user_password: {
        Args: { _new_password: string; _user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_screen: {
        Args: { _screen: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      resolve_login_email: { Args: { _identifier: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "buyer" | "approver" | "viewer"
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
      app_role: ["admin", "buyer", "approver", "viewer"],
    },
  },
} as const
