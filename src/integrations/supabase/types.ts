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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      app_meta: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          created_at: string | null
          id: string
          requester_id: string
          status: string
          target_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          requester_id: string
          status?: string
          target_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          requester_id?: string
          status?: string
          target_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          alias: string | null
          contact_user_id: string
          created_at: string
          id: string
          owner_id: string
          pair_key: string | null
          updated_at: string
        }
        Insert: {
          alias?: string | null
          contact_user_id: string
          created_at?: string
          id?: string
          owner_id: string
          pair_key?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string | null
          contact_user_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          pair_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      debug_accept_log: {
        Row: {
          action: string
          actor: string
          at: string | null
          details: Json | null
          id: number
        }
        Insert: {
          action: string
          actor: string
          at?: string | null
          details?: Json | null
          id?: number
        }
        Update: {
          action?: string
          actor?: string
          at?: string | null
          details?: Json | null
          id?: number
        }
        Relationships: []
      }
      design_feedback: {
        Row: {
          choice: string
          client_meta: Json | null
          comment: string | null
          created_at: string
          id: string
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          choice: string
          client_meta?: Json | null
          comment?: string | null
          created_at?: string
          id?: string
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          choice?: string
          client_meta?: Json | null
          comment?: string | null
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      event_invites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_invites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          lat: number | null
          lng: number | null
          location_text: string | null
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location_text?: string | null
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location_text?: string | null
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gift_categories: {
        Row: {
          created_at: string | null
          id: string
          label: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          slug?: string
        }
        Relationships: []
      }
      gift_idea_unsplash: {
        Row: {
          category: string | null
          created_at: string
          generation_history: Json | null
          generator_version: string
          gift_idea_hash: string
          gift_idea_text: string
          id: number
          image_regen_reason: string | null
          image_regen_requested_at: string | null
          image_status: string | null
          image_url: string | null
          is_user_uploaded: boolean | null
          last_generated_at: string | null
          last_prompt_negative: string | null
          last_prompt_positive: string | null
          needs_review: boolean | null
          occasion: string | null
          photographer_name: string | null
          photographer_url: string | null
          query_used: string | null
          regenerated_at: string | null
          relevance_score: number | null
          thumb_url: string | null
          unsplash_id: string | null
          unsplash_url: string | null
          updated_at: string
          user_id: string | null
          visual_confidence: number | null
          visual_intent_hash: string | null
          visual_source: string | null
          visual_version: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          generation_history?: Json | null
          generator_version?: string
          gift_idea_hash: string
          gift_idea_text: string
          id?: number
          image_regen_reason?: string | null
          image_regen_requested_at?: string | null
          image_status?: string | null
          image_url?: string | null
          is_user_uploaded?: boolean | null
          last_generated_at?: string | null
          last_prompt_negative?: string | null
          last_prompt_positive?: string | null
          needs_review?: boolean | null
          occasion?: string | null
          photographer_name?: string | null
          photographer_url?: string | null
          query_used?: string | null
          regenerated_at?: string | null
          relevance_score?: number | null
          thumb_url?: string | null
          unsplash_id?: string | null
          unsplash_url?: string | null
          updated_at?: string
          user_id?: string | null
          visual_confidence?: number | null
          visual_intent_hash?: string | null
          visual_source?: string | null
          visual_version?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          generation_history?: Json | null
          generator_version?: string
          gift_idea_hash?: string
          gift_idea_text?: string
          id?: number
          image_regen_reason?: string | null
          image_regen_requested_at?: string | null
          image_status?: string | null
          image_url?: string | null
          is_user_uploaded?: boolean | null
          last_generated_at?: string | null
          last_prompt_negative?: string | null
          last_prompt_positive?: string | null
          needs_review?: boolean | null
          occasion?: string | null
          photographer_name?: string | null
          photographer_url?: string | null
          query_used?: string | null
          regenerated_at?: string | null
          relevance_score?: number | null
          thumb_url?: string | null
          unsplash_id?: string | null
          unsplash_url?: string | null
          updated_at?: string
          user_id?: string | null
          visual_confidence?: number | null
          visual_intent_hash?: string | null
          visual_source?: string | null
          visual_version?: number | null
        }
        Relationships: []
      }
      gift_image_regen_log: {
        Row: {
          caller: string | null
          created_at: string | null
          error: string | null
          found_by_hash: number | null
          found_by_id: number | null
          found_by_text: number | null
          id: number
          method: string | null
          payload: Json | null
          resolved_id: number | null
        }
        Insert: {
          caller?: string | null
          created_at?: string | null
          error?: string | null
          found_by_hash?: number | null
          found_by_id?: number | null
          found_by_text?: number | null
          id?: number
          method?: string | null
          payload?: Json | null
          resolved_id?: number | null
        }
        Update: {
          caller?: string | null
          created_at?: string | null
          error?: string | null
          found_by_hash?: number | null
          found_by_id?: number | null
          found_by_text?: number | null
          id?: number
          method?: string | null
          payload?: Json | null
          resolved_id?: number | null
        }
        Relationships: []
      }
      gift_images_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          gift_name: string
          gift_type: string | null
          id: string
          model: string | null
          prompt_negative: string | null
          prompt_positive: string
          success: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          gift_name: string
          gift_type?: string | null
          id?: string
          model?: string | null
          prompt_negative?: string | null
          prompt_positive: string
          success?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          gift_name?: string
          gift_type?: string | null
          id?: string
          model?: string | null
          prompt_negative?: string | null
          prompt_positive?: string
          success?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      gift_item_merchants: {
        Row: {
          gift_id: string
          merchant_id: string
          relevance: number | null
        }
        Insert: {
          gift_id: string
          merchant_id: string
          relevance?: number | null
        }
        Update: {
          gift_id?: string
          merchant_id?: string
          relevance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_item_merchants_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_items: {
        Row: {
          accuracy_score: number | null
          canonical_media_id: string | null
          category_id: string
          created_at: string | null
          description: string | null
          expected_tags: string[] | null
          id: string
          last_scored: string | null
          title: string
        }
        Insert: {
          accuracy_score?: number | null
          canonical_media_id?: string | null
          category_id: string
          created_at?: string | null
          description?: string | null
          expected_tags?: string[] | null
          id?: string
          last_scored?: string | null
          title: string
        }
        Update: {
          accuracy_score?: number | null
          canonical_media_id?: string | null
          category_id?: string
          created_at?: string | null
          description?: string | null
          expected_tags?: string[] | null
          id?: string
          last_scored?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gift_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_media: {
        Row: {
          alt: string | null
          category_id: string
          created_at: string | null
          height: number | null
          id: string
          quality_score: number | null
          source_ref: string
          source_type: string
          status: string
          tags: string[] | null
          title: string | null
          width: number | null
        }
        Insert: {
          alt?: string | null
          category_id: string
          created_at?: string | null
          height?: number | null
          id?: string
          quality_score?: number | null
          source_ref: string
          source_type: string
          status?: string
          tags?: string[] | null
          title?: string | null
          width?: number | null
        }
        Update: {
          alt?: string | null
          category_id?: string
          created_at?: string | null
          height?: number | null
          id?: string
          quality_score?: number | null
          source_ref?: string
          source_type?: string
          status?: string
          tags?: string[] | null
          title?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_media_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gift_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_query_logs: {
        Row: {
          created_at: string | null
          id: string
          matched_gift_id: string | null
          merchant_id: string | null
          normalized: string | null
          query_text: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          matched_gift_id?: string | null
          merchant_id?: string | null
          normalized?: string | null
          query_text: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          matched_gift_id?: string | null
          merchant_id?: string | null
          normalized?: string | null
          query_text?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_query_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gift_query_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_profile_source"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gift_regen_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_checkpoint: number | null
          error_log: Json | null
          failed_items: number | null
          force_regen: boolean | null
          id: string
          job_type: string
          processed_items: number | null
          started_at: string | null
          stats: Json | null
          status: string
          success_items: number | null
          total_items: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_checkpoint?: number | null
          error_log?: Json | null
          failed_items?: number | null
          force_regen?: boolean | null
          id?: string
          job_type?: string
          processed_items?: number | null
          started_at?: string | null
          stats?: Json | null
          status?: string
          success_items?: number | null
          total_items?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_checkpoint?: number | null
          error_log?: Json | null
          failed_items?: number | null
          force_regen?: boolean | null
          id?: string
          job_type?: string
          processed_items?: number | null
          started_at?: string | null
          stats?: Json | null
          status?: string
          success_items?: number | null
          total_items?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gift_taxonomy: {
        Row: {
          created_at: string | null
          parents: string[] | null
          tag: string
        }
        Insert: {
          created_at?: string | null
          parents?: string[] | null
          tag: string
        }
        Update: {
          created_at?: string | null
          parents?: string[] | null
          tag?: string
        }
        Relationships: []
      }
      gifts: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      image_library: {
        Row: {
          attrs: Json | null
          category_id: string | null
          created_at: string
          id: string
          image_url: string
          label: string
          license: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          attrs?: Json | null
          category_id?: string | null
          created_at?: string
          id?: string
          image_url: string
          label: string
          license?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          attrs?: Json | null
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string
          label?: string
          license?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      image_regen_jobs: {
        Row: {
          attempts: number
          created_at: string | null
          error: string | null
          id: string
          profile_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string | null
          error?: string | null
          id?: string
          profile_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string | null
          error?: string | null
          id?: string
          profile_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_regen_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          active: boolean | null
          created_at: string | null
          external_url: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          external_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          external_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_avatar_url: string | null
          actor_name: string | null
          actor_user_id: string | null
          contact_id: string | null
          created_at: string
          fire_at: string | null
          id: string
          message: string
          payload: Json | null
          read: boolean | null
          read_at: string | null
          ref_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_avatar_url?: string | null
          actor_name?: string | null
          actor_user_id?: string | null
          contact_id?: string | null
          created_at?: string
          fire_at?: string | null
          id?: string
          message: string
          payload?: Json | null
          read?: boolean | null
          read_at?: string | null
          ref_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_avatar_url?: string | null
          actor_name?: string | null
          actor_user_id?: string | null
          contact_id?: string | null
          created_at?: string
          fire_at?: string | null
          id?: string
          message?: string
          payload?: Json | null
          read?: boolean | null
          read_at?: string | null
          ref_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "my_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_next_birthday"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          created_at: string
          formatted_address: string | null
          google_maps_url: string | null
          google_place_id: string | null
          id: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          notes: string | null
          phone: string | null
          place_id: string | null
          rating: number | null
          regift_compatible: boolean | null
          status: string | null
          updated_at: string | null
          url: string | null
          user_ratings_total: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          formatted_address?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          place_id?: string | null
          rating?: number | null
          regift_compatible?: boolean | null
          status?: string | null
          updated_at?: string | null
          url?: string | null
          user_ratings_total?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          formatted_address?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          place_id?: string | null
          rating?: number | null
          regift_compatible?: boolean | null
          status?: string | null
          updated_at?: string | null
          url?: string | null
          user_ratings_total?: number | null
          website?: string | null
        }
        Relationships: []
      }
      pref_items: {
        Row: {
          created_at: string | null
          id: string
          label: string
          synonyms: string[] | null
          tags: string[] | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          synonyms?: string[] | null
          tags?: string[] | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          synonyms?: string[] | null
          tags?: string[] | null
          usage_count?: number | null
        }
        Relationships: []
      }
      preferences: {
        Row: {
          allergies: string[] | null
          created_at: string | null
          current_wants: string[] | null
          dislikes: string[] | null
          gift_ideas: string[] | null
          id: string
          likes: string[] | null
          sizes: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          created_at?: string | null
          current_wants?: string[] | null
          dislikes?: string[] | null
          gift_ideas?: string[] | null
          id?: string
          likes?: string[] | null
          sizes?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          created_at?: string | null
          current_wants?: string[] | null
          dislikes?: string[] | null
          gift_ideas?: string[] | null
          id?: string
          likes?: string[] | null
          sizes?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_blurhash: string | null
          avatar_dominant: string | null
          avatar_hash: string | null
          avatar_last_regen: string | null
          avatar_path: string | null
          avatar_regen_reason: string | null
          avatar_regen_requested_at: string | null
          avatar_status: string | null
          avatar_url: string | null
          avatar_version: number | null
          birthday: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string | null
          email_verified: boolean | null
          first_name: string | null
          global_preferences: Json | null
          id: string
          language: string | null
          last_name: string | null
          occasion_prefs: Json | null
          regift_enabled: boolean | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_blurhash?: string | null
          avatar_dominant?: string | null
          avatar_hash?: string | null
          avatar_last_regen?: string | null
          avatar_path?: string | null
          avatar_regen_reason?: string | null
          avatar_regen_requested_at?: string | null
          avatar_status?: string | null
          avatar_url?: string | null
          avatar_version?: number | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          global_preferences?: Json | null
          id?: string
          language?: string | null
          last_name?: string | null
          occasion_prefs?: Json | null
          regift_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_blurhash?: string | null
          avatar_dominant?: string | null
          avatar_hash?: string | null
          avatar_last_regen?: string | null
          avatar_path?: string | null
          avatar_regen_reason?: string | null
          avatar_regen_requested_at?: string | null
          avatar_status?: string | null
          avatar_url?: string | null
          avatar_version?: number | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          global_preferences?: Json | null
          id?: string
          language?: string | null
          last_name?: string | null
          occasion_prefs?: Json | null
          regift_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_profile_versions: {
        Row: {
          checksum: string
          last_synced_at: string
          source_updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          checksum: string
          last_synced_at?: string
          source_updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          checksum?: string
          last_synced_at?: string
          source_updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      regift_listings: {
        Row: {
          available: boolean | null
          category: string | null
          condition: string | null
          created_at: string
          description: string | null
          estimated_value: number | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available?: boolean | null
          category?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available?: boolean | null
          category?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          estimated_value?: number | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regifts: {
        Row: {
          created_at: string | null
          from_user_id: string
          gift_id: string
          id: string
          reason: string | null
          status: string
          to_contact_id: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          created_at?: string | null
          from_user_id: string
          gift_id: string
          id?: string
          reason?: string | null
          status?: string
          to_contact_id: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          created_at?: string | null
          from_user_id?: string
          gift_id?: string
          id?: string
          reason?: string | null
          status?: string
          to_contact_id?: string
          updated_at?: string | null
          visibility?: string
        }
        Relationships: []
      }
      replication_metrics: {
        Row: {
          id: number
          metric_name: string
          metric_value: number
          updated_at: string
        }
        Insert: {
          id?: number
          metric_name: string
          metric_value?: number
          updated_at?: string
        }
        Update: {
          id?: number
          metric_name?: string
          metric_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      replication_outbox: {
        Row: {
          created_at: string
          event_type: string
          id: number
          idempotency_key: string
          last_error: string | null
          payload: Json | null
          processed_at: string | null
          retry_count: number
          source_version: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: number
          idempotency_key: string
          last_error?: string | null
          payload?: Json | null
          processed_at?: string | null
          retry_count?: number
          source_version?: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: number
          idempotency_key?: string
          last_error?: string | null
          payload?: Json | null
          processed_at?: string | null
          retry_count?: number
          source_version?: number
          user_id?: string
        }
        Relationships: []
      }
      request_log: {
        Row: {
          created_at: string
          id: number
          idempotency_key: string
          response: Json
        }
        Insert: {
          created_at?: string
          id?: number
          idempotency_key: string
          response: Json
        }
        Update: {
          created_at?: string
          id?: number
          idempotency_key?: string
          response?: Json
        }
        Relationships: []
      }
      requests: {
        Row: {
          created_at: string
          event_id: string | null
          from_user_id: string
          id: string
          message: string | null
          pair_key: string | null
          status: string
          to_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          from_user_id: string
          id?: string
          message?: string | null
          pair_key?: string | null
          status?: string
          to_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          from_user_id?: string
          id?: string
          message?: string | null
          pair_key?: string | null
          status?: string
          to_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          slug: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          slug: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          slug?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          banned_tags: string[] | null
          country: string | null
          created_at: string | null
          embedding: string | null
          id: string
          name: string
          popularity: number | null
          price_max: number | null
          price_min: number | null
          tags: string[] | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          banned_tags?: string[] | null
          country?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          name: string
          popularity?: number | null
          price_max?: number | null
          price_min?: number | null
          tags?: string[] | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          banned_tags?: string[] | null
          country?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          name?: string
          popularity?: number | null
          price_max?: number | null
          price_min?: number | null
          tags?: string[] | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      synonyms: {
        Row: {
          created_at: string | null
          term: string
          variants: string[]
        }
        Insert: {
          created_at?: string | null
          term: string
          variants: string[]
        }
        Update: {
          created_at?: string | null
          term?: string
          variants?: string[]
        }
        Relationships: []
      }
      unsplash_rebuild_metrics: {
        Row: {
          created_at: string
          details: Json | null
          id: number
          metric_name: string
          metric_value: number
          rebuild_session_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: number
          metric_name: string
          metric_value?: number
          rebuild_session_id?: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: number
          metric_name?: string
          metric_value?: number
          rebuild_session_id?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_uploads: {
        Row: {
          created_at: string
          height: number | null
          id: string
          is_public: boolean
          kind: string | null
          path: string | null
          url: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          is_public?: boolean
          kind?: string | null
          path?: string | null
          url: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          is_public?: boolean
          kind?: string | null
          path?: string | null
          url?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      my_contacts: {
        Row: {
          alias: string | null
          avatar_url: string | null
          birthday: string | null
          city: string | null
          created_at: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          other_user_id: string | null
          owner_id: string | null
          pair_key: string | null
        }
        Relationships: []
      }
      my_contacts_view: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          display_name: string | null
          owner_id: string | null
          regift_enabled: boolean | null
          user_id: string | null
          wishlist: string[] | null
          wishlist_top3: string[] | null
        }
        Relationships: []
      }
      v_contacts_next_birthday: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          contact_id: string | null
          contact_user_id: string | null
          first_name: string | null
          last_name: string | null
          next_birthday: string | null
          timezone: string | null
          upcoming_age: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_public_profile_source: {
        Row: {
          occasions: Json | null
          preferences: Json | null
          profile: Json | null
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          occasions?: never
          preferences?: never
          profile?: never
          updated_at?: never
          user_id?: string | null
          version?: never
        }
        Update: {
          occasions?: never
          preferences?: never
          profile?: never
          updated_at?: never
          user_id?: string | null
          version?: never
        }
        Relationships: []
      }
      v_unsplash_rebuild_stats: {
        Row: {
          avg_v2_score: number | null
          unique_ideas: number | null
          v1_count: number | null
          v2_count: number | null
          v2_fallback: number | null
          v2_success: number | null
        }
        Relationships: []
      }
      vw_accepted_contact_gaps: {
        Row: {
          created_at: string | null
          from_name: string | null
          from_user_id: string | null
          missing_a_to_b: boolean | null
          missing_b_to_a: boolean | null
          request_id: string | null
          to_name: string | null
          to_user_id: string | null
        }
        Relationships: []
      }
      vw_accepted_without_contact: {
        Row: {
          a: string | null
          b: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      vw_contacts_full: {
        Row: {
          contact_id: string | null
          contact_name: string | null
          created_at: string | null
          owner_id: string | null
          owner_name: string | null
        }
        Relationships: []
      }
      vw_gift_query_details: {
        Row: {
          created_at: string | null
          id: string | null
          matched_gift_id: string | null
          merchant_id: string | null
          query_text: string | null
          term: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_query_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gift_query_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_public_profile_source"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vw_gift_query_terms: {
        Row: {
          first_seen: string | null
          hits: number | null
          last_seen: string | null
          term: string | null
          users: number | null
        }
        Relationships: []
      }
      vw_gift_with_media: {
        Row: {
          accuracy_score: number | null
          alt: string | null
          category_label: string | null
          category_slug: string | null
          description: string | null
          expected_tags: string[] | null
          gift_id: string | null
          height: number | null
          media_id: string | null
          media_tags: string[] | null
          source_ref: string | null
          title: string | null
          width: number | null
        }
        Relationships: []
      }
      vw_missing_contacts: {
        Row: {
          from_user_id: string | null
          has_contact: boolean | null
          request_created_at: string | null
          request_id: string | null
          to_user_id: string | null
        }
        Relationships: []
      }
      vw_requests_full: {
        Row: {
          created_at: string | null
          from_name: string | null
          from_user_id: string | null
          id: string | null
          status: string | null
          to_name: string | null
          to_user_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _contact_pair_key: {
        Args: { a: string; b: string }
        Returns: string
      }
      _contacts_pairkey_is_generated: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      _norm_status: {
        Args: { p: unknown }
        Returns: string
      }
      accept_and_sync_v2: {
        Args: { p_from_user_id: string }
        Returns: Json
      }
      accept_request: {
        Args: { p_request_id: string }
        Returns: Json
      }
      accept_request_by_user: {
        Args: { p_from_user_id: string }
        Returns: Json
      }
      backfill_preferences_to_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          migrated_count: number
          updated_count: number
        }[]
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      build_public_payload_v2: {
        Args: { source_row: unknown }
        Returns: Json
      }
      calculate_profile_checksum: {
        Args: { profile_data: Json }
        Returns: string
      }
      check_contact_relationship: {
        Args: { contact_user_id: string }
        Returns: boolean
      }
      cleanup_gift_idea_unsplash_test_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_request_logs: {
        Args: { older_than_days?: number }
        Returns: number
      }
      cleanup_processed_outbox: {
        Args: { older_than_hours?: number }
        Returns: number
      }
      create_bidirectional_contact: {
        Args: { contact_email: string; relation_type?: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          actor_id?: string
          notification_message: string
          notification_payload?: Json
          notification_type: string
          target_user_id: string
        }
        Returns: string
      }
      create_notification_with_actor: {
        Args: {
          actor_id?: string
          notification_message: string
          notification_payload?: Json
          notification_type: string
          target_user_id: string
        }
        Returns: string
      }
      create_or_get_contact: {
        Args: { contact_alias?: string; target_user_id: string }
        Returns: {
          alias: string | null
          contact_user_id: string
          created_at: string
          id: string
          owner_id: string
          pair_key: string | null
          updated_at: string
        }
      }
      find_inconsistent_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          needs_update: boolean
          public_checksum: string
          public_version: number
          source_checksum: string
          source_version: number
          user_id: string
        }[]
      }
      find_inconsistent_profiles_v2: {
        Args: Record<PropertyKey, never>
        Returns: {
          diff_payload: boolean
          miss_age: boolean
          miss_allergies_anniversaire: boolean
          miss_allergies_brunch: boolean
          miss_allergies_cremaillere: boolean
          miss_allergies_diner_amis: boolean
          miss_avoid: boolean
          miss_city: boolean
          miss_gift_ideas: boolean
          miss_likes: boolean
          miss_name: boolean
          miss_occ_anniversaire: boolean
          miss_occ_brunch: boolean
          miss_occ_cremaillere: boolean
          miss_occ_diner_amis: boolean
          miss_regift: boolean
          miss_sizes: boolean
          missing_fields: string[]
          public_checksum: string
          source_checksum: string
          user_id: string
        }[]
      }
      fn_array_overlap_count: {
        Args: { a: string[]; b: string[] }
        Returns: number
      }
      fn_diag_counters: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fn_pick_canonical_media: {
        Args: { p_gift_id: string }
        Returns: undefined
      }
      fn_rescore_all_gifts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fn_score_media_for_gift: {
        Args: { p_gift_id: string }
        Returns: {
          matched_tags: string[]
          media_id: string
          score: number
        }[]
      }
      generate_profile_idempotency_key: {
        Args: { p_user_id: string; p_version: number }
        Returns: string
      }
      generate_unique_slug: {
        Args: { p_first_name: string; p_last_name?: string; p_user_id?: string }
        Returns: string
      }
      get_active_slug: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_contacts_with_global_preferences: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          birthday: string
          city: string
          contact_id: string
          display_name: string
          global_preferences: Json
          occasion_prefs: Json
          regift_enabled: boolean
          user_id: string
        }[]
      }
      get_contacts_with_previews: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          birthday: string
          city: string
          contact_id: string
          display_name: string
          preview_urls: string[]
          regift_enabled: boolean
          user_id: string
        }[]
      }
      get_directory_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          first_name: string
          last_name: string
          regift: boolean
          updated_at: string
          user_id: string
        }[]
      }
      get_gift_idea_image_v2: {
        Args: { p_category?: string; p_idea_text: string; p_occasion?: string }
        Returns: {
          image_url: string
          is_fallback: boolean
          photographer_name: string
          photographer_url: string
          relevance_score: number
          unsplash_id: string
          unsplash_url: string
        }[]
      }
      get_my_contacts_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          birthday: string
          display_name: string
          owner_id: string
          regift_enabled: boolean
          user_id: string
          wishlist: string[]
          wishlist_top3: string[]
        }[]
      }
      get_my_contacts_unified: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          birthday: string
          city: string
          contact_id: string
          display_name: string
          global_preferences: Json
          occasion_prefs: Json
          regift_enabled: boolean
          user_id: string
        }[]
      }
      get_my_requests_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          event_id: string
          from_user_id: string
          id: string
          message: string
          other_avatar_url: string
          other_birthday: string
          other_city: string
          other_first_name: string
          other_last_name: string
          other_user_id: string
          status: string
          to_user_id: string
        }[]
      }
      get_public_profile_data: {
        Args: { profile_user_id: string }
        Returns: {
          created_at: string
          first_name: string
          id: string
          language: string
          last_name: string
          updated_at: string
          user_id: string
        }[]
      }
      get_public_profile_secure: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          birthday: string
          city: string
          country: string
          display_name: string
          global_preferences: Json
          occasion_prefs: Json
          regift_enabled: boolean
          updated_at: string
          user_id: string
        }[]
      }
      get_public_profile_with_regift: {
        Args: { profile_user_id: string }
        Returns: {
          bio: string
          created_at: string
          first_name: string
          id: string
          language: string
          last_name: string
          regift_enabled: boolean
          regift_note: string
          updated_at: string
          user_id: string
        }[]
      }
      get_public_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          bio: string
          dislikes: string[]
          display_name: string
          food_prefs: string[]
          regift_enabled: boolean
          regift_note: string
          style_prefs: string[]
          updated_at: string
          user_id: string
          wishlist: string[]
        }[]
      }
      get_replication_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          metric_value: number
          updated_at: string
        }[]
      }
      get_system_health_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_unread_notifications_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_contacts: {
        Args: { user_uuid: string }
        Returns: {
          alias: string
          avatar_url: string
          created_at: string
          display_name: string
          owner_id: string
          user_id: string
        }[]
      }
      get_user_id_by_slug: {
        Args: { p_slug: string }
        Returns: string
      }
      get_user_received_requests: {
        Args: { user_uuid: string }
        Returns: {
          created_at: string
          event_id: string
          from_user_avatar: string
          from_user_id: string
          from_user_name: string
          id: string
          message: string
          status: string
          to_user_id: string
        }[]
      }
      get_user_sent_requests: {
        Args: { user_uuid: string }
        Returns: {
          created_at: string
          event_id: string
          from_user_id: string
          id: string
          message: string
          status: string
          to_user_avatar: string
          to_user_id: string
          to_user_name: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      migrate_missing_slugs: {
        Args: Record<PropertyKey, never>
        Returns: {
          error_count: number
          migrated_count: number
        }[]
      }
      normalize_signup_data: {
        Args: {
          p_city?: string
          p_country?: string
          p_email: string
          p_first_name: string
          p_last_name?: string
        }
        Returns: Json
      }
      patch_preferences_deep_v1: {
        Args: { p_patch: Json; p_user_id: string }
        Returns: undefined
      }
      reject_connection: {
        Args: { p_request_id: string }
        Returns: Json
      }
      reject_connection_request: {
        Args: { p_request_id: string }
        Returns: Json
      }
      request_avatar_regen: {
        Args: { reason?: string; target_user: string }
        Returns: Json
      }
      request_gift_image_regen: {
        Args: { gift_idea_id: number; reason?: string }
        Returns: Json
      }
      request_gift_image_regen_resolve_dbg: {
        Args: {
          p_category?: string
          p_gift_id?: string
          p_occasion?: string
          p_owner_id?: string
          p_reason?: string
          p_suggestion_id?: string
          p_title?: string
        }
        Returns: Json
      }
      request_gift_image_regen_resolve_dbg2: {
        Args: {
          p_category?: string
          p_gift_id?: string
          p_occasion?: string
          p_owner_id?: string
          p_reason?: string
          p_suggestion_id?: string
          p_title?: string
        }
        Returns: Json
      }
      request_gift_image_regen_resolve_many: {
        Args: { payload: Json }
        Returns: {
          result_id: number
          result_status: string
        }[]
      }
      resolve_slug_to_user_id: {
        Args: { p_slug: string }
        Returns: string
      }
      resync_all_contacts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      resync_contact_pair: {
        Args: {
          create_a_to_b?: boolean
          create_b_to_a?: boolean
          from_id: string
          to_id: string
        }
        Returns: undefined
      }
      safe_upsert_preferences: {
        Args: { p_updates: Json; p_user_id: string }
        Returns: {
          allergies: string[] | null
          created_at: string | null
          current_wants: string[] | null
          dislikes: string[] | null
          gift_ideas: string[] | null
          id: string
          likes: string[] | null
          sizes: Json | null
          updated_at: string | null
          user_id: string
        }[]
      }
      safe_upsert_profile: {
        Args: { p_updates: Json; p_user_id: string }
        Returns: {
          avatar_blurhash: string | null
          avatar_dominant: string | null
          avatar_hash: string | null
          avatar_last_regen: string | null
          avatar_path: string | null
          avatar_regen_reason: string | null
          avatar_regen_requested_at: string | null
          avatar_status: string | null
          avatar_url: string | null
          avatar_version: number | null
          birthday: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string | null
          email_verified: boolean | null
          first_name: string | null
          global_preferences: Json | null
          id: string
          language: string | null
          last_name: string | null
          occasion_prefs: Json | null
          regift_enabled: boolean | null
          timezone: string | null
          updated_at: string
          user_id: string
        }[]
      }
      search_pref_items: {
        Args: { lim?: number; q: string }
        Returns: {
          id: string
          label: string
          score: number
        }[]
      }
      search_stores: {
        Args: {
          budget_max?: number
          budget_min?: number
          country_pref?: string
          gift_tags?: string[]
          q?: string
        }
        Returns: {
          id: string
          name: string
          score: number
          url: string
          why: Json
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      stable_gift_idea_hash: {
        Args: { category?: string; idea_text: string; occasion?: string }
        Returns: string
      }
      sync_my_contacts_from_requests: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
      upsert_public_profile_version: {
        Args: {
          p_checksum: string
          p_public_payload: Json
          p_user_id: string
          p_version: number
        }
        Returns: undefined
      }
      util_slugify: {
        Args: { txt: string }
        Returns: string
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
