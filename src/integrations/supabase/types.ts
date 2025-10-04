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
      contacts: {
        Row: {
          alias: string | null
          contact_user_id: string
          created_at: string
          id: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          alias?: string | null
          contact_user_id: string
          created_at?: string
          id?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          alias?: string | null
          contact_user_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          updated_at?: string
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
      gift_idea_unsplash: {
        Row: {
          category: string | null
          created_at: string
          generator_version: string
          gift_idea_hash: string
          gift_idea_text: string
          id: number
          image_url: string | null
          is_user_uploaded: boolean | null
          last_generated_at: string | null
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
          generator_version?: string
          gift_idea_hash: string
          gift_idea_text: string
          id?: number
          image_url?: string | null
          is_user_uploaded?: boolean | null
          last_generated_at?: string | null
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
          generator_version?: string
          gift_idea_hash?: string
          gift_idea_text?: string
          id?: number
          image_url?: string | null
          is_user_uploaded?: boolean | null
          last_generated_at?: string | null
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
      notifications: {
        Row: {
          actor_avatar_url: string | null
          actor_name: string | null
          actor_user_id: string | null
          created_at: string
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
          created_at?: string
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
          created_at?: string
          id?: string
          message?: string
          payload?: Json | null
          read?: boolean | null
          read_at?: string | null
          ref_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
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
          avatar_url: string | null
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
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
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
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
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
          status: string
          to_user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          from_user_id: string
          id?: string
          message?: string | null
          status?: string
          to_user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          from_user_id?: string
          id?: string
          message?: string | null
          status?: string
          to_user_id?: string
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
    }
    Functions: {
      backfill_preferences_to_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          migrated_count: number
          updated_count: number
        }[]
      }
      build_public_payload_v2: {
        Args: { source_row: unknown }
        Returns: Json
      }
      calculate_profile_checksum: {
        Args: { profile_data: Json }
        Returns: string
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
          allergies: Json
          avatar_url: string
          birthday: string
          city: string
          country: string
          dislikes: Json
          display_name: string
          food_prefs: Json
          global_preferences: Json
          occasion_prefs: Json
          regift_enabled: boolean
          style_prefs: Json
          updated_at: string
          user_id: string
          wishlist: Json
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
      resolve_slug_to_user_id: {
        Args: { p_slug: string }
        Returns: string
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
          avatar_url: string | null
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
          updated_at: string
          user_id: string
        }[]
      }
      stable_gift_idea_hash: {
        Args: { category?: string; idea_text: string; occasion?: string }
        Returns: string
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
