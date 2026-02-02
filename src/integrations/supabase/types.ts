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
      conversations: {
        Row: {
          admin_unread_count: number
          created_at: string
          id: string
          last_message_at: string
          student_id: string
          student_unread_count: number
        }
        Insert: {
          admin_unread_count?: number
          created_at?: string
          id?: string
          last_message_at?: string
          student_id: string
          student_unread_count?: number
        }
        Update: {
          admin_unread_count?: number
          created_at?: string
          id?: string
          last_message_at?: string
          student_id?: string
          student_unread_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          category: Database["public"]["Enums"]["meal_category"]
          id: string
          meal_id: string
          qr_validation_timestamp: string
          served_at: string
          student_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["meal_category"]
          id?: string
          meal_id: string
          qr_validation_timestamp?: string
          served_at?: string
          student_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["meal_category"]
          id?: string
          meal_id?: string
          qr_validation_timestamp?: string
          served_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_reactions: {
        Row: {
          created_at: string
          id: string
          meal_id: string
          reaction_type: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id: string
          reaction_type: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string
          reaction_type?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_reactions_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_reactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          category: Database["public"]["Enums"]["meal_category"]
          created_at: string
          date: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          dislikes_count: number
          food_description: string | null
          food_image: string | null
          food_name: string
          id: string
          likes_count: number
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["meal_category"]
          created_at?: string
          date: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          dislikes_count?: number
          food_description?: string | null
          food_image?: string | null
          food_name: string
          id?: string
          likes_count?: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["meal_category"]
          created_at?: string
          date?: string
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          dislikes_count?: number
          food_description?: string | null
          food_image?: string | null
          food_name?: string
          id?: string
          likes_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message_text: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["message_sender_role"]
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_text: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["message_sender_role"]
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_text?: string
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["message_sender_role"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          blocked_at: string | null
          blocked_reason: string | null
          created_at: string
          daily_cheating_count: number | null
          department: string
          first_name: string
          id: string
          last_cheating_date: string | null
          last_name: string
          photo_url: string | null
          semester: number
          semester_expiry_date: string
          status: Database["public"]["Enums"]["student_status"]
          student_id: string
          updated_at: string
          user_id: string | null
          year: number
        }
        Insert: {
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string
          daily_cheating_count?: number | null
          department: string
          first_name: string
          id?: string
          last_cheating_date?: string | null
          last_name: string
          photo_url?: string | null
          semester: number
          semester_expiry_date: string
          status?: Database["public"]["Enums"]["student_status"]
          student_id: string
          updated_at?: string
          user_id?: string | null
          year: number
        }
        Update: {
          blocked_at?: string | null
          blocked_reason?: string | null
          created_at?: string
          daily_cheating_count?: number | null
          department?: string
          first_name?: string
          id?: string
          last_cheating_date?: string | null
          last_name?: string
          photo_url?: string | null
          semester?: number
          semester_expiry_date?: string
          status?: Database["public"]["Enums"]["student_status"]
          student_id?: string
          updated_at?: string
          user_id?: string | null
          year?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_logs: {
        Row: {
          cheating_count: number | null
          created_at: string
          id: string
          meal_category: Database["public"]["Enums"]["meal_category"]
          meal_id: string | null
          result_reason: string
          student_id: string | null
          student_id_text: string
          student_name: string
          ticker_id: string
          verification_date: string
          verification_method: string
          verification_result: boolean
          verification_time: string
        }
        Insert: {
          cheating_count?: number | null
          created_at?: string
          id?: string
          meal_category: Database["public"]["Enums"]["meal_category"]
          meal_id?: string | null
          result_reason: string
          student_id?: string | null
          student_id_text: string
          student_name: string
          ticker_id: string
          verification_date?: string
          verification_method: string
          verification_result: boolean
          verification_time?: string
        }
        Update: {
          cheating_count?: number | null
          created_at?: string
          id?: string
          meal_category?: Database["public"]["Enums"]["meal_category"]
          meal_id?: string | null
          result_reason?: string
          student_id?: string | null
          student_id_text?: string
          student_name?: string
          ticker_id?: string
          verification_date?: string
          verification_method?: string
          verification_result?: boolean
          verification_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_logs_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_duplicate_meal: {
        Args: {
          _date: string
          _meal_category: Database["public"]["Enums"]["meal_category"]
          _student_id: string
        }
        Returns: boolean
      }
      get_daily_cheating_count: {
        Args: { _date: string; _student_id: string }
        Returns: number
      }
      get_or_create_conversation: {
        Args: { _student_id: string }
        Returns: string
      }
      get_student_id_from_user: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_student_owner: { Args: { _student_id: string }; Returns: boolean }
      is_ticker: { Args: never; Returns: boolean }
      mark_messages_read: {
        Args: {
          _conversation_id: string
          _reader_role: Database["public"]["Enums"]["message_sender_role"]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "student" | "ticker"
      day_of_week:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      meal_category: "breakfast" | "lunch" | "dinner"
      message_sender_role: "student" | "admin"
      student_status: "active" | "expired" | "blocked"
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
      app_role: ["admin", "student", "ticker"],
      day_of_week: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      meal_category: ["breakfast", "lunch", "dinner"],
      message_sender_role: ["student", "admin"],
      student_status: ["active", "expired", "blocked"],
    },
  },
} as const
