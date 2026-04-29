export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.1'
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
          role: Database['public']['Enums']['agent_role'] | null
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
          role?: Database['public']['Enums']['agent_role'] | null
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
          role?: Database['public']['Enums']['agent_role'] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'agents_brokerage_id_fkey'
            columns: ['brokerage_id']
            isOneToOne: false
            referencedRelation: 'brokerages'
            referencedColumns: ['id']
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
          risk_level: Database['public']['Enums']['compliance_risk'] | null
          sanctions_match: boolean | null
          status: Database['public']['Enums']['compliance_status']
          type: Database['public']['Enums']['compliance_check_type']
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
          risk_level?: Database['public']['Enums']['compliance_risk'] | null
          sanctions_match?: boolean | null
          status?: Database['public']['Enums']['compliance_status']
          type: Database['public']['Enums']['compliance_check_type']
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
          risk_level?: Database['public']['Enums']['compliance_risk'] | null
          sanctions_match?: boolean | null
          status?: Database['public']['Enums']['compliance_status']
          type?: Database['public']['Enums']['compliance_check_type']
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'compliance_checks_brokerage_id_fkey'
            columns: ['brokerage_id']
            isOneToOne: false
            referencedRelation: 'brokerages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'compliance_checks_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'compliance_checks_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'agents'
            referencedColumns: ['id']
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
            foreignKeyName: 'lead_interactions_agent_id_fkey'
            columns: ['agent_id']
            isOneToOne: false
            referencedRelation: 'agents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lead_interactions_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: {
          ai_score: number | null
          assigned_agent_id: string | null
          brokerage_id: string
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          metadata: Json | null
          notes: string | null
          origin: Database['public']['Enums']['lead_origin']
          phone: string | null
          property_id: string | null
          status: Database['public']['Enums']['lead_status'] | null
          updated_at: string | null
        }
        Insert: {
          ai_score?: number | null
          assigned_agent_id?: string | null
          brokerage_id: string
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          origin: Database['public']['Enums']['lead_origin']
          phone?: string | null
          property_id?: string | null
          status?: Database['public']['Enums']['lead_status'] | null
          updated_at?: string | null
        }
        Update: {
          ai_score?: number | null
          assigned_agent_id?: string | null
          brokerage_id?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          origin?: Database['public']['Enums']['lead_origin']
          phone?: string | null
          property_id?: string | null
          status?: Database['public']['Enums']['lead_status'] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'leads_assigned_agent_id_fkey'
            columns: ['assigned_agent_id']
            isOneToOne: false
            referencedRelation: 'agents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_brokerage_id_fkey'
            columns: ['brokerage_id']
            isOneToOne: false
            referencedRelation: 'brokerages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
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
          latitude: number | null
          listing_type: Database['public']['Enums']['listing_type']
          longitude: number | null
          neighborhood: string | null
          price: number | null
          property_type: Database['public']['Enums']['property_type']
          status: Database['public']['Enums']['property_status'] | null
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
          latitude?: number | null
          listing_type: Database['public']['Enums']['listing_type']
          longitude?: number | null
          neighborhood?: string | null
          price?: number | null
          property_type: Database['public']['Enums']['property_type']
          status?: Database['public']['Enums']['property_status'] | null
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
          latitude?: number | null
          listing_type?: Database['public']['Enums']['listing_type']
          longitude?: number | null
          neighborhood?: string | null
          price?: number | null
          property_type?: Database['public']['Enums']['property_type']
          status?: Database['public']['Enums']['property_status'] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'properties_agent_id_fkey'
            columns: ['agent_id']
            isOneToOne: false
            referencedRelation: 'agents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'properties_brokerage_id_fkey'
            columns: ['brokerage_id']
            isOneToOne: false
            referencedRelation: 'brokerages'
            referencedColumns: ['id']
          },
        ]
      }
      viewings: {
        Row: {
          agent_id: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          lead_id: string | null
          notes: string | null
          property_id: string
          scheduled_at: string
          status: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          property_id: string
          scheduled_at: string
          status?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          property_id?: string
          scheduled_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'viewings_agent_id_fkey'
            columns: ['agent_id']
            isOneToOne: false
            referencedRelation: 'agents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viewings_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viewings_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      current_brokerage_id: { Args: never; Returns: string }
      seed_demo_data: { Args: never; Returns: undefined }
      slugify: { Args: { input: string }; Returns: string }
    }
    Enums: {
      agent_role: 'owner' | 'admin' | 'agent'
      compliance_check_type: 'kyc' | 'aml' | 'sanctions' | 'pep'
      compliance_risk: 'low' | 'medium' | 'high' | 'critical'
      compliance_status:
        | 'pending'
        | 'in_review'
        | 'approved'
        | 'rejected'
        | 'requires_action'
      lead_origin: 'portal' | 'web' | 'referido' | 'whatsapp' | 'walk_in' | 'other'
      lead_status:
        | 'new'
        | 'contacted'
        | 'qualified'
        | 'viewing_scheduled'
        | 'negotiating'
        | 'closed_won'
        | 'closed_lost'
      listing_type: 'sale' | 'rent'
      property_status:
        | 'draft'
        | 'active'
        | 'pending'
        | 'sold'
        | 'rented'
        | 'archived'
      property_type: 'apartment' | 'house' | 'condo' | 'land' | 'commercial'
    }
    CompositeTypes: { [_ in never]: never }
  }
}
