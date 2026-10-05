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
      app_crypto_keys: {
        Row: {
          key_value: string
          name: string
        }
        Insert: {
          key_value: string
          name: string
        }
        Update: {
          key_value?: string
          name?: string
        }
        Relationships: []
      }
      open_sales_orders: {
        Row: {
          country: string | null
          created_at: string
          currency: string | null
          customer_bill_to: string | null
          customer_bill_to_name: string | null
          customer_ship_to: string | null
          customer_ship_to_name: string | null
          customer_sold_to: string | null
          customer_sold_to_name: string | null
          days_open: number
          delivery_date: string | null
          delivery_status: string | null
          distribution_channel: string | null
          division: string | null
          id: string
          is_active_snapshot: boolean
          material: string | null
          material_description: string | null
          material_type: string | null
          occurrence_no: number
          open_quantity: number
          open_value: number
          order_date: string | null
          order_type: string | null
          overall_status: string | null
          plant: string | null
          preceding_document: string | null
          product_category: string | null
          profit_center: string | null
          purchase_order: string | null
          purchase_order_date: string | null
          quantity: number
          raw: Json
          record_key: string
          region: string | null
          row_hash: string
          sales_group: string | null
          sales_office: string | null
          sales_order: string
          sales_order_item: string | null
          sales_org: string | null
          sales_type: string | null
          snapshot_id: string
          source_endpoint: string
          sync_scope_key: string
          synced_at: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          currency?: string | null
          customer_bill_to?: string | null
          customer_bill_to_name?: string | null
          customer_ship_to?: string | null
          customer_ship_to_name?: string | null
          customer_sold_to?: string | null
          customer_sold_to_name?: string | null
          days_open?: number
          delivery_date?: string | null
          delivery_status?: string | null
          distribution_channel?: string | null
          division?: string | null
          id?: string
          is_active_snapshot?: boolean
          material?: string | null
          material_description?: string | null
          material_type?: string | null
          occurrence_no?: number
          open_quantity?: number
          open_value?: number
          order_date?: string | null
          order_type?: string | null
          overall_status?: string | null
          plant?: string | null
          preceding_document?: string | null
          product_category?: string | null
          profit_center?: string | null
          purchase_order?: string | null
          purchase_order_date?: string | null
          quantity?: number
          raw?: Json
          record_key: string
          region?: string | null
          row_hash: string
          sales_group?: string | null
          sales_office?: string | null
          sales_order: string
          sales_order_item?: string | null
          sales_org?: string | null
          sales_type?: string | null
          snapshot_id: string
          source_endpoint: string
          sync_scope_key: string
          synced_at?: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          currency?: string | null
          customer_bill_to?: string | null
          customer_bill_to_name?: string | null
          customer_ship_to?: string | null
          customer_ship_to_name?: string | null
          customer_sold_to?: string | null
          customer_sold_to_name?: string | null
          days_open?: number
          delivery_date?: string | null
          delivery_status?: string | null
          distribution_channel?: string | null
          division?: string | null
          id?: string
          is_active_snapshot?: boolean
          material?: string | null
          material_description?: string | null
          material_type?: string | null
          occurrence_no?: number
          open_quantity?: number
          open_value?: number
          order_date?: string | null
          order_type?: string | null
          overall_status?: string | null
          plant?: string | null
          preceding_document?: string | null
          product_category?: string | null
          profit_center?: string | null
          purchase_order?: string | null
          purchase_order_date?: string | null
          quantity?: number
          raw?: Json
          record_key?: string
          region?: string | null
          row_hash?: string
          sales_group?: string | null
          sales_office?: string | null
          sales_order?: string
          sales_order_item?: string | null
          sales_org?: string | null
          sales_type?: string | null
          snapshot_id?: string
          source_endpoint?: string
          sync_scope_key?: string
          synced_at?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
      sales_revenue_targets: {
        Row: {
          created_at: string
          fiscal_year: string
          target_amount: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          fiscal_year: string
          target_amount: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          fiscal_year?: string
          target_amount?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      sap_credentials: {
        Row: {
          cred_key: string
          secret: string
          updated_at: string
        }
        Insert: {
          cred_key: string
          secret: string
          updated_at?: string
        }
        Update: {
          cred_key?: string
          secret?: string
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
          posting_range: string
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
          posting_range?: string
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
          posting_range?: string
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
      sap_sync_runs: {
        Row: {
          created_at: string
          duration_ms: number
          endpoint: string
          error_message: string | null
          finished_at: string | null
          http_status: number | null
          id: string
          records_inserted: number
          records_invalid: number
          records_received: number
          records_replaced: number
          records_skipped: number
          records_stored: number
          records_updated: number
          request_snapshot: Json | null
          response_bytes: number
          snapshot_id: string | null
          started_at: string
          status: string
          sync_scope_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number
          endpoint: string
          error_message?: string | null
          finished_at?: string | null
          http_status?: number | null
          id?: string
          records_inserted?: number
          records_invalid?: number
          records_received?: number
          records_replaced?: number
          records_skipped?: number
          records_stored?: number
          records_updated?: number
          request_snapshot?: Json | null
          response_bytes?: number
          snapshot_id?: string | null
          started_at?: string
          status?: string
          sync_scope_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number
          endpoint?: string
          error_message?: string | null
          finished_at?: string | null
          http_status?: number | null
          id?: string
          records_inserted?: number
          records_invalid?: number
          records_received?: number
          records_replaced?: number
          records_skipped?: number
          records_stored?: number
          records_updated?: number
          request_snapshot?: Json | null
          response_bytes?: number
          snapshot_id?: string | null
          started_at?: string
          status?: string
          sync_scope_key?: string | null
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
      sap_table_fields: {
        Row: {
          created_at: string
          data_type: string
          field_name: string
          id: string
          is_key: boolean
          is_required: boolean
          sap_field: string
          sort_order: number
          table_key: string
          ui_label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_type?: string
          field_name: string
          id?: string
          is_key?: boolean
          is_required?: boolean
          sap_field: string
          sort_order?: number
          table_key: string
          ui_label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_type?: string
          field_name?: string
          id?: string
          is_key?: boolean
          is_required?: boolean
          sap_field?: string
          sort_order?: number
          table_key?: string
          ui_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      sap_table_mappings: {
        Row: {
          api_name: string | null
          created_at: string
          description: string | null
          display_name: string
          endpoint_id: string | null
          id: string
          last_sync_records: number
          last_sync_status: string | null
          last_synced_at: string | null
          owner_user_id: string | null
          schedule_expression: string
          sync_enabled: boolean
          table_key: string
          table_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          api_name?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          endpoint_id?: string | null
          id?: string
          last_sync_records?: number
          last_sync_status?: string | null
          last_synced_at?: string | null
          owner_user_id?: string | null
          schedule_expression?: string
          sync_enabled?: boolean
          table_key: string
          table_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          api_name?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          endpoint_id?: string | null
          id?: string
          last_sync_records?: number
          last_sync_status?: string | null
          last_synced_at?: string | null
          owner_user_id?: string | null
          schedule_expression?: string
          sync_enabled?: boolean
          table_key?: string
          table_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sap_table_mappings_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "sap_endpoints"
            referencedColumns: ["id"]
          },
        ]
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
          screen_key: string | null
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
          screen_key?: string | null
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
          screen_key?: string | null
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
      zfisales_detail: {
        Row: {
          ah: number
          amount: number
          amount_domestic: number
          amount_export: number
          amount_gross: number
          amount_net: number
          amount_service: number
          branch: string | null
          business_segment: string | null
          company_code: string | null
          company_name: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          customer: string | null
          customer_group: string | null
          customer_name: string | null
          customer_profile: string | null
          division: string | null
          division_name: string | null
          doc_date: string | null
          doc_item: string | null
          doc_no: string | null
          doc_type: string | null
          excise_duty: number
          fiscal_year: string | null
          gl: string | null
          gl_name: string | null
          grp: string | null
          id: string
          incoterms: string | null
          industry: string | null
          industry_name: string | null
          is_active_snapshot: boolean
          main_group: string | null
          material: string | null
          material_desc: string | null
          material_profit_ctr: string | null
          material_profit_ctr_name: string | null
          model: string | null
          month: string | null
          new_repl: string | null
          occurrence_no: number
          pc_short_name: string | null
          pk: string | null
          plant: string | null
          posting_date: string | null
          product_group: string | null
          product_range: string | null
          product_type: string | null
          profit_ctr: string | null
          profit_ctr_name: string | null
          quantity: number
          raw: Json | null
          record_key: string
          reference: string | null
          row_hash: string
          sales_office: string | null
          sales_order: string | null
          sales_order_item: string | null
          sales_org: string | null
          sales_rep: string | null
          sales_rep_name: string | null
          sales_type: string | null
          sales_zone: string | null
          segment: string | null
          snapshot_id: string
          source_endpoint: string | null
          sub_group: string | null
          sync_scope_key: string
          synced_at: string
          total_ah: number
          unit: string | null
          updated_at: string
          usage_desc: string | null
        }
        Insert: {
          ah?: number
          amount?: number
          amount_domestic?: number
          amount_export?: number
          amount_gross?: number
          amount_net?: number
          amount_service?: number
          branch?: string | null
          business_segment?: string | null
          company_code?: string | null
          company_name?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          customer?: string | null
          customer_group?: string | null
          customer_name?: string | null
          customer_profile?: string | null
          division?: string | null
          division_name?: string | null
          doc_date?: string | null
          doc_item?: string | null
          doc_no?: string | null
          doc_type?: string | null
          excise_duty?: number
          fiscal_year?: string | null
          gl?: string | null
          gl_name?: string | null
          grp?: string | null
          id?: string
          incoterms?: string | null
          industry?: string | null
          industry_name?: string | null
          is_active_snapshot?: boolean
          main_group?: string | null
          material?: string | null
          material_desc?: string | null
          material_profit_ctr?: string | null
          material_profit_ctr_name?: string | null
          model?: string | null
          month?: string | null
          new_repl?: string | null
          occurrence_no?: number
          pc_short_name?: string | null
          pk?: string | null
          plant?: string | null
          posting_date?: string | null
          product_group?: string | null
          product_range?: string | null
          product_type?: string | null
          profit_ctr?: string | null
          profit_ctr_name?: string | null
          quantity?: number
          raw?: Json | null
          record_key: string
          reference?: string | null
          row_hash: string
          sales_office?: string | null
          sales_order?: string | null
          sales_order_item?: string | null
          sales_org?: string | null
          sales_rep?: string | null
          sales_rep_name?: string | null
          sales_type?: string | null
          sales_zone?: string | null
          segment?: string | null
          snapshot_id: string
          source_endpoint?: string | null
          sub_group?: string | null
          sync_scope_key: string
          synced_at?: string
          total_ah?: number
          unit?: string | null
          updated_at?: string
          usage_desc?: string | null
        }
        Update: {
          ah?: number
          amount?: number
          amount_domestic?: number
          amount_export?: number
          amount_gross?: number
          amount_net?: number
          amount_service?: number
          branch?: string | null
          business_segment?: string | null
          company_code?: string | null
          company_name?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          customer?: string | null
          customer_group?: string | null
          customer_name?: string | null
          customer_profile?: string | null
          division?: string | null
          division_name?: string | null
          doc_date?: string | null
          doc_item?: string | null
          doc_no?: string | null
          doc_type?: string | null
          excise_duty?: number
          fiscal_year?: string | null
          gl?: string | null
          gl_name?: string | null
          grp?: string | null
          id?: string
          incoterms?: string | null
          industry?: string | null
          industry_name?: string | null
          is_active_snapshot?: boolean
          main_group?: string | null
          material?: string | null
          material_desc?: string | null
          material_profit_ctr?: string | null
          material_profit_ctr_name?: string | null
          model?: string | null
          month?: string | null
          new_repl?: string | null
          occurrence_no?: number
          pc_short_name?: string | null
          pk?: string | null
          plant?: string | null
          posting_date?: string | null
          product_group?: string | null
          product_range?: string | null
          product_type?: string | null
          profit_ctr?: string | null
          profit_ctr_name?: string | null
          quantity?: number
          raw?: Json | null
          record_key?: string
          reference?: string | null
          row_hash?: string
          sales_office?: string | null
          sales_order?: string | null
          sales_order_item?: string | null
          sales_org?: string | null
          sales_rep?: string | null
          sales_rep_name?: string | null
          sales_type?: string | null
          sales_zone?: string | null
          segment?: string | null
          snapshot_id?: string
          source_endpoint?: string | null
          sub_group?: string | null
          sync_scope_key?: string
          synced_at?: string
          total_ah?: number
          unit?: string | null
          updated_at?: string
          usage_desc?: string | null
        }
        Relationships: []
      }
      ztbn: {
        Row: {
          coff100001_credit: number
          coff100001_debit: number
          coff100002_credit: number
          coff100002_debit: number
          coff100003_credit: number
          coff100003_debit: number
          coff100004_credit: number
          coff100004_debit: number
          cumm_balance: number
          gl_code: string | null
          gl_description: string | null
          id: string
          imported_at: string
          lglmd15001_credit: number
          lglmd15001_debit: number
          lglmd15002_credit: number
          lglmd15002_debit: number
          lglmd15007_credit: number
          lglmd15007_debit: number
          lgsbd14001_credit: number
          lgsbd14001_debit: number
          lgsbd14002_credit: number
          lgsbd14002_debit: number
          lgsbd14007_credit: number
          lgsbd14007_debit: number
          lgsbd14008_credit: number
          lgsbd14008_debit: number
          lgsbd14009_credit: number
          lgsbd14009_debit: number
          lgsbd14010_credit: number
          lgsbd14010_debit: number
          lgtdd14011_credit: number
          lgtdd14011_debit: number
          lgvrd16001_credit: number
          lgvrd16001_debit: number
          lgvrd16003_credit: number
          lgvrd16003_debit: number
          lgvrd16005_credit: number
          lgvrd16005_debit: number
          pddpu13001_credit: number
          pddpu13001_debit: number
          pddpu13002_credit: number
          pddpu13002_debit: number
          pddpu13003_credit: number
          pddpu13003_debit: number
          pddpu13004_credit: number
          pddpu13004_debit: number
          pddpu13005_credit: number
          pddpu13005_debit: number
          pddpu17001_credit: number
          pddpu17001_debit: number
          pdmmu14001_credit: number
          pdmmu14001_debit: number
          pdmmu14002_credit: number
          pdmmu14002_debit: number
          pdpeu14001_credit: number
          pdpeu14001_debit: number
          pdpeu14002_credit: number
          pdpeu14002_debit: number
          pdpeu14003_credit: number
          pdpeu14003_debit: number
          pdpeu14004_credit: number
          pdpeu14004_debit: number
          pdpeu14005_credit: number
          pdpeu14005_debit: number
          pdscu16001_credit: number
          pdscu16001_debit: number
          pdscu18001_credit: number
          pdscu18001_debit: number
          pdscu18002_credit: number
          pdscu18002_debit: number
          pdscu18101_credit: number
          pdscu18101_debit: number
          pgapd11001_credit: number
          pgapd11001_debit: number
          pgapd11002_credit: number
          pgapd11002_debit: number
          pgapd11003_credit: number
          pgapd11003_debit: number
          pgapd11004_credit: number
          pgapd11004_debit: number
          pgapd11005_credit: number
          pgapd11005_debit: number
          pgapd11006_credit: number
          pgapd11006_debit: number
          pgapd11007_credit: number
          pgapd11007_debit: number
          pgcmu14011_credit: number
          pgcmu14011_debit: number
          pgdfz21002_credit: number
          pgdfz21002_debit: number
          pgdrm21001_credit: number
          pgdrm21001_debit: number
          pgnlb11001_credit: number
          pgnlb11001_debit: number
          pgnlb11002_credit: number
          pgnlb11002_debit: number
          pgnlb11004_credit: number
          pgnlb11004_debit: number
          pgnlb11005_credit: number
          pgnlb11005_debit: number
          pgnlb11006_credit: number
          pgnlb11006_debit: number
          pgnlb11007_credit: number
          pgnlb11007_debit: number
          pgnlb11201_credit: number
          pgnlb11201_debit: number
          pgnlb12001_credit: number
          pgnlb12001_debit: number
          pgnlb12005_credit: number
          pgnlb12005_debit: number
          pgped11001_credit: number
          pgped11001_debit: number
          pgped11002_credit: number
          pgped11002_debit: number
          pgped11003_credit: number
          pgped11003_debit: number
          pgped12002_credit: number
          pgped12002_debit: number
          pgped13001_credit: number
          pgped13001_debit: number
          pgped13002_credit: number
          pgped13002_debit: number
          pgped13003_credit: number
          pgped13003_debit: number
          pgped13004_credit: number
          pgped13004_debit: number
          pgped13005_credit: number
          pgped13005_debit: number
          pgped13006_credit: number
          pgped13006_debit: number
          pgped13007_credit: number
          pgped13007_debit: number
          pgped13008_credit: number
          pgped13008_debit: number
          pgped13009_credit: number
          pgped13009_debit: number
          pgped13010_credit: number
          pgped13010_debit: number
          pgped13011_credit: number
          pgped13011_debit: number
          pgped13012_credit: number
          pgped13012_debit: number
          pgplc22001_credit: number
          pgplc22001_debit: number
          pgplc23001_credit: number
          pgplc23001_debit: number
          prd1100_credit: number
          prd1100_debit: number
          prd1300_credit: number
          prd1300_debit: number
          prd2000_credit: number
          prd2000_debit: number
          rdradb0102_credit: number
          rdradb0102_debit: number
          sdgpu10001_credit: number
          sdgpu10001_debit: number
          sdsmu14001_credit: number
          sdsmu14001_debit: number
          sdsmu14002_credit: number
          sdsmu14002_debit: number
          sdsmu14003_credit: number
          sdsmu14003_debit: number
          sdssu10002_credit: number
          sdssu10002_debit: number
          sdssu10003_credit: number
          sdssu10003_debit: number
          ser1100_credit: number
          ser1100_debit: number
          ser1300_credit: number
          ser1300_debit: number
          ser1400_credit: number
          ser1400_debit: number
          ser2000_credit: number
          ser2000_debit: number
          serb010_credit: number
          serb010_debit: number
          serb011_credit: number
          serb011_debit: number
          serb012_credit: number
          serb012_debit: number
          serb020_credit: number
          serb020_debit: number
          serb030_credit: number
          serb030_debit: number
          serb040_credit: number
          serb040_debit: number
          serb050_credit: number
          serb050_debit: number
          serb051_credit: number
          serb051_debit: number
          serb060_credit: number
          serb060_debit: number
          serb070_credit: number
          serb070_debit: number
          serb071_credit: number
          serb071_debit: number
          serb080_credit: number
          serb080_debit: number
          serb090_credit: number
          serb090_debit: number
          serb100_credit: number
          serb100_debit: number
          serb101_credit: number
          serb101_debit: number
          serb110_credit: number
          serb110_debit: number
          serb111_credit: number
          serb111_debit: number
          serb120_credit: number
          serb120_debit: number
          serb130_credit: number
          serb130_debit: number
          serb140_credit: number
          serb140_debit: number
          serb141_credit: number
          serb141_debit: number
          serb150_credit: number
          serb150_debit: number
          serb160_credit: number
          serb160_debit: number
          serb161_credit: number
          serb161_debit: number
          serb170_credit: number
          serb170_debit: number
          serb171_credit: number
          serb171_debit: number
          serb172_credit: number
          serb172_debit: number
          serd100_credit: number
          serd100_debit: number
          serd101_credit: number
          serd101_debit: number
          serd200_credit: number
          serd200_debit: number
          serd300_credit: number
          serd300_debit: number
          serd400_credit: number
          serd400_debit: number
          serd500_credit: number
          serd500_debit: number
          serd600_credit: number
          serd600_debit: number
          source_row_no: number
          tclwt001_credit: number
          tclwt001_debit: number
          tclwt002_credit: number
          tclwt002_debit: number
          tclwt003_credit: number
          tclwt003_debit: number
          tclwt004_credit: number
          tclwt004_debit: number
          tclwt005_credit: number
          tclwt005_debit: number
          tclwt006_credit: number
          tclwt006_debit: number
          tclwt007_credit: number
          tclwt007_debit: number
          tclwt008_credit: number
          tclwt008_debit: number
          tclwt009_credit: number
          tclwt009_debit: number
          tclwt010_credit: number
          tclwt010_debit: number
        }
        Insert: {
          coff100001_credit?: number
          coff100001_debit?: number
          coff100002_credit?: number
          coff100002_debit?: number
          coff100003_credit?: number
          coff100003_debit?: number
          coff100004_credit?: number
          coff100004_debit?: number
          cumm_balance?: number
          gl_code?: string | null
          gl_description?: string | null
          id?: string
          imported_at?: string
          lglmd15001_credit?: number
          lglmd15001_debit?: number
          lglmd15002_credit?: number
          lglmd15002_debit?: number
          lglmd15007_credit?: number
          lglmd15007_debit?: number
          lgsbd14001_credit?: number
          lgsbd14001_debit?: number
          lgsbd14002_credit?: number
          lgsbd14002_debit?: number
          lgsbd14007_credit?: number
          lgsbd14007_debit?: number
          lgsbd14008_credit?: number
          lgsbd14008_debit?: number
          lgsbd14009_credit?: number
          lgsbd14009_debit?: number
          lgsbd14010_credit?: number
          lgsbd14010_debit?: number
          lgtdd14011_credit?: number
          lgtdd14011_debit?: number
          lgvrd16001_credit?: number
          lgvrd16001_debit?: number
          lgvrd16003_credit?: number
          lgvrd16003_debit?: number
          lgvrd16005_credit?: number
          lgvrd16005_debit?: number
          pddpu13001_credit?: number
          pddpu13001_debit?: number
          pddpu13002_credit?: number
          pddpu13002_debit?: number
          pddpu13003_credit?: number
          pddpu13003_debit?: number
          pddpu13004_credit?: number
          pddpu13004_debit?: number
          pddpu13005_credit?: number
          pddpu13005_debit?: number
          pddpu17001_credit?: number
          pddpu17001_debit?: number
          pdmmu14001_credit?: number
          pdmmu14001_debit?: number
          pdmmu14002_credit?: number
          pdmmu14002_debit?: number
          pdpeu14001_credit?: number
          pdpeu14001_debit?: number
          pdpeu14002_credit?: number
          pdpeu14002_debit?: number
          pdpeu14003_credit?: number
          pdpeu14003_debit?: number
          pdpeu14004_credit?: number
          pdpeu14004_debit?: number
          pdpeu14005_credit?: number
          pdpeu14005_debit?: number
          pdscu16001_credit?: number
          pdscu16001_debit?: number
          pdscu18001_credit?: number
          pdscu18001_debit?: number
          pdscu18002_credit?: number
          pdscu18002_debit?: number
          pdscu18101_credit?: number
          pdscu18101_debit?: number
          pgapd11001_credit?: number
          pgapd11001_debit?: number
          pgapd11002_credit?: number
          pgapd11002_debit?: number
          pgapd11003_credit?: number
          pgapd11003_debit?: number
          pgapd11004_credit?: number
          pgapd11004_debit?: number
          pgapd11005_credit?: number
          pgapd11005_debit?: number
          pgapd11006_credit?: number
          pgapd11006_debit?: number
          pgapd11007_credit?: number
          pgapd11007_debit?: number
          pgcmu14011_credit?: number
          pgcmu14011_debit?: number
          pgdfz21002_credit?: number
          pgdfz21002_debit?: number
          pgdrm21001_credit?: number
          pgdrm21001_debit?: number
          pgnlb11001_credit?: number
          pgnlb11001_debit?: number
          pgnlb11002_credit?: number
          pgnlb11002_debit?: number
          pgnlb11004_credit?: number
          pgnlb11004_debit?: number
          pgnlb11005_credit?: number
          pgnlb11005_debit?: number
          pgnlb11006_credit?: number
          pgnlb11006_debit?: number
          pgnlb11007_credit?: number
          pgnlb11007_debit?: number
          pgnlb11201_credit?: number
          pgnlb11201_debit?: number
          pgnlb12001_credit?: number
          pgnlb12001_debit?: number
          pgnlb12005_credit?: number
          pgnlb12005_debit?: number
          pgped11001_credit?: number
          pgped11001_debit?: number
          pgped11002_credit?: number
          pgped11002_debit?: number
          pgped11003_credit?: number
          pgped11003_debit?: number
          pgped12002_credit?: number
          pgped12002_debit?: number
          pgped13001_credit?: number
          pgped13001_debit?: number
          pgped13002_credit?: number
          pgped13002_debit?: number
          pgped13003_credit?: number
          pgped13003_debit?: number
          pgped13004_credit?: number
          pgped13004_debit?: number
          pgped13005_credit?: number
          pgped13005_debit?: number
          pgped13006_credit?: number
          pgped13006_debit?: number
          pgped13007_credit?: number
          pgped13007_debit?: number
          pgped13008_credit?: number
          pgped13008_debit?: number
          pgped13009_credit?: number
          pgped13009_debit?: number
          pgped13010_credit?: number
          pgped13010_debit?: number
          pgped13011_credit?: number
          pgped13011_debit?: number
          pgped13012_credit?: number
          pgped13012_debit?: number
          pgplc22001_credit?: number
          pgplc22001_debit?: number
          pgplc23001_credit?: number
          pgplc23001_debit?: number
          prd1100_credit?: number
          prd1100_debit?: number
          prd1300_credit?: number
          prd1300_debit?: number
          prd2000_credit?: number
          prd2000_debit?: number
          rdradb0102_credit?: number
          rdradb0102_debit?: number
          sdgpu10001_credit?: number
          sdgpu10001_debit?: number
          sdsmu14001_credit?: number
          sdsmu14001_debit?: number
          sdsmu14002_credit?: number
          sdsmu14002_debit?: number
          sdsmu14003_credit?: number
          sdsmu14003_debit?: number
          sdssu10002_credit?: number
          sdssu10002_debit?: number
          sdssu10003_credit?: number
          sdssu10003_debit?: number
          ser1100_credit?: number
          ser1100_debit?: number
          ser1300_credit?: number
          ser1300_debit?: number
          ser1400_credit?: number
          ser1400_debit?: number
          ser2000_credit?: number
          ser2000_debit?: number
          serb010_credit?: number
          serb010_debit?: number
          serb011_credit?: number
          serb011_debit?: number
          serb012_credit?: number
          serb012_debit?: number
          serb020_credit?: number
          serb020_debit?: number
          serb030_credit?: number
          serb030_debit?: number
          serb040_credit?: number
          serb040_debit?: number
          serb050_credit?: number
          serb050_debit?: number
          serb051_credit?: number
          serb051_debit?: number
          serb060_credit?: number
          serb060_debit?: number
          serb070_credit?: number
          serb070_debit?: number
          serb071_credit?: number
          serb071_debit?: number
          serb080_credit?: number
          serb080_debit?: number
          serb090_credit?: number
          serb090_debit?: number
          serb100_credit?: number
          serb100_debit?: number
          serb101_credit?: number
          serb101_debit?: number
          serb110_credit?: number
          serb110_debit?: number
          serb111_credit?: number
          serb111_debit?: number
          serb120_credit?: number
          serb120_debit?: number
          serb130_credit?: number
          serb130_debit?: number
          serb140_credit?: number
          serb140_debit?: number
          serb141_credit?: number
          serb141_debit?: number
          serb150_credit?: number
          serb150_debit?: number
          serb160_credit?: number
          serb160_debit?: number
          serb161_credit?: number
          serb161_debit?: number
          serb170_credit?: number
          serb170_debit?: number
          serb171_credit?: number
          serb171_debit?: number
          serb172_credit?: number
          serb172_debit?: number
          serd100_credit?: number
          serd100_debit?: number
          serd101_credit?: number
          serd101_debit?: number
          serd200_credit?: number
          serd200_debit?: number
          serd300_credit?: number
          serd300_debit?: number
          serd400_credit?: number
          serd400_debit?: number
          serd500_credit?: number
          serd500_debit?: number
          serd600_credit?: number
          serd600_debit?: number
          source_row_no: number
          tclwt001_credit?: number
          tclwt001_debit?: number
          tclwt002_credit?: number
          tclwt002_debit?: number
          tclwt003_credit?: number
          tclwt003_debit?: number
          tclwt004_credit?: number
          tclwt004_debit?: number
          tclwt005_credit?: number
          tclwt005_debit?: number
          tclwt006_credit?: number
          tclwt006_debit?: number
          tclwt007_credit?: number
          tclwt007_debit?: number
          tclwt008_credit?: number
          tclwt008_debit?: number
          tclwt009_credit?: number
          tclwt009_debit?: number
          tclwt010_credit?: number
          tclwt010_debit?: number
        }
        Update: {
          coff100001_credit?: number
          coff100001_debit?: number
          coff100002_credit?: number
          coff100002_debit?: number
          coff100003_credit?: number
          coff100003_debit?: number
          coff100004_credit?: number
          coff100004_debit?: number
          cumm_balance?: number
          gl_code?: string | null
          gl_description?: string | null
          id?: string
          imported_at?: string
          lglmd15001_credit?: number
          lglmd15001_debit?: number
          lglmd15002_credit?: number
          lglmd15002_debit?: number
          lglmd15007_credit?: number
          lglmd15007_debit?: number
          lgsbd14001_credit?: number
          lgsbd14001_debit?: number
          lgsbd14002_credit?: number
          lgsbd14002_debit?: number
          lgsbd14007_credit?: number
          lgsbd14007_debit?: number
          lgsbd14008_credit?: number
          lgsbd14008_debit?: number
          lgsbd14009_credit?: number
          lgsbd14009_debit?: number
          lgsbd14010_credit?: number
          lgsbd14010_debit?: number
          lgtdd14011_credit?: number
          lgtdd14011_debit?: number
          lgvrd16001_credit?: number
          lgvrd16001_debit?: number
          lgvrd16003_credit?: number
          lgvrd16003_debit?: number
          lgvrd16005_credit?: number
          lgvrd16005_debit?: number
          pddpu13001_credit?: number
          pddpu13001_debit?: number
          pddpu13002_credit?: number
          pddpu13002_debit?: number
          pddpu13003_credit?: number
          pddpu13003_debit?: number
          pddpu13004_credit?: number
          pddpu13004_debit?: number
          pddpu13005_credit?: number
          pddpu13005_debit?: number
          pddpu17001_credit?: number
          pddpu17001_debit?: number
          pdmmu14001_credit?: number
          pdmmu14001_debit?: number
          pdmmu14002_credit?: number
          pdmmu14002_debit?: number
          pdpeu14001_credit?: number
          pdpeu14001_debit?: number
          pdpeu14002_credit?: number
          pdpeu14002_debit?: number
          pdpeu14003_credit?: number
          pdpeu14003_debit?: number
          pdpeu14004_credit?: number
          pdpeu14004_debit?: number
          pdpeu14005_credit?: number
          pdpeu14005_debit?: number
          pdscu16001_credit?: number
          pdscu16001_debit?: number
          pdscu18001_credit?: number
          pdscu18001_debit?: number
          pdscu18002_credit?: number
          pdscu18002_debit?: number
          pdscu18101_credit?: number
          pdscu18101_debit?: number
          pgapd11001_credit?: number
          pgapd11001_debit?: number
          pgapd11002_credit?: number
          pgapd11002_debit?: number
          pgapd11003_credit?: number
          pgapd11003_debit?: number
          pgapd11004_credit?: number
          pgapd11004_debit?: number
          pgapd11005_credit?: number
          pgapd11005_debit?: number
          pgapd11006_credit?: number
          pgapd11006_debit?: number
          pgapd11007_credit?: number
          pgapd11007_debit?: number
          pgcmu14011_credit?: number
          pgcmu14011_debit?: number
          pgdfz21002_credit?: number
          pgdfz21002_debit?: number
          pgdrm21001_credit?: number
          pgdrm21001_debit?: number
          pgnlb11001_credit?: number
          pgnlb11001_debit?: number
          pgnlb11002_credit?: number
          pgnlb11002_debit?: number
          pgnlb11004_credit?: number
          pgnlb11004_debit?: number
          pgnlb11005_credit?: number
          pgnlb11005_debit?: number
          pgnlb11006_credit?: number
          pgnlb11006_debit?: number
          pgnlb11007_credit?: number
          pgnlb11007_debit?: number
          pgnlb11201_credit?: number
          pgnlb11201_debit?: number
          pgnlb12001_credit?: number
          pgnlb12001_debit?: number
          pgnlb12005_credit?: number
          pgnlb12005_debit?: number
          pgped11001_credit?: number
          pgped11001_debit?: number
          pgped11002_credit?: number
          pgped11002_debit?: number
          pgped11003_credit?: number
          pgped11003_debit?: number
          pgped12002_credit?: number
          pgped12002_debit?: number
          pgped13001_credit?: number
          pgped13001_debit?: number
          pgped13002_credit?: number
          pgped13002_debit?: number
          pgped13003_credit?: number
          pgped13003_debit?: number
          pgped13004_credit?: number
          pgped13004_debit?: number
          pgped13005_credit?: number
          pgped13005_debit?: number
          pgped13006_credit?: number
          pgped13006_debit?: number
          pgped13007_credit?: number
          pgped13007_debit?: number
          pgped13008_credit?: number
          pgped13008_debit?: number
          pgped13009_credit?: number
          pgped13009_debit?: number
          pgped13010_credit?: number
          pgped13010_debit?: number
          pgped13011_credit?: number
          pgped13011_debit?: number
          pgped13012_credit?: number
          pgped13012_debit?: number
          pgplc22001_credit?: number
          pgplc22001_debit?: number
          pgplc23001_credit?: number
          pgplc23001_debit?: number
          prd1100_credit?: number
          prd1100_debit?: number
          prd1300_credit?: number
          prd1300_debit?: number
          prd2000_credit?: number
          prd2000_debit?: number
          rdradb0102_credit?: number
          rdradb0102_debit?: number
          sdgpu10001_credit?: number
          sdgpu10001_debit?: number
          sdsmu14001_credit?: number
          sdsmu14001_debit?: number
          sdsmu14002_credit?: number
          sdsmu14002_debit?: number
          sdsmu14003_credit?: number
          sdsmu14003_debit?: number
          sdssu10002_credit?: number
          sdssu10002_debit?: number
          sdssu10003_credit?: number
          sdssu10003_debit?: number
          ser1100_credit?: number
          ser1100_debit?: number
          ser1300_credit?: number
          ser1300_debit?: number
          ser1400_credit?: number
          ser1400_debit?: number
          ser2000_credit?: number
          ser2000_debit?: number
          serb010_credit?: number
          serb010_debit?: number
          serb011_credit?: number
          serb011_debit?: number
          serb012_credit?: number
          serb012_debit?: number
          serb020_credit?: number
          serb020_debit?: number
          serb030_credit?: number
          serb030_debit?: number
          serb040_credit?: number
          serb040_debit?: number
          serb050_credit?: number
          serb050_debit?: number
          serb051_credit?: number
          serb051_debit?: number
          serb060_credit?: number
          serb060_debit?: number
          serb070_credit?: number
          serb070_debit?: number
          serb071_credit?: number
          serb071_debit?: number
          serb080_credit?: number
          serb080_debit?: number
          serb090_credit?: number
          serb090_debit?: number
          serb100_credit?: number
          serb100_debit?: number
          serb101_credit?: number
          serb101_debit?: number
          serb110_credit?: number
          serb110_debit?: number
          serb111_credit?: number
          serb111_debit?: number
          serb120_credit?: number
          serb120_debit?: number
          serb130_credit?: number
          serb130_debit?: number
          serb140_credit?: number
          serb140_debit?: number
          serb141_credit?: number
          serb141_debit?: number
          serb150_credit?: number
          serb150_debit?: number
          serb160_credit?: number
          serb160_debit?: number
          serb161_credit?: number
          serb161_debit?: number
          serb170_credit?: number
          serb170_debit?: number
          serb171_credit?: number
          serb171_debit?: number
          serb172_credit?: number
          serb172_debit?: number
          serd100_credit?: number
          serd100_debit?: number
          serd101_credit?: number
          serd101_debit?: number
          serd200_credit?: number
          serd200_debit?: number
          serd300_credit?: number
          serd300_debit?: number
          serd400_credit?: number
          serd400_debit?: number
          serd500_credit?: number
          serd500_debit?: number
          serd600_credit?: number
          serd600_debit?: number
          source_row_no?: number
          tclwt001_credit?: number
          tclwt001_debit?: number
          tclwt002_credit?: number
          tclwt002_debit?: number
          tclwt003_credit?: number
          tclwt003_debit?: number
          tclwt004_credit?: number
          tclwt004_debit?: number
          tclwt005_credit?: number
          tclwt005_debit?: number
          tclwt006_credit?: number
          tclwt006_debit?: number
          tclwt007_credit?: number
          tclwt007_debit?: number
          tclwt008_credit?: number
          tclwt008_debit?: number
          tclwt009_credit?: number
          tclwt009_debit?: number
          tclwt010_credit?: number
          tclwt010_debit?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_open_sales_orders_snapshot: {
        Args: {
          _expected_count: number
          _scope_key: string
          _snapshot_id: string
        }
        Returns: number
      }
      activate_zfisales_snapshot: {
        Args: {
          _expected_count: number
          _posting_from: string
          _posting_to: string
          _scope_key: string
          _snapshot_id: string
        }
        Returns: number
      }
      admin_confirm_user_email: {
        Args: { _user_id: string }
        Returns: undefined
      }
      admin_delete_user: { Args: { _user_id: string }; Returns: undefined }
      admin_set_user_password: {
        Args: { _new_password: string; _user_id: string }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: { _role_key: string; _user_id: string }
        Returns: undefined
      }
      apply_sap_sync_schedule: {
        Args: { _cron: string; _enabled: boolean; _endpoint: string }
        Returns: string
      }
      finish_sync_run: {
        Args: {
          _duration_ms?: number
          _http_status?: number
          _message?: string
          _records_inserted?: number
          _records_received?: number
          _records_skipped?: number
          _records_updated?: number
          _response_bytes?: number
          _run_id: string
          _status: string
        }
        Returns: undefined
      }
      get_sap_credential: { Args: { _cred_key: string }; Returns: string }
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
      list_sap_credential_keys: { Args: never; Returns: string[] }
      net_sales_summary:
        | {
            Args: never
            Returns: {
              sales_type: string
              total: number
              type_total: number
            }[]
          }
        | {
            Args: { _posting_from: string; _posting_to: string }
            Returns: {
              sales_type: string
              total: number
              type_total: number
            }[]
          }
      resolve_login_email: { Args: { _identifier: string }; Returns: string }
      set_sap_credential: {
        Args: { _cred_key: string; _secret: string }
        Returns: undefined
      }
      start_sync_run: {
        Args: {
          _endpoint: string
          _request_snapshot: Json
          _started_at: string
        }
        Returns: string
      }
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
    Enums: {
      app_role: ["admin", "buyer", "approver", "viewer"],
    },
  },
} as const
