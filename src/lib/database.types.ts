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
      agents: {
        Row: {
          avatar_url: string | null
          brokerage_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["agent_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          brokerage_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["agent_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          brokerage_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["agent_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
        ]
      }
      brokerages: {
        Row: {
          country_code: string | null
          created_at: string | null
          id: string
          name: string
          ruc: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          id?: string
          name: string
          ruc?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          ruc?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_alerts: {
        Row: {
          brokerage_id: string
          check_id: string | null
          created_at: string | null
          description: string | null
          details: Json | null
          document_id: string | null
          id: string
          kind: Database["public"]["Enums"]["compliance_alert_kind"]
          lead_id: string | null
          property_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["compliance_alert_severity"]
          status: Database["public"]["Enums"]["compliance_alert_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          brokerage_id: string
          check_id?: string | null
          created_at?: string | null
          description?: string | null
          details?: Json | null
          document_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["compliance_alert_kind"]
          lead_id?: string | null
          property_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["compliance_alert_severity"]
          status?: Database["public"]["Enums"]["compliance_alert_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          brokerage_id?: string
          check_id?: string | null
          created_at?: string | null
          description?: string | null
          details?: Json | null
          document_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["compliance_alert_kind"]
          lead_id?: string | null
          property_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["compliance_alert_severity"]
          status?: Database["public"]["Enums"]["compliance_alert_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_alerts_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "compliance_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "compliance_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_audit_log: {
        Row: {
          action: string
          agent_id: string | null
          brokerage_id: string
          check_id: string
          created_at: string | null
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          agent_id?: string | null
          brokerage_id: string
          check_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          agent_id?: string | null
          brokerage_id?: string
          check_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_audit_log_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_audit_log_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_audit_log_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "compliance_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_checks: {
        Row: {
          brokerage_id: string
          created_at: string | null
          document_country: string | null
          document_id: string | null
          document_type: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          notes: string | null
          pep_match: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_level: Database["public"]["Enums"]["compliance_risk"] | null
          sanctions_match: boolean | null
          scenario:
            | Database["public"]["Enums"]["compliance_check_scenario"]
            | null
          status: Database["public"]["Enums"]["compliance_status"]
          type: Database["public"]["Enums"]["compliance_check_type"]
          updated_at: string | null
        }
        Insert: {
          brokerage_id: string
          created_at?: string | null
          document_country?: string | null
          document_id?: string | null
          document_type?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          pep_match?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: Database["public"]["Enums"]["compliance_risk"] | null
          sanctions_match?: boolean | null
          scenario?:
            | Database["public"]["Enums"]["compliance_check_scenario"]
            | null
          status?: Database["public"]["Enums"]["compliance_status"]
          type: Database["public"]["Enums"]["compliance_check_type"]
          updated_at?: string | null
        }
        Update: {
          brokerage_id?: string
          created_at?: string | null
          document_country?: string | null
          document_id?: string | null
          document_type?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          pep_match?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: Database["public"]["Enums"]["compliance_risk"] | null
          sanctions_match?: boolean | null
          scenario?:
            | Database["public"]["Enums"]["compliance_check_scenario"]
            | null
          status?: Database["public"]["Enums"]["compliance_status"]
          type?: Database["public"]["Enums"]["compliance_check_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_checks_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_checks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_checks_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          brokerage_id: string
          category: string | null
          check_id: string
          code: string | null
          created_at: string | null
          description: string | null
          file_name: string | null
          file_path: string | null
          id: string
          is_corporate_only: boolean | null
          is_required: boolean | null
          kind: Database["public"]["Enums"]["compliance_doc_kind"]
          name: string | null
          notes: string | null
          status: Database["public"]["Enums"]["compliance_doc_status"]
          updated_at: string | null
          uploaded_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          brokerage_id: string
          category?: string | null
          check_id: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_corporate_only?: boolean | null
          is_required?: boolean | null
          kind: Database["public"]["Enums"]["compliance_doc_kind"]
          name?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["compliance_doc_status"]
          updated_at?: string | null
          uploaded_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          brokerage_id?: string
          category?: string | null
          check_id?: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_corporate_only?: boolean | null
          is_required?: boolean | null
          kind?: Database["public"]["Enums"]["compliance_doc_kind"]
          name?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["compliance_doc_status"]
          updated_at?: string | null
          uploaded_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "compliance_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          agent_id: string | null
          amount: number | null
          brokerage_id: string
          closed_at: string | null
          created_at: string
          currency: string
          id: string
          lead_id: string
          lost_reason: string | null
          metadata: Json
          property_id: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string | null
          updated_at: string
          winning_property_id: string | null
        }
        Insert: {
          agent_id?: string | null
          amount?: number | null
          brokerage_id: string
          closed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          lead_id: string
          lost_reason?: string | null
          metadata?: Json
          property_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string | null
          updated_at?: string
          winning_property_id?: string | null
        }
        Update: {
          agent_id?: string | null
          amount?: number | null
          brokerage_id?: string
          closed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          lead_id?: string
          lost_reason?: string | null
          metadata?: Json
          property_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string | null
          updated_at?: string
          winning_property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          account_label: string | null
          brokerage_id: string
          config: Json | null
          created_at: string | null
          credentials: Json | null
          error_count: number | null
          id: string
          last_error: string | null
          last_synced_at: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string | null
        }
        Insert: {
          account_label?: string | null
          brokerage_id: string
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          error_count?: number | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          provider: Database["public"]["Enums"]["integration_provider"]
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string | null
        }
        Update: {
          account_label?: string | null
          brokerage_id?: string
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          error_count?: number | null
          id?: string
          last_error?: string | null
          last_synced_at?: string | null
          provider?: Database["public"]["Enums"]["integration_provider"]
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          agent_id: string | null
          content: string | null
          created_at: string | null
          id: string
          lead_id: string
          metadata: Json | null
          type: string
        }
        Insert: {
          agent_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          type: string
        }
        Update: {
          agent_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_properties: {
        Row: {
          brokerage_id: string
          created_at: string
          deal_id: string | null
          id: string
          lead_id: string
          lost_reason: string | null
          property_id: string
          role: Database["public"]["Enums"]["lead_property_role"]
          status: Database["public"]["Enums"]["lead_property_status"]
          updated_at: string
        }
        Insert: {
          brokerage_id: string
          created_at?: string
          deal_id?: string | null
          id?: string
          lead_id: string
          lost_reason?: string | null
          property_id: string
          role?: Database["public"]["Enums"]["lead_property_role"]
          status?: Database["public"]["Enums"]["lead_property_status"]
          updated_at?: string
        }
        Update: {
          brokerage_id?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          lead_id?: string
          lost_reason?: string | null
          property_id?: string
          role?: Database["public"]["Enums"]["lead_property_role"]
          status?: Database["public"]["Enums"]["lead_property_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_properties_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_properties_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_score: number | null
          ai_score_factors: Json
          ai_score_updated_at: string | null
          assigned_agent_id: string | null
          brokerage_id: string
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          metadata: Json | null
          notes: string | null
          origin: Database["public"]["Enums"]["lead_origin"]
          phone: string | null
          property_id: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          updated_at: string | null
        }
        Insert: {
          ai_score?: number | null
          ai_score_factors?: Json
          ai_score_updated_at?: string | null
          assigned_agent_id?: string | null
          brokerage_id: string
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          origin: Database["public"]["Enums"]["lead_origin"]
          phone?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
        }
        Update: {
          ai_score?: number | null
          ai_score_factors?: Json
          ai_score_updated_at?: string | null
          assigned_agent_id?: string | null
          brokerage_id?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          origin?: Database["public"]["Enums"]["lead_origin"]
          phone?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          agent_id: string | null
          attachments: Json
          body: string | null
          brokerage_id: string
          channel: string
          created_at: string
          delivered_at: string | null
          direction: string
          error_code: string | null
          error_message: string | null
          external_id: string | null
          failed_at: string | null
          from_address: string | null
          id: string
          lead_id: string | null
          metadata: Json
          read_at: string | null
          sent_at: string | null
          status: string
          subject: string | null
          template_code: string | null
          thread_id: string | null
          to_address: string | null
        }
        Insert: {
          agent_id?: string | null
          attachments?: Json
          body?: string | null
          brokerage_id: string
          channel: string
          created_at?: string
          delivered_at?: string | null
          direction: string
          error_code?: string | null
          error_message?: string | null
          external_id?: string | null
          failed_at?: string | null
          from_address?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          read_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_code?: string | null
          thread_id?: string | null
          to_address?: string | null
        }
        Update: {
          agent_id?: string | null
          attachments?: Json
          body?: string | null
          brokerage_id?: string
          channel?: string
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error_code?: string | null
          error_message?: string | null
          external_id?: string | null
          failed_at?: string | null
          from_address?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          read_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_code?: string | null
          thread_id?: string | null
          to_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          city: string
          country_code: string
          created_at: string | null
          district: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          city: string
          country_code?: string
          created_at?: string | null
          district?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          city?: string
          country_code?: string
          created_at?: string | null
          district?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          agent_id: string | null
          body: string | null
          brokerage_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          metadata: Json
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          agent_id?: string | null
          body?: string | null
          brokerage_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          agent_id?: string | null
          body?: string | null
          brokerage_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          agent_id: string | null
          amount: number
          brokerage_id: string
          conditions: string | null
          created_at: string
          currency: string
          deal_id: string | null
          id: string
          lead_id: string
          metadata: Json
          notes: string | null
          property_id: string
          public_token: string | null
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          amount: number
          brokerage_id: string
          conditions?: string | null
          created_at?: string
          currency?: string
          deal_id?: string | null
          id?: string
          lead_id: string
          metadata?: Json
          notes?: string | null
          property_id: string
          public_token?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          amount?: number
          brokerage_id?: string
          conditions?: string | null
          created_at?: string
          currency?: string
          deal_id?: string | null
          id?: string
          lead_id?: string
          metadata?: Json
          notes?: string | null
          property_id?: string
          public_token?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          agent_id: string | null
          ai_score: number | null
          area_m2: number | null
          bathrooms: number | null
          bedrooms: number | null
          brokerage_id: string
          city: string | null
          country_code: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          external_id: string | null
          features: Json | null
          id: string
          images: Json | null
          is_boosted: boolean
          latitude: number | null
          listing_expires_at: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          longitude: number | null
          neighborhood: string | null
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          price: number | null
          price_history: Json
          property_type: Database["public"]["Enums"]["property_type"]
          status: Database["public"]["Enums"]["property_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          agent_id?: string | null
          ai_score?: number | null
          area_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          brokerage_id: string
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_id?: string | null
          features?: Json | null
          id?: string
          images?: Json | null
          is_boosted?: boolean
          latitude?: number | null
          listing_expires_at?: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          longitude?: number | null
          neighborhood?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          price?: number | null
          price_history?: Json
          property_type: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["property_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          agent_id?: string | null
          ai_score?: number | null
          area_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          brokerage_id?: string
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_id?: string | null
          features?: Json | null
          id?: string
          images?: Json | null
          is_boosted?: boolean
          latitude?: number | null
          listing_expires_at?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          longitude?: number | null
          neighborhood?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          price?: number | null
          price_history?: Json
          property_type?: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["property_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
        ]
      }
      property_publications: {
        Row: {
          adapted_description: string | null
          adapted_image_paths: Json | null
          adapted_title: string | null
          brokerage_id: string
          created_at: string | null
          external_id: string | null
          external_url: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          property_id: string
          provider: Database["public"]["Enums"]["integration_provider"]
          published_at: string | null
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string | null
          validated_at: string | null
        }
        Insert: {
          adapted_description?: string | null
          adapted_image_paths?: Json | null
          adapted_title?: string | null
          brokerage_id: string
          created_at?: string | null
          external_id?: string | null
          external_url?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          property_id: string
          provider: Database["public"]["Enums"]["integration_provider"]
          published_at?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string | null
          validated_at?: string | null
        }
        Update: {
          adapted_description?: string | null
          adapted_image_paths?: Json | null
          adapted_title?: string | null
          brokerage_id?: string
          created_at?: string | null
          external_id?: string | null
          external_url?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          property_id?: string
          provider?: Database["public"]["Enums"]["integration_provider"]
          published_at?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_publications_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_publications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          address: string | null
          brokerage_id: string
          city: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          license_number: string | null
          metadata: Json
          name: string
          notes: string | null
          phone: string | null
          service_type: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          brokerage_id: string
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          license_number?: string | null
          metadata?: Json
          name: string
          notes?: string | null
          phone?: string | null
          service_type: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          brokerage_id?: string
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          license_number?: string | null
          metadata?: Json
          name?: string
          notes?: string | null
          phone?: string | null
          service_type?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "providers_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_documents: {
        Row: {
          agent_id: string | null
          brokerage_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          pdf_path: string | null
          property_id: string
          sent_at: string | null
          signature_ip: string | null
          signature_typed: string | null
          signature_user_agent: string | null
          signed_at: string | null
          signed_pdf_path: string | null
          signer_email: string | null
          signer_name: string
          signer_phone: string | null
          signing_token: string
          status: Database["public"]["Enums"]["signature_document_status"]
          template_data: Json | null
          template_type: Database["public"]["Enums"]["signature_document_template"]
          title: string
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          agent_id?: string | null
          brokerage_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          pdf_path?: string | null
          property_id: string
          sent_at?: string | null
          signature_ip?: string | null
          signature_typed?: string | null
          signature_user_agent?: string | null
          signed_at?: string | null
          signed_pdf_path?: string | null
          signer_email?: string | null
          signer_name: string
          signer_phone?: string | null
          signing_token: string
          status?: Database["public"]["Enums"]["signature_document_status"]
          template_data?: Json | null
          template_type: Database["public"]["Enums"]["signature_document_template"]
          title: string
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          agent_id?: string | null
          brokerage_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          pdf_path?: string | null
          property_id?: string
          sent_at?: string | null
          signature_ip?: string | null
          signature_typed?: string | null
          signature_user_agent?: string | null
          signed_at?: string | null
          signed_pdf_path?: string | null
          signer_email?: string | null
          signer_name?: string
          signer_phone?: string | null
          signing_token?: string
          status?: Database["public"]["Enums"]["signature_document_status"]
          template_data?: Json | null
          template_type?: Database["public"]["Enums"]["signature_document_template"]
          title?: string
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_documents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_documents_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      task_audit_log: {
        Row: {
          action: string
          agent_id: string | null
          brokerage_id: string
          created_at: string
          details: Json
          id: string
          task_id: string
        }
        Insert: {
          action: string
          agent_id?: string | null
          brokerage_id: string
          created_at?: string
          details?: Json
          id?: string
          task_id: string
        }
        Update: {
          action?: string
          agent_id?: string | null
          brokerage_id?: string
          created_at?: string
          details?: Json
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_audit_log_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_audit_log_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_audit_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          agent_id: string | null
          auto_complete_on: string | null
          brokerage_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          cta_action: string
          cta_metadata: Json
          deal_id: string | null
          description: string | null
          due_at: string | null
          escalation_at: string | null
          id: string
          lead_id: string
          offer_id: string | null
          phase: string
          property_id: string | null
          status: string
          step_number: number
          title: string
          trigger_reason: Json
          updated_at: string
          viewing_id: string | null
        }
        Insert: {
          agent_id?: string | null
          auto_complete_on?: string | null
          brokerage_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          cta_action: string
          cta_metadata?: Json
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          escalation_at?: string | null
          id?: string
          lead_id: string
          offer_id?: string | null
          phase: string
          property_id?: string | null
          status?: string
          step_number: number
          title: string
          trigger_reason?: Json
          updated_at?: string
          viewing_id?: string | null
        }
        Update: {
          agent_id?: string | null
          auto_complete_on?: string | null
          brokerage_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          cta_action?: string
          cta_metadata?: Json
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          escalation_at?: string | null
          id?: string
          lead_id?: string
          offer_id?: string | null
          phase?: string
          property_id?: string | null
          status?: string
          step_number?: number
          title?: string
          trigger_reason?: Json
          updated_at?: string
          viewing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_viewing_id_fkey"
            columns: ["viewing_id"]
            isOneToOne: false
            referencedRelation: "viewings"
            referencedColumns: ["id"]
          },
        ]
      }
      viewings: {
        Row: {
          agent_id: string | null
          created_at: string | null
          duration_minutes: number | null
          external_calendar_id: string | null
          external_event_id: string | null
          id: string
          last_synced_at: string | null
          lead_id: string | null
          notes: string | null
          property_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["viewing_status"] | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          external_calendar_id?: string | null
          external_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          lead_id?: string | null
          notes?: string | null
          property_id: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["viewing_status"] | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          external_calendar_id?: string | null
          external_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          lead_id?: string | null
          notes?: string | null
          property_id?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["viewing_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "viewings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          brokerage_id: string | null
          error: string | null
          event_type: string | null
          external_id: string | null
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          received_at: string
          signature_valid: boolean | null
        }
        Insert: {
          brokerage_id?: string | null
          error?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string
          payload: Json
          processed_at?: string | null
          provider: string
          received_at?: string
          signature_valid?: boolean | null
        }
        Update: {
          brokerage_id?: string | null
          error?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          received_at?: string
          signature_valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      integrations_public: {
        Row: {
          account_label: string | null
          brokerage_id: string | null
          config: Json | null
          created_at: string | null
          error_count: number | null
          has_credentials: boolean | null
          id: string | null
          last_error: string | null
          last_synced_at: string | null
          provider: Database["public"]["Enums"]["integration_provider"] | null
          status: Database["public"]["Enums"]["integration_status"] | null
          updated_at: string | null
        }
        Insert: {
          account_label?: string | null
          brokerage_id?: string | null
          config?: Json | null
          created_at?: string | null
          error_count?: number | null
          has_credentials?: never
          id?: string | null
          last_error?: string | null
          last_synced_at?: string | null
          provider?: Database["public"]["Enums"]["integration_provider"] | null
          status?: Database["public"]["Enums"]["integration_status"] | null
          updated_at?: string | null
        }
        Update: {
          account_label?: string | null
          brokerage_id?: string | null
          config?: Json | null
          created_at?: string | null
          error_count?: number | null
          has_credentials?: never
          id?: string | null
          last_error?: string | null
          last_synced_at?: string | null
          provider?: Database["public"]["Enums"]["integration_provider"] | null
          status?: Database["public"]["Enums"]["integration_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_brokerage_id_fkey"
            columns: ["brokerage_id"]
            isOneToOne: false
            referencedRelation: "brokerages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_brokerage_id: { Args: never; Returns: string }
      seed_demo_data: { Args: never; Returns: undefined }
      slugify: { Args: { input: string }; Returns: string }
      offer_by_public_token: {
        Args: { p_token: string }
        Returns: Array<{
          offer_id: string
          offer_amount: number
          offer_currency: string
          offer_conditions: string | null
          offer_notes: string | null
          offer_created_at: string
          offer_status: string
          buyer_full_name: string
          buyer_phone: string | null
          buyer_email: string | null
          property_title: string
          property_address: string | null
          property_neighborhood: string | null
          property_city: string | null
          property_price: number | null
          property_currency: string | null
          property_type: string
          property_bedrooms: number | null
          property_bathrooms: number | null
          property_area_m2: number | null
          owner_name: string | null
          owner_phone: string | null
          owner_email: string | null
          brokerage_name: string | null
          agent_full_name: string | null
          agent_phone: string | null
        }>
      }
    }
    Enums: {
      agent_role: "owner" | "admin" | "agent"
      compliance_alert_kind:
        | "sanctions_match"
        | "pep_match"
        | "doc_expiring"
        | "doc_expired"
        | "transaction_threshold"
        | "suspicious_activity"
        | "kyc_overdue"
        | "review_due"
      compliance_alert_severity: "info" | "low" | "medium" | "high" | "critical"
      compliance_alert_status:
        | "open"
        | "acknowledged"
        | "resolved"
        | "false_positive"
        | "escalated"
      compliance_check_scenario:
        | "sale_buyer"
        | "sale_seller"
        | "rental_tenant"
        | "rental_landlord"
        | "broker_sale"
        | "broker_rental"
      compliance_check_type: "kyc" | "aml" | "sanctions" | "pep"
      compliance_doc_kind:
        | "identity"
        | "address_proof"
        | "income_proof"
        | "funds_origin"
        | "company_existence"
        | "company_ubo"
        | "pep_declaration"
        | "other"
      compliance_doc_status:
        | "pending"
        | "uploaded"
        | "verified"
        | "rejected"
        | "expired"
      compliance_risk: "low" | "medium" | "high" | "critical"
      compliance_status:
        | "pending"
        | "in_review"
        | "approved"
        | "rejected"
        | "requires_action"
      deal_stage:
        | "contacto_inicial"
        | "visitas"
        | "negociacion"
        | "promesa_firmada"
        | "tramite_bancario"
        | "escritura_publica"
        | "entrega_llaves"
        | "post_cierre"
        | "closed_won"
        | "closed_lost"
      integration_provider:
        | "encuentra24"
        | "compreoalquile"
        | "inmuebles24"
        | "mercadolibre_inmuebles"
        | "properati"
        | "idealista"
        | "zonaprop"
        | "casas"
        | "facebook_marketplace"
        | "instagram_business"
        | "whatsapp_business"
        | "webhook_custom"
        | "acobir_mls"
        | "whatsapp_status"
        | "agency_website"
        | "email_matches"
        | "google_calendar"
        | "outlook_calendar"
        | "resend"
        | "sendgrid"
      integration_status:
        | "disconnected"
        | "connecting"
        | "connected"
        | "error"
        | "expired"
      lead_origin:
        | "portal"
        | "web"
        | "referido"
        | "whatsapp"
        | "walk_in"
        | "other"
      lead_property_role: "sugerida" | "interesada" | "visitada" | "ofertada"
      lead_property_status:
        | "pendiente"
        | "le_encanto"
        | "descartada"
        | "oferta_hecha"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "viewing_scheduled"
        | "negotiating"
        | "closed_won"
        | "closed_lost"
      listing_type: "sale" | "rent"
      offer_status:
        | "draft"
        | "submitted"
        | "countered"
        | "accepted"
        | "rejected"
        | "expired"
        | "withdrawn"
      property_status:
        | "draft"
        | "active"
        | "pending"
        | "sold"
        | "rented"
        | "archived"
      property_type: "apartment" | "house" | "condo" | "land" | "commercial"
      publication_status:
        | "draft"
        | "generating"
        | "validated"
        | "queued"
        | "publishing"
        | "published"
        | "failed"
        | "paused"
      signature_document_status:
        | "draft"
        | "sent"
        | "viewed"
        | "signed"
        | "expired"
        | "cancelled"
      signature_document_template:
        | "autorizacion_venta"
        | "promesa_compraventa"
        | "addendum"
      viewing_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
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
      agent_role: ["owner", "admin", "agent"],
      compliance_alert_kind: [
        "sanctions_match",
        "pep_match",
        "doc_expiring",
        "doc_expired",
        "transaction_threshold",
        "suspicious_activity",
        "kyc_overdue",
        "review_due",
      ],
      compliance_alert_severity: ["info", "low", "medium", "high", "critical"],
      compliance_alert_status: [
        "open",
        "acknowledged",
        "resolved",
        "false_positive",
        "escalated",
      ],
      compliance_check_scenario: [
        "sale_buyer",
        "sale_seller",
        "rental_tenant",
        "rental_landlord",
        "broker_sale",
        "broker_rental",
      ],
      compliance_check_type: ["kyc", "aml", "sanctions", "pep"],
      compliance_doc_kind: [
        "identity",
        "address_proof",
        "income_proof",
        "funds_origin",
        "company_existence",
        "company_ubo",
        "pep_declaration",
        "other",
      ],
      compliance_doc_status: [
        "pending",
        "uploaded",
        "verified",
        "rejected",
        "expired",
      ],
      compliance_risk: ["low", "medium", "high", "critical"],
      compliance_status: [
        "pending",
        "in_review",
        "approved",
        "rejected",
        "requires_action",
      ],
      deal_stage: [
        "contacto_inicial",
        "visitas",
        "negociacion",
        "promesa_firmada",
        "tramite_bancario",
        "escritura_publica",
        "entrega_llaves",
        "post_cierre",
        "closed_won",
        "closed_lost",
      ],
      integration_provider: [
        "encuentra24",
        "compreoalquile",
        "inmuebles24",
        "mercadolibre_inmuebles",
        "properati",
        "idealista",
        "zonaprop",
        "casas",
        "facebook_marketplace",
        "instagram_business",
        "whatsapp_business",
        "webhook_custom",
        "acobir_mls",
        "whatsapp_status",
        "agency_website",
        "email_matches",
        "google_calendar",
        "outlook_calendar",
        "resend",
        "sendgrid",
      ],
      integration_status: [
        "disconnected",
        "connecting",
        "connected",
        "error",
        "expired",
      ],
      lead_origin: [
        "portal",
        "web",
        "referido",
        "whatsapp",
        "walk_in",
        "other",
      ],
      lead_property_role: ["sugerida", "interesada", "visitada", "ofertada"],
      lead_property_status: [
        "pendiente",
        "le_encanto",
        "descartada",
        "oferta_hecha",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "viewing_scheduled",
        "negotiating",
        "closed_won",
        "closed_lost",
      ],
      listing_type: ["sale", "rent"],
      offer_status: [
        "draft",
        "submitted",
        "countered",
        "accepted",
        "rejected",
        "expired",
        "withdrawn",
      ],
      property_status: [
        "draft",
        "active",
        "pending",
        "sold",
        "rented",
        "archived",
      ],
      property_type: ["apartment", "house", "condo", "land", "commercial"],
      publication_status: [
        "draft",
        "generating",
        "validated",
        "queued",
        "publishing",
        "published",
        "failed",
        "paused",
      ],
      signature_document_status: [
        "draft",
        "sent",
        "viewed",
        "signed",
        "expired",
        "cancelled",
      ],
      signature_document_template: [
        "autorizacion_venta",
        "promesa_compraventa",
        "addendum",
      ],
      viewing_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
    },
  },
} as const

