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
          ah: number
          b_value: number
          country: string | null
          created_at: string
          currency: string | null
          customer_bill_to: string | null
          customer_bill_to_name: string | null
          customer_group: string | null
          customer_ship_to: string | null
          customer_ship_to_name: string | null
          customer_sold_to: string | null
          customer_sold_to_name: string | null
          days_open: number
          delivered_quantity: number
          delivery_date: string | null
          delivery_status: string | null
          distribution_channel: string | null
          division: string | null
          id: string
          industry_description: string | null
          is_active_snapshot: boolean
          kwert_inr: number
          ld_status: string | null
          main_group: string | null
          material: string | null
          material_description: string | null
          material_type: string | null
          mngrp1: string | null
          model: string | null
          occurrence_no: number
          open_quantity: number
          open_value: number
          order_date: string | null
          order_type: string | null
          overall_status: string | null
          p_value1: number
          pcgrp1: string | null
          pcgrp2: string | null
          pcgrp3: string | null
          plant: string | null
          plant_name: string | null
          preceding_document: string | null
          product_category: string | null
          product_range: string | null
          product_type: string | null
          profit_center: string | null
          profit_center_name: string | null
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
          sales_rep_name: string | null
          sales_type: string | null
          sales_zone: string | null
          snapshot_id: string
          source_endpoint: string
          sub_group: string | null
          sync_scope_key: string
          synced_at: string
          total_ah: number
          unit: string | null
          updated_at: string
          usage_description: string | null
        }
        Insert: {
          ah?: number
          b_value?: number
          country?: string | null
          created_at?: string
          currency?: string | null
          customer_bill_to?: string | null
          customer_bill_to_name?: string | null
          customer_group?: string | null
          customer_ship_to?: string | null
          customer_ship_to_name?: string | null
          customer_sold_to?: string | null
          customer_sold_to_name?: string | null
          days_open?: number
          delivered_quantity?: number
          delivery_date?: string | null
          delivery_status?: string | null
          distribution_channel?: string | null
          division?: string | null
          id?: string
          industry_description?: string | null
          is_active_snapshot?: boolean
          kwert_inr?: number
          ld_status?: string | null
          main_group?: string | null
          material?: string | null
          material_description?: string | null
          material_type?: string | null
          mngrp1?: string | null
          model?: string | null
          occurrence_no?: number
          open_quantity?: number
          open_value?: number
          order_date?: string | null
          order_type?: string | null
          overall_status?: string | null
          p_value1?: number
          pcgrp1?: string | null
          pcgrp2?: string | null
          pcgrp3?: string | null
          plant?: string | null
          plant_name?: string | null
          preceding_document?: string | null
          product_category?: string | null
          product_range?: string | null
          product_type?: string | null
          profit_center?: string | null
          profit_center_name?: string | null
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
          sales_rep_name?: string | null
          sales_type?: string | null
          sales_zone?: string | null
          snapshot_id: string
          source_endpoint: string
          sub_group?: string | null
          sync_scope_key: string
          synced_at?: string
          total_ah?: number
          unit?: string | null
          updated_at?: string
          usage_description?: string | null
        }
        Update: {
          ah?: number
          b_value?: number
          country?: string | null
          created_at?: string
          currency?: string | null
          customer_bill_to?: string | null
          customer_bill_to_name?: string | null
          customer_group?: string | null
          customer_ship_to?: string | null
          customer_ship_to_name?: string | null
          customer_sold_to?: string | null
          customer_sold_to_name?: string | null
          days_open?: number
          delivered_quantity?: number
          delivery_date?: string | null
          delivery_status?: string | null
          distribution_channel?: string | null
          division?: string | null
          id?: string
          industry_description?: string | null
          is_active_snapshot?: boolean
          kwert_inr?: number
          ld_status?: string | null
          main_group?: string | null
          material?: string | null
          material_description?: string | null
          material_type?: string | null
          mngrp1?: string | null
          model?: string | null
          occurrence_no?: number
          open_quantity?: number
          open_value?: number
          order_date?: string | null
          order_type?: string | null
          overall_status?: string | null
          p_value1?: number
          pcgrp1?: string | null
          pcgrp2?: string | null
          pcgrp3?: string | null
          plant?: string | null
          plant_name?: string | null
          preceding_document?: string | null
          product_category?: string | null
          product_range?: string | null
          product_type?: string | null
          profit_center?: string | null
          profit_center_name?: string | null
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
          sales_rep_name?: string | null
          sales_type?: string | null
          sales_zone?: string | null
          snapshot_id?: string
          source_endpoint?: string
          sub_group?: string | null
          sync_scope_key?: string
          synced_at?: string
          total_ah?: number
          unit?: string | null
          updated_at?: string
          usage_description?: string | null
        }
        Relationships: []
      }
      order_book: {
        Row: {
          absta: string | null
          apptyp: string | null
          auart: string | null
          basic_ah: number
          basic_ahinr: number
          bezei: string | null
          bezei_bp: string | null
          bezei_sh: string | null
          bezei_sp: string | null
          bstdk: string | null
          bstnk: string | null
          buy_back: string | null
          buy_back_detail: string | null
          created_at: string
          created_date: string | null
          delv_dat: string | null
          div_name: string | null
          gbsta: string | null
          id: string
          inco1: string | null
          inco2: string | null
          kbetr: number
          kf00: number
          kunnr_bp: string | null
          kunnr_sh: string | null
          kunnr_sp: string | null
          kursk: number
          kwert_ba: number
          kwert_bc: number
          kwert_bci: number
          kwert_cst: number
          kwert_ds: number
          kwert_ed: number
          kwert_fr: number
          kwert_gst: number
          kwert_kkc: number
          kwert_st: number
          kwert_sw: number
          kwert_vat: number
          kwert_vsc: number
          kwert_zsbp: number
          kwert_zsf1: number
          kwert_zsf2: number
          kwmeng: number
          kwmeng_c: number
          kwmeng_p: number
          kwmeng_pc: number
          landx_bp: string | null
          landx_sh: string | null
          landx_sp: string | null
          ld_status: string | null
          ld_terms: string | null
          main_grp: string | null
          maktx: string | null
          matnr: string | null
          meins: string | null
          mngrp1: string | null
          model: string | null
          name1_bp: string | null
          name1_se: string | null
          name1_sh: string | null
          name1_sp: string | null
          net_inr: number
          netwr: number
          p_value: number
          pay_vtext: string | null
          pc_name: string | null
          pcgrp1: string | null
          pcgrp2: string | null
          pcgrp3: string | null
          plant: string | null
          plant_name: string | null
          profit_center: string | null
          proj: string | null
          range: string | null
          raw: Json
          sales_order: string
          sales_order_item: string
          sector: string | null
          source_endpoint: string
          spart: string | null
          stcur: number
          sub_grp: string | null
          synced_at: string
          tot_ah: number
          tot_inr: number
          twar: number
          type: string | null
          umren: number
          umvkz: number
          unload: string | null
          updated_at: string
          vgbel: string | null
          vkbur: string | null
          vkgrp: string | null
          vrkme: string | null
          vtext_dc: string | null
          vtext_di: string | null
          vtweg: string | null
          waerk: string | null
          warty: string | null
          year: string | null
          zcom: number
          zdst: number
          zf01: number
          zf02: number
          znrc: number
          zpf1: number
          ztax: number
          zterm: string | null
        }
        Insert: {
          absta?: string | null
          apptyp?: string | null
          auart?: string | null
          basic_ah?: number
          basic_ahinr?: number
          bezei?: string | null
          bezei_bp?: string | null
          bezei_sh?: string | null
          bezei_sp?: string | null
          bstdk?: string | null
          bstnk?: string | null
          buy_back?: string | null
          buy_back_detail?: string | null
          created_at?: string
          created_date?: string | null
          delv_dat?: string | null
          div_name?: string | null
          gbsta?: string | null
          id?: string
          inco1?: string | null
          inco2?: string | null
          kbetr?: number
          kf00?: number
          kunnr_bp?: string | null
          kunnr_sh?: string | null
          kunnr_sp?: string | null
          kursk?: number
          kwert_ba?: number
          kwert_bc?: number
          kwert_bci?: number
          kwert_cst?: number
          kwert_ds?: number
          kwert_ed?: number
          kwert_fr?: number
          kwert_gst?: number
          kwert_kkc?: number
          kwert_st?: number
          kwert_sw?: number
          kwert_vat?: number
          kwert_vsc?: number
          kwert_zsbp?: number
          kwert_zsf1?: number
          kwert_zsf2?: number
          kwmeng?: number
          kwmeng_c?: number
          kwmeng_p?: number
          kwmeng_pc?: number
          landx_bp?: string | null
          landx_sh?: string | null
          landx_sp?: string | null
          ld_status?: string | null
          ld_terms?: string | null
          main_grp?: string | null
          maktx?: string | null
          matnr?: string | null
          meins?: string | null
          mngrp1?: string | null
          model?: string | null
          name1_bp?: string | null
          name1_se?: string | null
          name1_sh?: string | null
          name1_sp?: string | null
          net_inr?: number
          netwr?: number
          p_value?: number
          pay_vtext?: string | null
          pc_name?: string | null
          pcgrp1?: string | null
          pcgrp2?: string | null
          pcgrp3?: string | null
          plant?: string | null
          plant_name?: string | null
          profit_center?: string | null
          proj?: string | null
          range?: string | null
          raw?: Json
          sales_order?: string
          sales_order_item?: string
          sector?: string | null
          source_endpoint?: string
          spart?: string | null
          stcur?: number
          sub_grp?: string | null
          synced_at?: string
          tot_ah?: number
          tot_inr?: number
          twar?: number
          type?: string | null
          umren?: number
          umvkz?: number
          unload?: string | null
          updated_at?: string
          vgbel?: string | null
          vkbur?: string | null
          vkgrp?: string | null
          vrkme?: string | null
          vtext_dc?: string | null
          vtext_di?: string | null
          vtweg?: string | null
          waerk?: string | null
          warty?: string | null
          year?: string | null
          zcom?: number
          zdst?: number
          zf01?: number
          zf02?: number
          znrc?: number
          zpf1?: number
          ztax?: number
          zterm?: string | null
        }
        Update: {
          absta?: string | null
          apptyp?: string | null
          auart?: string | null
          basic_ah?: number
          basic_ahinr?: number
          bezei?: string | null
          bezei_bp?: string | null
          bezei_sh?: string | null
          bezei_sp?: string | null
          bstdk?: string | null
          bstnk?: string | null
          buy_back?: string | null
          buy_back_detail?: string | null
          created_at?: string
          created_date?: string | null
          delv_dat?: string | null
          div_name?: string | null
          gbsta?: string | null
          id?: string
          inco1?: string | null
          inco2?: string | null
          kbetr?: number
          kf00?: number
          kunnr_bp?: string | null
          kunnr_sh?: string | null
          kunnr_sp?: string | null
          kursk?: number
          kwert_ba?: number
          kwert_bc?: number
          kwert_bci?: number
          kwert_cst?: number
          kwert_ds?: number
          kwert_ed?: number
          kwert_fr?: number
          kwert_gst?: number
          kwert_kkc?: number
          kwert_st?: number
          kwert_sw?: number
          kwert_vat?: number
          kwert_vsc?: number
          kwert_zsbp?: number
          kwert_zsf1?: number
          kwert_zsf2?: number
          kwmeng?: number
          kwmeng_c?: number
          kwmeng_p?: number
          kwmeng_pc?: number
          landx_bp?: string | null
          landx_sh?: string | null
          landx_sp?: string | null
          ld_status?: string | null
          ld_terms?: string | null
          main_grp?: string | null
          maktx?: string | null
          matnr?: string | null
          meins?: string | null
          mngrp1?: string | null
          model?: string | null
          name1_bp?: string | null
          name1_se?: string | null
          name1_sh?: string | null
          name1_sp?: string | null
          net_inr?: number
          netwr?: number
          p_value?: number
          pay_vtext?: string | null
          pc_name?: string | null
          pcgrp1?: string | null
          pcgrp2?: string | null
          pcgrp3?: string | null
          plant?: string | null
          plant_name?: string | null
          profit_center?: string | null
          proj?: string | null
          range?: string | null
          raw?: Json
          sales_order?: string
          sales_order_item?: string
          sector?: string | null
          source_endpoint?: string
          spart?: string | null
          stcur?: number
          sub_grp?: string | null
          synced_at?: string
          tot_ah?: number
          tot_inr?: number
          twar?: number
          type?: string | null
          umren?: number
          umvkz?: number
          unload?: string | null
          updated_at?: string
          vgbel?: string | null
          vkbur?: string | null
          vkgrp?: string | null
          vrkme?: string | null
          vtext_dc?: string | null
          vtext_di?: string | null
          vtweg?: string | null
          waerk?: string | null
          warty?: string | null
          year?: string | null
          zcom?: number
          zdst?: number
          zf01?: number
          zf02?: number
          znrc?: number
          zpf1?: number
          ztax?: number
          zterm?: string | null
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
          plants: string[]
          profit_center: string | null
          profit_centers: string[]
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
          plants?: string[]
          profit_center?: string | null
          profit_centers?: string[]
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
          plants?: string[]
          profit_center?: string | null
          profit_centers?: string[]
          purchase_group?: string | null
          status?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      purchase_register: {
        Row: {
          aedat: string | null
          belnr: string
          budat: string | null
          buzei: string
          bwart: string | null
          cgst: number | null
          create_dt: string | null
          dis: number | null
          gl_acc: number | null
          gross_price: number | null
          id: string
          igst: number | null
          kursf: number | null
          lifnr: string | null
          maktx: string | null
          matnr: string | null
          mblnr: string
          meins_g: string | null
          meins_i: string | null
          menge_g: number | null
          menge_i: number | null
          mtbez: string | null
          mwskz: string | null
          name1: string | null
          name1_wer: string | null
          net_amt: number | null
          net_price: number | null
          no_cr: number | null
          oth: number | null
          plan_del: number | null
          prctr: string | null
          ptext: string | null
          raw: Json
          sgst: number | null
          shkzg: string | null
          source_endpoint: string | null
          synced_at: string
          tax: number | null
          text1_m: string | null
          total: number | null
          ty_mat: string | null
          ty_purch: string | null
          waers: string | null
          werks: string | null
          wrbtr: number | null
          zeile: string
        }
        Insert: {
          aedat?: string | null
          belnr?: string
          budat?: string | null
          buzei?: string
          bwart?: string | null
          cgst?: number | null
          create_dt?: string | null
          dis?: number | null
          gl_acc?: number | null
          gross_price?: number | null
          id?: string
          igst?: number | null
          kursf?: number | null
          lifnr?: string | null
          maktx?: string | null
          matnr?: string | null
          mblnr?: string
          meins_g?: string | null
          meins_i?: string | null
          menge_g?: number | null
          menge_i?: number | null
          mtbez?: string | null
          mwskz?: string | null
          name1?: string | null
          name1_wer?: string | null
          net_amt?: number | null
          net_price?: number | null
          no_cr?: number | null
          oth?: number | null
          plan_del?: number | null
          prctr?: string | null
          ptext?: string | null
          raw?: Json
          sgst?: number | null
          shkzg?: string | null
          source_endpoint?: string | null
          synced_at?: string
          tax?: number | null
          text1_m?: string | null
          total?: number | null
          ty_mat?: string | null
          ty_purch?: string | null
          waers?: string | null
          werks?: string | null
          wrbtr?: number | null
          zeile?: string
        }
        Update: {
          aedat?: string | null
          belnr?: string
          budat?: string | null
          buzei?: string
          bwart?: string | null
          cgst?: number | null
          create_dt?: string | null
          dis?: number | null
          gl_acc?: number | null
          gross_price?: number | null
          id?: string
          igst?: number | null
          kursf?: number | null
          lifnr?: string | null
          maktx?: string | null
          matnr?: string | null
          mblnr?: string
          meins_g?: string | null
          meins_i?: string | null
          menge_g?: number | null
          menge_i?: number | null
          mtbez?: string | null
          mwskz?: string | null
          name1?: string | null
          name1_wer?: string | null
          net_amt?: number | null
          net_price?: number | null
          no_cr?: number | null
          oth?: number | null
          plan_del?: number | null
          prctr?: string | null
          ptext?: string | null
          raw?: Json
          sgst?: number | null
          shkzg?: string | null
          source_endpoint?: string | null
          synced_at?: string
          tax?: number | null
          text1_m?: string | null
          total?: number | null
          ty_mat?: string | null
          ty_purch?: string | null
          waers?: string | null
          werks?: string | null
          wrbtr?: number | null
          zeile?: string
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
      sales_in_transit: {
        Row: {
          age: string | null
          ah: number
          apptyp: string | null
          arktx: string | null
          auart: string | null
          aubel: string | null
          audat: string | null
          aupos: string | null
          basic_ah: number
          basic_ahinr: number
          belnr1: string | null
          belnr2: string | null
          belnr3: string | null
          bezei_c: string | null
          bezei_s: string | null
          bezei_sg: string | null
          bezei_so: string | null
          brsch: string | null
          brtxt: string | null
          bstdk: string | null
          bstnk: string | null
          budat: string | null
          bukrs: string | null
          cellcolor: string | null
          created_at: string
          cst: number
          cst_ex: number
          discnt: number
          discnt_ex: number
          div_name: string | null
          division: string | null
          dmbtr: number
          ecess: number
          ecess_ex: number
          erdat: string | null
          ex_com_text: string | null
          exdat: string | null
          exgrp: string | null
          exnum: string | null
          fawref: string | null
          fkart: string | null
          fkdat: string | null
          fkdat_bill: string | null
          fkdat_c: string | null
          fkimg: number
          fkimg_tot: number
          frght1: number
          frght1_ex: number
          frght2: number
          frght2_ex: number
          gjahr1: string | null
          gjahr2: string | null
          gstin_c: string | null
          gstin_py: string | null
          gstin_re: string | null
          gstin_sh: string | null
          hkont: string | null
          hsn_code: string | null
          id: string
          inco1: string | null
          inco2: string | null
          inv: string | null
          j_1ichid: string | null
          j_1icstno_c: string | null
          j_1icstno_s: string | null
          jlsr: number
          jlsr_ex: number
          jv3: string | null
          jv4: string | null
          kbetr: number
          kunag: string | null
          kunnr: string | null
          kunnr_bp: string | null
          kunnr_re: string | null
          kunnr_s: string | null
          kunnr_sh: string | null
          kunnr_sp: string | null
          kurrf: number
          kwert_cgst: number
          kwert_d: number
          kwert_dex: number
          kwert_igst: number
          kwert_sgst: number
          kwert_znrc: number
          kwert_znrc_inr: number
          kwmeng: number
          land1: string | null
          landx50_c: string | null
          landx50_s: string | null
          lfdat_del: string | null
          lgobe: string | null
          lgort: string | null
          lifnr: string | null
          lr_no: string | null
          main_grp: string | null
          matkl: string | null
          matnr: string | null
          mblnr: string | null
          mctxt: string | null
          mctxt_i: string | null
          meins: string | null
          mjahr: string | null
          mngrp1: string | null
          mtart: string | null
          mwsbk: number
          mwsbk_ex: number
          name_c: string | null
          name_p: string | null
          name_re: string | null
          name_s: string | null
          name_se: string | null
          name_tf: string | null
          name1_p: string | null
          netwr: number
          netwr_b: number
          netwr_bex: number
          netwr_ex: number
          netwr_t: number
          netwr_t_ex: number
          netwr_tot: number
          noti_text: string | null
          pcgrp1: string | null
          pcgrp2: string | null
          pcgrp3: string | null
          pfchrg: number
          pfchrg_ex: number
          poddate: string | null
          posnr: string
          prctr: string | null
          prctr_i: string | null
          preprn: string | null
          price_cell: number
          price_cellinr: number
          racct: string | null
          raw: Json
          ref: string | null
          regio: string | null
          remarks_f2: string | null
          rfbsk: string | null
          sbcess: number
          sbcess_ex: number
          sector: string | null
          segment: string | null
          servi: number
          servi_ex: number
          shess: number
          shess_ex: number
          source_endpoint: string
          spart: string | null
          sub_grp: string | null
          synced_at: string
          tax_rate: number
          tcs: number
          tcs_ex: number
          tot_ah: number
          tot_bp: number
          txt50: string | null
          txt500: string | null
          umren: number
          umvkz: number
          updated_at: string
          vat: number
          vat_ex: number
          vbeln: string
          vbeln_c: string | null
          vbeln_del: string | null
          vgbel: string | null
          vrkme: string | null
          vtext: string | null
          vtext_dc: string | null
          vtext_pay: string | null
          vtext_sd: string | null
          vtweg_auft: string | null
          vtxt_c: string | null
          vtxt_v: string | null
          waerk: string | null
          werks: string | null
          xblnr: string | null
          zgst: number
          zgst_ex: number
          zkkc: number
          zkkc_ex: number
          zterm: string | null
        }
        Insert: {
          age?: string | null
          ah?: number
          apptyp?: string | null
          arktx?: string | null
          auart?: string | null
          aubel?: string | null
          audat?: string | null
          aupos?: string | null
          basic_ah?: number
          basic_ahinr?: number
          belnr1?: string | null
          belnr2?: string | null
          belnr3?: string | null
          bezei_c?: string | null
          bezei_s?: string | null
          bezei_sg?: string | null
          bezei_so?: string | null
          brsch?: string | null
          brtxt?: string | null
          bstdk?: string | null
          bstnk?: string | null
          budat?: string | null
          bukrs?: string | null
          cellcolor?: string | null
          created_at?: string
          cst?: number
          cst_ex?: number
          discnt?: number
          discnt_ex?: number
          div_name?: string | null
          division?: string | null
          dmbtr?: number
          ecess?: number
          ecess_ex?: number
          erdat?: string | null
          ex_com_text?: string | null
          exdat?: string | null
          exgrp?: string | null
          exnum?: string | null
          fawref?: string | null
          fkart?: string | null
          fkdat?: string | null
          fkdat_bill?: string | null
          fkdat_c?: string | null
          fkimg?: number
          fkimg_tot?: number
          frght1?: number
          frght1_ex?: number
          frght2?: number
          frght2_ex?: number
          gjahr1?: string | null
          gjahr2?: string | null
          gstin_c?: string | null
          gstin_py?: string | null
          gstin_re?: string | null
          gstin_sh?: string | null
          hkont?: string | null
          hsn_code?: string | null
          id?: string
          inco1?: string | null
          inco2?: string | null
          inv?: string | null
          j_1ichid?: string | null
          j_1icstno_c?: string | null
          j_1icstno_s?: string | null
          jlsr?: number
          jlsr_ex?: number
          jv3?: string | null
          jv4?: string | null
          kbetr?: number
          kunag?: string | null
          kunnr?: string | null
          kunnr_bp?: string | null
          kunnr_re?: string | null
          kunnr_s?: string | null
          kunnr_sh?: string | null
          kunnr_sp?: string | null
          kurrf?: number
          kwert_cgst?: number
          kwert_d?: number
          kwert_dex?: number
          kwert_igst?: number
          kwert_sgst?: number
          kwert_znrc?: number
          kwert_znrc_inr?: number
          kwmeng?: number
          land1?: string | null
          landx50_c?: string | null
          landx50_s?: string | null
          lfdat_del?: string | null
          lgobe?: string | null
          lgort?: string | null
          lifnr?: string | null
          lr_no?: string | null
          main_grp?: string | null
          matkl?: string | null
          matnr?: string | null
          mblnr?: string | null
          mctxt?: string | null
          mctxt_i?: string | null
          meins?: string | null
          mjahr?: string | null
          mngrp1?: string | null
          mtart?: string | null
          mwsbk?: number
          mwsbk_ex?: number
          name_c?: string | null
          name_p?: string | null
          name_re?: string | null
          name_s?: string | null
          name_se?: string | null
          name_tf?: string | null
          name1_p?: string | null
          netwr?: number
          netwr_b?: number
          netwr_bex?: number
          netwr_ex?: number
          netwr_t?: number
          netwr_t_ex?: number
          netwr_tot?: number
          noti_text?: string | null
          pcgrp1?: string | null
          pcgrp2?: string | null
          pcgrp3?: string | null
          pfchrg?: number
          pfchrg_ex?: number
          poddate?: string | null
          posnr: string
          prctr?: string | null
          prctr_i?: string | null
          preprn?: string | null
          price_cell?: number
          price_cellinr?: number
          racct?: string | null
          raw?: Json
          ref?: string | null
          regio?: string | null
          remarks_f2?: string | null
          rfbsk?: string | null
          sbcess?: number
          sbcess_ex?: number
          sector?: string | null
          segment?: string | null
          servi?: number
          servi_ex?: number
          shess?: number
          shess_ex?: number
          source_endpoint?: string
          spart?: string | null
          sub_grp?: string | null
          synced_at?: string
          tax_rate?: number
          tcs?: number
          tcs_ex?: number
          tot_ah?: number
          tot_bp?: number
          txt50?: string | null
          txt500?: string | null
          umren?: number
          umvkz?: number
          updated_at?: string
          vat?: number
          vat_ex?: number
          vbeln: string
          vbeln_c?: string | null
          vbeln_del?: string | null
          vgbel?: string | null
          vrkme?: string | null
          vtext?: string | null
          vtext_dc?: string | null
          vtext_pay?: string | null
          vtext_sd?: string | null
          vtweg_auft?: string | null
          vtxt_c?: string | null
          vtxt_v?: string | null
          waerk?: string | null
          werks?: string | null
          xblnr?: string | null
          zgst?: number
          zgst_ex?: number
          zkkc?: number
          zkkc_ex?: number
          zterm?: string | null
        }
        Update: {
          age?: string | null
          ah?: number
          apptyp?: string | null
          arktx?: string | null
          auart?: string | null
          aubel?: string | null
          audat?: string | null
          aupos?: string | null
          basic_ah?: number
          basic_ahinr?: number
          belnr1?: string | null
          belnr2?: string | null
          belnr3?: string | null
          bezei_c?: string | null
          bezei_s?: string | null
          bezei_sg?: string | null
          bezei_so?: string | null
          brsch?: string | null
          brtxt?: string | null
          bstdk?: string | null
          bstnk?: string | null
          budat?: string | null
          bukrs?: string | null
          cellcolor?: string | null
          created_at?: string
          cst?: number
          cst_ex?: number
          discnt?: number
          discnt_ex?: number
          div_name?: string | null
          division?: string | null
          dmbtr?: number
          ecess?: number
          ecess_ex?: number
          erdat?: string | null
          ex_com_text?: string | null
          exdat?: string | null
          exgrp?: string | null
          exnum?: string | null
          fawref?: string | null
          fkart?: string | null
          fkdat?: string | null
          fkdat_bill?: string | null
          fkdat_c?: string | null
          fkimg?: number
          fkimg_tot?: number
          frght1?: number
          frght1_ex?: number
          frght2?: number
          frght2_ex?: number
          gjahr1?: string | null
          gjahr2?: string | null
          gstin_c?: string | null
          gstin_py?: string | null
          gstin_re?: string | null
          gstin_sh?: string | null
          hkont?: string | null
          hsn_code?: string | null
          id?: string
          inco1?: string | null
          inco2?: string | null
          inv?: string | null
          j_1ichid?: string | null
          j_1icstno_c?: string | null
          j_1icstno_s?: string | null
          jlsr?: number
          jlsr_ex?: number
          jv3?: string | null
          jv4?: string | null
          kbetr?: number
          kunag?: string | null
          kunnr?: string | null
          kunnr_bp?: string | null
          kunnr_re?: string | null
          kunnr_s?: string | null
          kunnr_sh?: string | null
          kunnr_sp?: string | null
          kurrf?: number
          kwert_cgst?: number
          kwert_d?: number
          kwert_dex?: number
          kwert_igst?: number
          kwert_sgst?: number
          kwert_znrc?: number
          kwert_znrc_inr?: number
          kwmeng?: number
          land1?: string | null
          landx50_c?: string | null
          landx50_s?: string | null
          lfdat_del?: string | null
          lgobe?: string | null
          lgort?: string | null
          lifnr?: string | null
          lr_no?: string | null
          main_grp?: string | null
          matkl?: string | null
          matnr?: string | null
          mblnr?: string | null
          mctxt?: string | null
          mctxt_i?: string | null
          meins?: string | null
          mjahr?: string | null
          mngrp1?: string | null
          mtart?: string | null
          mwsbk?: number
          mwsbk_ex?: number
          name_c?: string | null
          name_p?: string | null
          name_re?: string | null
          name_s?: string | null
          name_se?: string | null
          name_tf?: string | null
          name1_p?: string | null
          netwr?: number
          netwr_b?: number
          netwr_bex?: number
          netwr_ex?: number
          netwr_t?: number
          netwr_t_ex?: number
          netwr_tot?: number
          noti_text?: string | null
          pcgrp1?: string | null
          pcgrp2?: string | null
          pcgrp3?: string | null
          pfchrg?: number
          pfchrg_ex?: number
          poddate?: string | null
          posnr?: string
          prctr?: string | null
          prctr_i?: string | null
          preprn?: string | null
          price_cell?: number
          price_cellinr?: number
          racct?: string | null
          raw?: Json
          ref?: string | null
          regio?: string | null
          remarks_f2?: string | null
          rfbsk?: string | null
          sbcess?: number
          sbcess_ex?: number
          sector?: string | null
          segment?: string | null
          servi?: number
          servi_ex?: number
          shess?: number
          shess_ex?: number
          source_endpoint?: string
          spart?: string | null
          sub_grp?: string | null
          synced_at?: string
          tax_rate?: number
          tcs?: number
          tcs_ex?: number
          tot_ah?: number
          tot_bp?: number
          txt50?: string | null
          txt500?: string | null
          umren?: number
          umvkz?: number
          updated_at?: string
          vat?: number
          vat_ex?: number
          vbeln?: string
          vbeln_c?: string | null
          vbeln_del?: string | null
          vgbel?: string | null
          vrkme?: string | null
          vtext?: string | null
          vtext_dc?: string | null
          vtext_pay?: string | null
          vtext_sd?: string | null
          vtweg_auft?: string | null
          vtxt_c?: string | null
          vtxt_v?: string | null
          waerk?: string | null
          werks?: string | null
          xblnr?: string | null
          zgst?: number
          zgst_ex?: number
          zkkc?: number
          zkkc_ex?: number
          zterm?: string | null
        }
        Relationships: []
      }
      sales_register: {
        Row: {
          abrvw: string | null
          abrvw_desp: string | null
          age: string | null
          ah: number
          apptyp: string | null
          arktx: string | null
          auart: string | null
          aubel: string | null
          audat: string | null
          aupos: string | null
          basic_ah: number
          basic_ahinr: number
          battery_serial_no: string | null
          belnr1: string | null
          belnr2: string | null
          belnr3: string | null
          bezei_c: string | null
          bezei_s: string | null
          bezei_sg: string | null
          bezei_so: string | null
          brsch: string | null
          brtxt: string | null
          bstdk: string | null
          bstnk: string | null
          budat: string | null
          bukrs: string | null
          cellcolor: string | null
          created_at: string
          cst: number
          cst_ex: number
          discnt: number
          discnt_ex: number
          div_name: string | null
          division: string | null
          dmbtr: number
          ecess: number
          ecess_ex: number
          erdat: string | null
          ex_com_text: string | null
          exdat: string | null
          exgrp: string | null
          exnum: string | null
          fawref: string | null
          fkart: string | null
          fkdat: string | null
          fkdat_bill: string | null
          fkdat_c: string | null
          fkimg: number
          fkimg_tot: number
          frght1: number
          frght1_ex: number
          frght2: number
          frght2_ex: number
          gjahr1: string | null
          gjahr2: string | null
          gst_tds: string | null
          gstin_c: string | null
          gstin_py: string | null
          gstin_re: string | null
          gstin_sh: string | null
          hkont: string | null
          hsn_code: string | null
          id: string
          inco1: string | null
          inco2: string | null
          inv: string | null
          j_1ichid: string | null
          j_1icstno_c: string | null
          j_1icstno_s: string | null
          jlsr: number
          jlsr_ex: number
          jv3: string | null
          jv4: string | null
          kbetr: number
          kdgrp: string | null
          kdgrp_desp: string | null
          kunag: string | null
          kunnr: string | null
          kunnr_bp: string | null
          kunnr_re: string | null
          kunnr_s: string | null
          kunnr_sh: string | null
          kunnr_sp: string | null
          kurrf: number
          kwert_cgst: number
          kwert_d: number
          kwert_dex: number
          kwert_igst: number
          kwert_sgst: number
          kwert_znrc: number
          kwert_znrc_inr: number
          kwmeng: number
          land1: string | null
          landx50_c: string | null
          landx50_s: string | null
          lfdat_del: string | null
          lgobe: string | null
          lgort: string | null
          lifnr: string | null
          lr_no: string | null
          main_group: string | null
          main_grp: string | null
          material_cost: number
          matkl: string | null
          matnr: string | null
          mblnr: string | null
          mctxt: string | null
          mctxt_i: string | null
          meins: string | null
          mjahr: string | null
          mngrp1: string | null
          model: string | null
          mtart: string | null
          mwsbk: number
          mwsbk_ex: number
          name_c: string | null
          name_p: string | null
          name_re: string | null
          name_s: string | null
          name_se: string | null
          name_tf: string | null
          name1_p: string | null
          netwr: number
          netwr_b: number
          netwr_bex: number
          netwr_ex: number
          netwr_t: number
          netwr_t_ex: number
          netwr_tot: number
          noti_text: string | null
          overhead_cost: number
          pcgrp1: string | null
          pcgrp2: string | null
          pcgrp3: string | null
          pfchrg: number
          pfchrg_ex: number
          poddate: string | null
          posnr: string
          prctr: string | null
          prctr_i: string | null
          preprn: string | null
          price_cell: number
          price_cellinr: number
          racct: string | null
          raw: Json
          ref: string | null
          regio: string | null
          remarks_f2: string | null
          rfbsk: string | null
          sbcess: number
          sbcess_ex: number
          sector: string | null
          segment: string | null
          servi: number
          servi_ex: number
          shess: number
          shess_ex: number
          source_endpoint: string
          spart: string | null
          sub_group: string | null
          sub_grp: string | null
          synced_at: string
          tax_rate: number
          tcs: number
          tcs_ex: number
          tot_ah: number
          tot_bp: number
          total_cost: number
          twar: number
          txt50: string | null
          txt500: string | null
          type: string | null
          umren: number
          umvkz: number
          updated_at: string
          vat: number
          vat_ex: number
          vbeln: string
          vbeln_c: string | null
          vbeln_del: string | null
          vgbel: string | null
          vrkme: string | null
          vtext: string | null
          vtext_dc: string | null
          vtext_desp: string | null
          vtext_pay: string | null
          vtext_sd: string | null
          vtweg_auft: string | null
          vtxt_c: string | null
          vtxt_v: string | null
          waerk: string | null
          werks: string | null
          wrdets: string | null
          wrmnts: string | null
          xblnr: string | null
          zah: number
          zgst: number
          zgst_ex: number
          zkkc: number
          zkkc_ex: number
          zterm: string | null
          zwrexpdt: string | null
        }
        Insert: {
          abrvw?: string | null
          abrvw_desp?: string | null
          age?: string | null
          ah?: number
          apptyp?: string | null
          arktx?: string | null
          auart?: string | null
          aubel?: string | null
          audat?: string | null
          aupos?: string | null
          basic_ah?: number
          basic_ahinr?: number
          battery_serial_no?: string | null
          belnr1?: string | null
          belnr2?: string | null
          belnr3?: string | null
          bezei_c?: string | null
          bezei_s?: string | null
          bezei_sg?: string | null
          bezei_so?: string | null
          brsch?: string | null
          brtxt?: string | null
          bstdk?: string | null
          bstnk?: string | null
          budat?: string | null
          bukrs?: string | null
          cellcolor?: string | null
          created_at?: string
          cst?: number
          cst_ex?: number
          discnt?: number
          discnt_ex?: number
          div_name?: string | null
          division?: string | null
          dmbtr?: number
          ecess?: number
          ecess_ex?: number
          erdat?: string | null
          ex_com_text?: string | null
          exdat?: string | null
          exgrp?: string | null
          exnum?: string | null
          fawref?: string | null
          fkart?: string | null
          fkdat?: string | null
          fkdat_bill?: string | null
          fkdat_c?: string | null
          fkimg?: number
          fkimg_tot?: number
          frght1?: number
          frght1_ex?: number
          frght2?: number
          frght2_ex?: number
          gjahr1?: string | null
          gjahr2?: string | null
          gst_tds?: string | null
          gstin_c?: string | null
          gstin_py?: string | null
          gstin_re?: string | null
          gstin_sh?: string | null
          hkont?: string | null
          hsn_code?: string | null
          id?: string
          inco1?: string | null
          inco2?: string | null
          inv?: string | null
          j_1ichid?: string | null
          j_1icstno_c?: string | null
          j_1icstno_s?: string | null
          jlsr?: number
          jlsr_ex?: number
          jv3?: string | null
          jv4?: string | null
          kbetr?: number
          kdgrp?: string | null
          kdgrp_desp?: string | null
          kunag?: string | null
          kunnr?: string | null
          kunnr_bp?: string | null
          kunnr_re?: string | null
          kunnr_s?: string | null
          kunnr_sh?: string | null
          kunnr_sp?: string | null
          kurrf?: number
          kwert_cgst?: number
          kwert_d?: number
          kwert_dex?: number
          kwert_igst?: number
          kwert_sgst?: number
          kwert_znrc?: number
          kwert_znrc_inr?: number
          kwmeng?: number
          land1?: string | null
          landx50_c?: string | null
          landx50_s?: string | null
          lfdat_del?: string | null
          lgobe?: string | null
          lgort?: string | null
          lifnr?: string | null
          lr_no?: string | null
          main_group?: string | null
          main_grp?: string | null
          material_cost?: number
          matkl?: string | null
          matnr?: string | null
          mblnr?: string | null
          mctxt?: string | null
          mctxt_i?: string | null
          meins?: string | null
          mjahr?: string | null
          mngrp1?: string | null
          model?: string | null
          mtart?: string | null
          mwsbk?: number
          mwsbk_ex?: number
          name_c?: string | null
          name_p?: string | null
          name_re?: string | null
          name_s?: string | null
          name_se?: string | null
          name_tf?: string | null
          name1_p?: string | null
          netwr?: number
          netwr_b?: number
          netwr_bex?: number
          netwr_ex?: number
          netwr_t?: number
          netwr_t_ex?: number
          netwr_tot?: number
          noti_text?: string | null
          overhead_cost?: number
          pcgrp1?: string | null
          pcgrp2?: string | null
          pcgrp3?: string | null
          pfchrg?: number
          pfchrg_ex?: number
          poddate?: string | null
          posnr: string
          prctr?: string | null
          prctr_i?: string | null
          preprn?: string | null
          price_cell?: number
          price_cellinr?: number
          racct?: string | null
          raw?: Json
          ref?: string | null
          regio?: string | null
          remarks_f2?: string | null
          rfbsk?: string | null
          sbcess?: number
          sbcess_ex?: number
          sector?: string | null
          segment?: string | null
          servi?: number
          servi_ex?: number
          shess?: number
          shess_ex?: number
          source_endpoint?: string
          spart?: string | null
          sub_group?: string | null
          sub_grp?: string | null
          synced_at?: string
          tax_rate?: number
          tcs?: number
          tcs_ex?: number
          tot_ah?: number
          tot_bp?: number
          total_cost?: number
          twar?: number
          txt50?: string | null
          txt500?: string | null
          type?: string | null
          umren?: number
          umvkz?: number
          updated_at?: string
          vat?: number
          vat_ex?: number
          vbeln: string
          vbeln_c?: string | null
          vbeln_del?: string | null
          vgbel?: string | null
          vrkme?: string | null
          vtext?: string | null
          vtext_dc?: string | null
          vtext_desp?: string | null
          vtext_pay?: string | null
          vtext_sd?: string | null
          vtweg_auft?: string | null
          vtxt_c?: string | null
          vtxt_v?: string | null
          waerk?: string | null
          werks?: string | null
          wrdets?: string | null
          wrmnts?: string | null
          xblnr?: string | null
          zah?: number
          zgst?: number
          zgst_ex?: number
          zkkc?: number
          zkkc_ex?: number
          zterm?: string | null
          zwrexpdt?: string | null
        }
        Update: {
          abrvw?: string | null
          abrvw_desp?: string | null
          age?: string | null
          ah?: number
          apptyp?: string | null
          arktx?: string | null
          auart?: string | null
          aubel?: string | null
          audat?: string | null
          aupos?: string | null
          basic_ah?: number
          basic_ahinr?: number
          battery_serial_no?: string | null
          belnr1?: string | null
          belnr2?: string | null
          belnr3?: string | null
          bezei_c?: string | null
          bezei_s?: string | null
          bezei_sg?: string | null
          bezei_so?: string | null
          brsch?: string | null
          brtxt?: string | null
          bstdk?: string | null
          bstnk?: string | null
          budat?: string | null
          bukrs?: string | null
          cellcolor?: string | null
          created_at?: string
          cst?: number
          cst_ex?: number
          discnt?: number
          discnt_ex?: number
          div_name?: string | null
          division?: string | null
          dmbtr?: number
          ecess?: number
          ecess_ex?: number
          erdat?: string | null
          ex_com_text?: string | null
          exdat?: string | null
          exgrp?: string | null
          exnum?: string | null
          fawref?: string | null
          fkart?: string | null
          fkdat?: string | null
          fkdat_bill?: string | null
          fkdat_c?: string | null
          fkimg?: number
          fkimg_tot?: number
          frght1?: number
          frght1_ex?: number
          frght2?: number
          frght2_ex?: number
          gjahr1?: string | null
          gjahr2?: string | null
          gst_tds?: string | null
          gstin_c?: string | null
          gstin_py?: string | null
          gstin_re?: string | null
          gstin_sh?: string | null
          hkont?: string | null
          hsn_code?: string | null
          id?: string
          inco1?: string | null
          inco2?: string | null
          inv?: string | null
          j_1ichid?: string | null
          j_1icstno_c?: string | null
          j_1icstno_s?: string | null
          jlsr?: number
          jlsr_ex?: number
          jv3?: string | null
          jv4?: string | null
          kbetr?: number
          kdgrp?: string | null
          kdgrp_desp?: string | null
          kunag?: string | null
          kunnr?: string | null
          kunnr_bp?: string | null
          kunnr_re?: string | null
          kunnr_s?: string | null
          kunnr_sh?: string | null
          kunnr_sp?: string | null
          kurrf?: number
          kwert_cgst?: number
          kwert_d?: number
          kwert_dex?: number
          kwert_igst?: number
          kwert_sgst?: number
          kwert_znrc?: number
          kwert_znrc_inr?: number
          kwmeng?: number
          land1?: string | null
          landx50_c?: string | null
          landx50_s?: string | null
          lfdat_del?: string | null
          lgobe?: string | null
          lgort?: string | null
          lifnr?: string | null
          lr_no?: string | null
          main_group?: string | null
          main_grp?: string | null
          material_cost?: number
          matkl?: string | null
          matnr?: string | null
          mblnr?: string | null
          mctxt?: string | null
          mctxt_i?: string | null
          meins?: string | null
          mjahr?: string | null
          mngrp1?: string | null
          model?: string | null
          mtart?: string | null
          mwsbk?: number
          mwsbk_ex?: number
          name_c?: string | null
          name_p?: string | null
          name_re?: string | null
          name_s?: string | null
          name_se?: string | null
          name_tf?: string | null
          name1_p?: string | null
          netwr?: number
          netwr_b?: number
          netwr_bex?: number
          netwr_ex?: number
          netwr_t?: number
          netwr_t_ex?: number
          netwr_tot?: number
          noti_text?: string | null
          overhead_cost?: number
          pcgrp1?: string | null
          pcgrp2?: string | null
          pcgrp3?: string | null
          pfchrg?: number
          pfchrg_ex?: number
          poddate?: string | null
          posnr?: string
          prctr?: string | null
          prctr_i?: string | null
          preprn?: string | null
          price_cell?: number
          price_cellinr?: number
          racct?: string | null
          raw?: Json
          ref?: string | null
          regio?: string | null
          remarks_f2?: string | null
          rfbsk?: string | null
          sbcess?: number
          sbcess_ex?: number
          sector?: string | null
          segment?: string | null
          servi?: number
          servi_ex?: number
          shess?: number
          shess_ex?: number
          source_endpoint?: string
          spart?: string | null
          sub_group?: string | null
          sub_grp?: string | null
          synced_at?: string
          tax_rate?: number
          tcs?: number
          tcs_ex?: number
          tot_ah?: number
          tot_bp?: number
          total_cost?: number
          twar?: number
          txt50?: string | null
          txt500?: string | null
          type?: string | null
          umren?: number
          umvkz?: number
          updated_at?: string
          vat?: number
          vat_ex?: number
          vbeln?: string
          vbeln_c?: string | null
          vbeln_del?: string | null
          vgbel?: string | null
          vrkme?: string | null
          vtext?: string | null
          vtext_dc?: string | null
          vtext_desp?: string | null
          vtext_pay?: string | null
          vtext_sd?: string | null
          vtweg_auft?: string | null
          vtxt_c?: string | null
          vtxt_v?: string | null
          waerk?: string | null
          werks?: string | null
          wrdets?: string | null
          wrmnts?: string | null
          xblnr?: string | null
          zah?: number
          zgst?: number
          zgst_ex?: number
          zkkc?: number
          zkkc_ex?: number
          zterm?: string | null
          zwrexpdt?: string | null
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
      sap_user_dropdown_masters: {
        Row: {
          category: string
          code: string
          created_at: string
          id: string
          name: string | null
          raw: Json
          source_endpoint: string
          synced_at: string
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          id?: string
          name?: string | null
          raw?: Json
          source_endpoint?: string
          synced_at?: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          id?: string
          name?: string | null
          raw?: Json
          source_endpoint?: string
          synced_at?: string
          updated_at?: string
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
      zcash_flow: {
        Row: {
          classification: string | null
          collection_disbursement: string | null
          created_at: string
          credit: number
          debit: number
          gl_code: string
          gl_name: string | null
          group_name: string | null
          id: string
          nature: string | null
          net: number
          plant: string
          profit_center: string
          profit_center_group: string | null
          profit_center_name: string | null
          raw: Json
          source_endpoint: string
          synced_at: string
          updated_at: string
        }
        Insert: {
          classification?: string | null
          collection_disbursement?: string | null
          created_at?: string
          credit?: number
          debit?: number
          gl_code?: string
          gl_name?: string | null
          group_name?: string | null
          id?: string
          nature?: string | null
          net?: number
          plant?: string
          profit_center?: string
          profit_center_group?: string | null
          profit_center_name?: string | null
          raw?: Json
          source_endpoint?: string
          synced_at?: string
          updated_at?: string
        }
        Update: {
          classification?: string | null
          collection_disbursement?: string | null
          created_at?: string
          credit?: number
          debit?: number
          gl_code?: string
          gl_name?: string | null
          group_name?: string | null
          id?: string
          nature?: string | null
          net?: number
          plant?: string
          profit_center?: string
          profit_center_group?: string | null
          profit_center_name?: string | null
          raw?: Json
          source_endpoint?: string
          synced_at?: string
          updated_at?: string
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
          mngrp1: string | null
          model: string | null
          month: string | null
          new_repl: string | null
          occurrence_no: number
          pc_short_name: string | null
          pcgrp1: string | null
          pcgrp2: string | null
          pcgrp3: string | null
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
          mngrp1?: string | null
          model?: string | null
          month?: string | null
          new_repl?: string | null
          occurrence_no?: number
          pc_short_name?: string | null
          pcgrp1?: string | null
          pcgrp2?: string | null
          pcgrp3?: string | null
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
          mngrp1?: string | null
          model?: string | null
          month?: string | null
          new_repl?: string | null
          occurrence_no?: number
          pc_short_name?: string | null
          pcgrp1?: string | null
          pcgrp2?: string | null
          pcgrp3?: string | null
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
      current_access_plants: { Args: never; Returns: string[] }
      current_access_profit_centers: { Args: never; Returns: string[] }
      current_access_unrestricted: { Args: never; Returns: boolean }
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
      is_data_admin: { Args: { _user_id: string }; Returns: boolean }
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
      user_can_see: {
        Args: { _plant: string; _profit_center: string }
        Returns: boolean
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
