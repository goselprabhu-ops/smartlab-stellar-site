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
      ai_generated_material: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["remediation_kind"]
          model: string | null
          payload: Json
          prompt_hash: string | null
          session_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["remediation_kind"]
          model?: string | null
          payload?: Json
          prompt_hash?: string | null
          session_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["remediation_kind"]
          model?: string | null
          payload?: Json
          prompt_hash?: string | null
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_material_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          created_at: string
          id: string
          model: string | null
          payload: Json
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model?: string | null
          payload?: Json
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: string | null
          payload?: Json
          student_id?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          created_at: string
          id: string
          order_index: number
          published: boolean
          slug: string
          subject_id: string
          summary_md: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          published?: boolean
          slug: string
          subject_id: string
          summary_md?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          published?: boolean
          slug?: string
          subject_id?: string
          summary_md?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          model: string | null
          parts: Json
          role: string
          student_id: string
          thread_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          model?: string | null
          parts?: Json
          role: string
          student_id: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          model?: string | null
          parts?: Json
          role?: string
          student_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          student_id: string
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          student_id: string
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          student_id?: string
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string
          id: string
          label: string
          order_index: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          order_index?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          order_index?: number
        }
        Relationships: []
      }
      concept_mastery: {
        Row: {
          confidence: number
          decay_at: string | null
          id: string
          last_practiced_at: string | null
          mastery: number
          micro_concept_id: string
          streak: number
          student_id: string
          updated_at: string
        }
        Insert: {
          confidence?: number
          decay_at?: string | null
          id?: string
          last_practiced_at?: string | null
          mastery?: number
          micro_concept_id: string
          streak?: number
          student_id: string
          updated_at?: string
        }
        Update: {
          confidence?: number
          decay_at?: string | null
          id?: string
          last_practiced_at?: string | null
          mastery?: number
          micro_concept_id?: string
          streak?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concept_mastery_micro_concept_id_fkey"
            columns: ["micro_concept_id"]
            isOneToOne: false
            referencedRelation: "micro_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_relations: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          relation: Database["public"]["Enums"]["relation_kind"]
          source_id: string
          target_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          relation: Database["public"]["Enums"]["relation_kind"]
          source_id: string
          target_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          relation?: Database["public"]["Enums"]["relation_kind"]
          source_id?: string
          target_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "concept_relations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "micro_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concept_relations_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "micro_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          created_at: string
          id: string
          order_index: number
          paragraph_id: string
          summary_md: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          paragraph_id: string
          summary_md?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          paragraph_id?: string
          summary_md?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concepts_paragraph_id_fkey"
            columns: ["paragraph_id"]
            isOneToOne: false
            referencedRelation: "paragraphs"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          grade: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          grade: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          grade?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      content_resources: {
        Row: {
          chapter_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          kind: Database["public"]["Enums"]["resource_kind"]
          lesson_id: string | null
          micro_concept_id: string | null
          order_index: number
          paragraph_id: string | null
          published: boolean
          size_bytes: number | null
          tags: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          kind: Database["public"]["Enums"]["resource_kind"]
          lesson_id?: string | null
          micro_concept_id?: string | null
          order_index?: number
          paragraph_id?: string | null
          published?: boolean
          size_bytes?: number | null
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["resource_kind"]
          lesson_id?: string | null
          micro_concept_id?: string | null
          order_index?: number
          paragraph_id?: string | null
          published?: boolean
          size_bytes?: number | null
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_resources_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_resources_micro_concept_id_fkey"
            columns: ["micro_concept_id"]
            isOneToOne: false
            referencedRelation: "micro_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_resources_paragraph_id_fkey"
            columns: ["paragraph_id"]
            isOneToOne: false
            referencedRelation: "paragraphs"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          grade: string | null
          id: string
          published: boolean
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          grade?: string | null
          id?: string
          published?: boolean
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          grade?: string | null
          id?: string
          published?: boolean
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_attempts: {
        Row: {
          created_at: string
          id: string
          per_question: Json
          quiz_id: string | null
          score: number
          session_id: string
          student_id: string
          total: number
        }
        Insert: {
          created_at?: string
          id?: string
          per_question?: Json
          quiz_id?: string | null
          score?: number
          session_id: string
          student_id: string
          total?: number
        }
        Update: {
          created_at?: string
          id?: string
          per_question?: Json
          quiz_id?: string | null
          score?: number
          session_id?: string
          student_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_event_at: string
          mastery: number
          micro_concept_id: string
          state: Database["public"]["Enums"]["learning_state"]
          student_id: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_event_at?: string
          mastery?: number
          micro_concept_id: string
          state?: Database["public"]["Enums"]["learning_state"]
          student_id: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_event_at?: string
          mastery?: number
          micro_concept_id?: string
          state?: Database["public"]["Enums"]["learning_state"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_micro_concept_id_fkey"
            columns: ["micro_concept_id"]
            isOneToOne: false
            referencedRelation: "micro_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_md: string | null
          course_id: string
          created_at: string
          id: string
          micro_concept_id: string | null
          order_index: number
          tags: string[]
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content_md?: string | null
          course_id: string
          created_at?: string
          id?: string
          micro_concept_id?: string | null
          order_index?: number
          tags?: string[]
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content_md?: string | null
          course_id?: string
          created_at?: string
          id?: string
          micro_concept_id?: string | null
          order_index?: number
          tags?: string[]
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_micro_concept_id_fkey"
            columns: ["micro_concept_id"]
            isOneToOne: false
            referencedRelation: "micro_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_concepts: {
        Row: {
          bloom_level: Database["public"]["Enums"]["bloom_level"] | null
          concept_id: string
          content_md: string | null
          created_at: string
          difficulty: number
          estimated_minutes: number
          id: string
          learning_objective: string | null
          order_index: number
          prerequisite_ids: string[]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          bloom_level?: Database["public"]["Enums"]["bloom_level"] | null
          concept_id: string
          content_md?: string | null
          created_at?: string
          difficulty?: number
          estimated_minutes?: number
          id?: string
          learning_objective?: string | null
          order_index?: number
          prerequisite_ids?: string[]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          bloom_level?: Database["public"]["Enums"]["bloom_level"] | null
          concept_id?: string
          content_md?: string | null
          created_at?: string
          difficulty?: number
          estimated_minutes?: number
          id?: string
          learning_objective?: string | null
          order_index?: number
          prerequisite_ids?: string[]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "micro_concepts_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      paragraphs: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          order_index: number
          summary_md: string | null
          title: string
          updated_at: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          order_index?: number
          summary_md?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          order_index?: number
          summary_md?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paragraphs_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_student_links: {
        Row: {
          created_at: string
          id: string
          parent_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string
          student_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          grade: string | null
          id: string
          school: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          grade?: string | null
          id?: string
          school?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          grade?: string | null
          id?: string
          school?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed_at: string | null
          id: string
          lesson_id: string
          mastery: number
          student_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          lesson_id: string
          mastery?: number
          student_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string
          mastery?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          id: string
          quiz_id: string
          score: number
          student_id: string
          submitted_at: string
          total: number
        }
        Insert: {
          answers?: Json
          id?: string
          quiz_id: string
          score?: number
          student_id: string
          submitted_at?: string
          total?: number
        }
        Update: {
          answers?: Json
          id?: string
          quiz_id?: string
          score?: number
          student_id?: string
          submitted_at?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct: Json
          created_at: string
          id: string
          micro_concept_id: string | null
          options: Json
          order_index: number
          points: number
          prompt: string
          quiz_id: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          correct?: Json
          created_at?: string
          id?: string
          micro_concept_id?: string | null
          options?: Json
          order_index?: number
          points?: number
          prompt: string
          quiz_id: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          correct?: Json
          created_at?: string
          id?: string
          micro_concept_id?: string | null
          options?: Json
          order_index?: number
          points?: number
          prompt?: string
          quiz_id?: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_micro_concept_id_fkey"
            columns: ["micro_concept_id"]
            isOneToOne: false
            referencedRelation: "micro_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          lesson_id: string | null
          time_limit_seconds: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          time_limit_seconds?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          time_limit_seconds?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      recollection_attempts: {
        Row: {
          ai_feedback: Json
          ai_score: number | null
          created_at: string
          id: string
          prompt: string
          session_id: string
          student_id: string
          student_response: string
        }
        Insert: {
          ai_feedback?: Json
          ai_score?: number | null
          created_at?: string
          id?: string
          prompt: string
          session_id: string
          student_id: string
          student_response: string
        }
        Update: {
          ai_feedback?: Json
          ai_score?: number | null
          created_at?: string
          id?: string
          prompt?: string
          session_id?: string
          student_id?: string
          student_response?: string
        }
        Relationships: [
          {
            foreignKeyName: "recollection_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
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
      weakness_profile: {
        Row: {
          confidence: number
          id: string
          micro_concept_id: string
          notes: string | null
          student_id: string
          updated_at: string
          weakness_tags: string[]
        }
        Insert: {
          confidence?: number
          id?: string
          micro_concept_id: string
          notes?: string | null
          student_id: string
          updated_at?: string
          weakness_tags?: string[]
        }
        Update: {
          confidence?: number
          id?: string
          micro_concept_id?: string
          notes?: string | null
          student_id?: string
          updated_at?: string
          weakness_tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "weakness_profile_micro_concept_id_fkey"
            columns: ["micro_concept_id"]
            isOneToOne: false
            referencedRelation: "micro_concepts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_linked_parent: {
        Args: { _parent: string; _student: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "parent" | "admin" | "teacher"
      bloom_level:
        | "remember"
        | "understand"
        | "apply"
        | "analyze"
        | "evaluate"
        | "create"
      learning_state:
        | "not_started"
        | "studying"
        | "recollecting"
        | "evaluating"
        | "weak"
        | "remediating"
        | "mastered"
      question_type: "mcq" | "multi" | "short"
      relation_kind:
        | "prerequisite"
        | "builds_on"
        | "related"
        | "contrasts_with"
        | "applies_to"
        | "generalizes"
        | "example_of"
      remediation_kind:
        | "reexplain"
        | "practice"
        | "solution_walkthrough"
        | "diagram_prompt"
        | "simplified_notes"
        | "summary"
        | "flashcards"
        | "mcq"
        | "revision_sheet"
        | "micro_test"
        | "visual_explanation"
      resource_kind: "video" | "pdf" | "note" | "link"
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
      app_role: ["student", "parent", "admin", "teacher"],
      bloom_level: [
        "remember",
        "understand",
        "apply",
        "analyze",
        "evaluate",
        "create",
      ],
      learning_state: [
        "not_started",
        "studying",
        "recollecting",
        "evaluating",
        "weak",
        "remediating",
        "mastered",
      ],
      question_type: ["mcq", "multi", "short"],
      relation_kind: [
        "prerequisite",
        "builds_on",
        "related",
        "contrasts_with",
        "applies_to",
        "generalizes",
        "example_of",
      ],
      remediation_kind: [
        "reexplain",
        "practice",
        "solution_walkthrough",
        "diagram_prompt",
        "simplified_notes",
        "summary",
        "flashcards",
        "mcq",
        "revision_sheet",
        "micro_test",
        "visual_explanation",
      ],
      resource_kind: ["video", "pdf", "note", "link"],
    },
  },
} as const
