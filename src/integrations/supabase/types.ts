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
      orders: {
        Row: {
          created_at: string
          id: string
          status: string | null
          total: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string | null
          total?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string | null
          total?: number | null
          user_id?: string
        }
        Relationships: []
      }
      outfit_history: {
        Row: {
          context: Json
          created_at: string
          id: string
          items: string[]
          notes: string | null
          rating: number | null
          updated_at: string
          user_id: string
          worn_date: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          items?: string[]
          notes?: string | null
          rating?: number | null
          updated_at?: string
          user_id: string
          worn_date?: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          items?: string[]
          notes?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string
          worn_date?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          images: Json | null
          name: string
          price: number | null
          slug: string | null
          stock: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          name: string
          price?: number | null
          slug?: string | null
          stock?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          name?: string
          price?: number | null
          slug?: string | null
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          cold_threshold: number | null
          created_at: string
          custom_events: string[] | null
          custom_moods: string[] | null
          first_name: string | null
          id: string
          last_name: string | null
          preferred_color: string | null
          preferred_formality: string | null
          updated_at: string
          user_id: string
          warm_threshold: number | null
        }
        Insert: {
          cold_threshold?: number | null
          created_at?: string
          custom_events?: string[] | null
          custom_moods?: string[] | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          preferred_color?: string | null
          preferred_formality?: string | null
          updated_at?: string
          user_id: string
          warm_threshold?: number | null
        }
        Update: {
          cold_threshold?: number | null
          created_at?: string
          custom_events?: string[] | null
          custom_moods?: string[] | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          preferred_color?: string | null
          preferred_formality?: string | null
          updated_at?: string
          user_id?: string
          warm_threshold?: number | null
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          created_at: string | null
          id: string
          role_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          role_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          role_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          role_name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          brand: string | null
          color: string
          condition: string
          created_at: string
          fit: string
          formality: string | null
          id: string
          image_path: string
          image_url: string | null
          last_worn: string | null
          material: string
          pattern: string
          purchase_date: string | null
          season: string
          size: string | null
          tags: string[]
          type: string
          updated_at: string
          user_id: string
          versatility_score: number | null
          weight: string | null
        }
        Insert: {
          brand?: string | null
          color: string
          condition?: string
          created_at?: string
          fit?: string
          formality?: string | null
          id?: string
          image_path: string
          image_url?: string | null
          last_worn?: string | null
          material?: string
          pattern?: string
          purchase_date?: string | null
          season: string
          size?: string | null
          tags?: string[]
          type: string
          updated_at?: string
          user_id: string
          versatility_score?: number | null
          weight?: string | null
        }
        Update: {
          brand?: string | null
          color?: string
          condition?: string
          created_at?: string
          fit?: string
          formality?: string | null
          id?: string
          image_path?: string
          image_url?: string | null
          last_worn?: string | null
          material?: string
          pattern?: string
          purchase_date?: string | null
          season?: string
          size?: string | null
          tags?: string[]
          type?: string
          updated_at?: string
          user_id?: string
          versatility_score?: number | null
          weight?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      outfit_stats: {
        Row: {
          avg_rating: number | null
          days_with_outfits: number | null
          evening_outfits: number | null
          high_rated_count: number | null
          last_outfit_date: string | null
          sport_outfits: number | null
          total_outfits: number | null
          user_id: string | null
          work_outfits: number | null
        }
        Relationships: []
      }
      wardrobe_stats: {
        Row: {
          all_season_count: number | null
          bottoms_count: number | null
          business_count: number | null
          casual_count: number | null
          colors_used: string[] | null
          last_added: string | null
          mid_season_count: number | null
          shoes_count: number | null
          sport_count: number | null
          summer_count: number | null
          tops_count: number | null
          total_items: number | null
          user_id: string | null
          winter_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args:
          | { _role: Database["public"]["Enums"]["app_role"]; _user_id: string }
          | { role_name_param: string; user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
