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
      achievements: {
        Row: {
          active: boolean
          ai_generated: boolean
          category: string
          code: string
          created_at: string
          criteria: Json
          description: string
          icon: string
          id: string
          rarity: Database["public"]["Enums"]["achievement_rarity"]
          title: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          ai_generated?: boolean
          category?: string
          code: string
          created_at?: string
          criteria?: Json
          description: string
          icon?: string
          id?: string
          rarity?: Database["public"]["Enums"]["achievement_rarity"]
          title: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          ai_generated?: boolean
          category?: string
          code?: string
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          rarity?: Database["public"]["Enums"]["achievement_rarity"]
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      ai_cache: {
        Row: {
          created_at: string
          expires_at: string | null
          input_hash: string
          model: string | null
          module: string
          output: Json
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          input_hash: string
          model?: string | null
          module: string
          output: Json
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          input_hash?: string
          model?: string | null
          module?: string
          output?: Json
        }
        Relationships: []
      }
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
      ai_prompts: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          module: string
          template: string
          version: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          module: string
          template: string
          version: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          module?: string
          template?: string
          version?: string
        }
        Relationships: []
      }
      ai_quotas: {
        Row: {
          daily_limit: number
          module: string
          period_start: string
          updated_at: string
          used: number
          user_id: string
        }
        Insert: {
          daily_limit?: number
          module: string
          period_start?: string
          updated_at?: string
          used?: number
          user_id: string
        }
        Update: {
          daily_limit?: number
          module?: string
          period_start?: string
          updated_at?: string
          used?: number
          user_id?: string
        }
        Relationships: []
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
      ai_runs: {
        Row: {
          cost_cents: number | null
          created_at: string
          error: string | null
          id: string
          input_hash: string | null
          latency_ms: number | null
          model: string
          module: string
          prompt_version: string | null
          status: string
          tokens_in: number | null
          tokens_out: number | null
          user_id: string | null
        }
        Insert: {
          cost_cents?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_hash?: string | null
          latency_ms?: number | null
          model: string
          module: string
          prompt_version?: string | null
          status?: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Update: {
          cost_cents?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_hash?: string | null
          latency_ms?: number | null
          model?: string
          module?: string
          prompt_version?: string | null
          status?: string
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          attachments: Json
          content_md: string | null
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          score: number | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          attachments?: Json
          content_md?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          attachments?: Json
          content_md?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          attachments: Json
          batch_id: string
          created_at: string
          created_by: string
          description_md: string | null
          due_at: string | null
          id: string
          max_score: number
          school_id: string
          status: Database["public"]["Enums"]["assignment_status"]
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          batch_id: string
          created_at?: string
          created_by: string
          description_md?: string | null
          due_at?: string | null
          id?: string
          max_score?: number
          school_id: string
          status?: Database["public"]["Enums"]["assignment_status"]
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          batch_id?: string
          created_at?: string
          created_by?: string
          description_md?: string | null
          due_at?: string | null
          id?: string
          max_score?: number
          school_id?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          batch_id: string
          created_at: string
          date: string
          id: string
          marked_by: string
          note: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          date: string
          id?: string
          marked_by: string
          note?: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string
          note?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_students: {
        Row: {
          batch_id: string
          id: string
          joined_at: string
          roll_no: string | null
          student_id: string
        }
        Insert: {
          batch_id: string
          id?: string
          joined_at?: string
          roll_no?: string | null
          student_id: string
        }
        Update: {
          batch_id?: string
          id?: string
          joined_at?: string
          roll_no?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_students_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          academic_year: string | null
          active: boolean
          class_teacher_id: string | null
          created_at: string
          grade: string | null
          id: string
          name: string
          school_id: string
          section: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          active?: boolean
          class_teacher_id?: string | null
          created_at?: string
          grade?: string | null
          id?: string
          name: string
          school_id: string
          section?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          active?: boolean
          class_teacher_id?: string | null
          created_at?: string
          grade?: string | null
          id?: string
          name?: string
          school_id?: string
          section?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
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
      daily_goals: {
        Row: {
          ai_message: string | null
          completed_at: string | null
          created_at: string
          goal_date: string
          id: string
          minutes_done: number
          student_id: string
          target_minutes: number
          target_xp: number
          xp_earned: number
        }
        Insert: {
          ai_message?: string | null
          completed_at?: string | null
          created_at?: string
          goal_date: string
          id?: string
          minutes_done?: number
          student_id: string
          target_minutes?: number
          target_xp?: number
          xp_earned?: number
        }
        Update: {
          ai_message?: string | null
          completed_at?: string | null
          created_at?: string
          goal_date?: string
          id?: string
          minutes_done?: number
          student_id?: string
          target_minutes?: number
          target_xp?: number
          xp_earned?: number
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          created_at: string
          email: string
          grade: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          preferred_date: string | null
          preferred_time: string | null
          role: string | null
          school: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          grade?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          role?: string | null
          school?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          grade?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          role?: string | null
          school?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
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
      ingestion_jobs: {
        Row: {
          chapter_id: string | null
          class_id: string | null
          completed_at: string | null
          cost_cents: number | null
          created_at: string
          error: string | null
          id: string
          input_preview: string | null
          model: string | null
          requested_by: string | null
          scope: string
          source: string
          stats: Json
          status: string
          subject_id: string | null
          title: string | null
          tokens_in: number | null
          tokens_out: number | null
          updated_at: string
        }
        Insert: {
          chapter_id?: string | null
          class_id?: string | null
          completed_at?: string | null
          cost_cents?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_preview?: string | null
          model?: string | null
          requested_by?: string | null
          scope?: string
          source?: string
          stats?: Json
          status?: string
          subject_id?: string | null
          title?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          updated_at?: string
        }
        Update: {
          chapter_id?: string | null
          class_id?: string | null
          completed_at?: string | null
          cost_cents?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_preview?: string | null
          model?: string | null
          requested_by?: string | null
          scope?: string
          source?: string
          stats?: Json
          status?: string
          subject_id?: string | null
          title?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      launch_checklist: {
        Row: {
          category: string | null
          created_at: string
          id: string
          label: string
          notes: string | null
          order_index: number | null
          owner: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          label: string
          notes?: string | null
          order_index?: number | null
          owner?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          label?: string
          notes?: string | null
          order_index?: number | null
          owner?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      launch_config: {
        Row: {
          demo_mode_enabled: boolean
          id: number
          launch_at: string | null
          referral_reward: string | null
          updated_at: string
          waitlist_open: boolean
        }
        Insert: {
          demo_mode_enabled?: boolean
          id?: number
          launch_at?: string | null
          referral_reward?: string | null
          updated_at?: string
          waitlist_open?: boolean
        }
        Update: {
          demo_mode_enabled?: boolean
          id?: number
          launch_at?: string | null
          referral_reward?: string | null
          updated_at?: string
          waitlist_open?: boolean
        }
        Relationships: []
      }
      leaderboard_snapshots: {
        Row: {
          display_name: string
          generated_at: string
          grade: string | null
          id: string
          period: string
          rank: number
          scope: string
          scope_key: string
          streak: number
          student_id: string
          xp: number
        }
        Insert: {
          display_name: string
          generated_at?: string
          grade?: string | null
          id?: string
          period?: string
          rank: number
          scope?: string
          scope_key?: string
          streak?: number
          student_id: string
          xp?: number
        }
        Update: {
          display_name?: string
          generated_at?: string
          grade?: string | null
          id?: string
          period?: string
          rank?: number
          scope?: string
          scope_key?: string
          streak?: number
          student_id?: string
          xp?: number
        }
        Relationships: []
      }
      learner_state: {
        Row: {
          mastery: Json
          recent_accuracy: number | null
          time_on_task_seconds: number
          updated_at: string
          user_id: string
          weak_tags: string[]
        }
        Insert: {
          mastery?: Json
          recent_accuracy?: number | null
          time_on_task_seconds?: number
          updated_at?: string
          user_id: string
          weak_tags?: string[]
        }
        Update: {
          mastery?: Json
          recent_accuracy?: number | null
          time_on_task_seconds?: number
          updated_at?: string
          user_id?: string
          weak_tags?: string[]
        }
        Relationships: []
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
      otp_verifications: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          last_sent_at: string
          mobile: string
          purpose: string
          request_id: string | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          last_sent_at?: string
          mobile: string
          purpose?: string
          request_id?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          last_sent_at?: string
          mobile?: string
          purpose?: string
          request_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
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
          board: string | null
          class_id: string | null
          consent_ip: string | null
          consent_user_agent: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          grade: string | null
          id: string
          onboarding_completed_at: string | null
          parent_consent_accepted_at: string | null
          parent_email: string | null
          parent_full_name: string | null
          parent_mobile: string | null
          parent_mobile_verified_at: string | null
          privacy_accepted_at: string | null
          school: string | null
          stream: string | null
          student_email: string | null
          student_full_name: string | null
          student_phone: string | null
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          board?: string | null
          class_id?: string | null
          consent_ip?: string | null
          consent_user_agent?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          grade?: string | null
          id?: string
          onboarding_completed_at?: string | null
          parent_consent_accepted_at?: string | null
          parent_email?: string | null
          parent_full_name?: string | null
          parent_mobile?: string | null
          parent_mobile_verified_at?: string | null
          privacy_accepted_at?: string | null
          school?: string | null
          stream?: string | null
          student_email?: string | null
          student_full_name?: string | null
          student_phone?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          board?: string | null
          class_id?: string | null
          consent_ip?: string | null
          consent_user_agent?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          grade?: string | null
          id?: string
          onboarding_completed_at?: string | null
          parent_consent_accepted_at?: string | null
          parent_email?: string | null
          parent_full_name?: string | null
          parent_mobile?: string | null
          parent_mobile_verified_at?: string | null
          privacy_accepted_at?: string | null
          school?: string | null
          stream?: string | null
          student_email?: string | null
          student_full_name?: string | null
          student_phone?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
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
          chapter_id: string | null
          class_id: string | null
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: number
          id: string
          kind: string
          lesson_id: string | null
          published: boolean
          subject_id: string | null
          time_limit_seconds: number | null
          title: string
          updated_at: string
        }
        Insert: {
          chapter_id?: string | null
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: number
          id?: string
          kind?: string
          lesson_id?: string | null
          published?: boolean
          subject_id?: string | null
          time_limit_seconds?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string | null
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: number
          id?: string
          kind?: string
          lesson_id?: string | null
          published?: boolean
          subject_id?: string | null
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
      referral_codes: {
        Row: {
          clicks: number
          code: string
          created_at: string
          id: string
          owner_email: string | null
          owner_user_id: string | null
          signups: number
        }
        Insert: {
          clicks?: number
          code: string
          created_at?: string
          id?: string
          owner_email?: string | null
          owner_user_id?: string | null
          signups?: number
        }
        Update: {
          clicks?: number
          code?: string
          created_at?: string
          id?: string
          owner_email?: string | null
          owner_user_id?: string | null
          signups?: number
        }
        Relationships: []
      }
      school_insights: {
        Row: {
          generated_at: string
          id: string
          model: string | null
          payload: Json
          period: string
          school_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          model?: string | null
          payload?: Json
          period?: string
          school_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          model?: string | null
          payload?: Json
          period?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_insights_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_members: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["school_member_role"]
          school_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role: Database["public"]["Enums"]["school_member_role"]
          school_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["school_member_role"]
          school_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_members_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          active: boolean
          board: string | null
          city: string | null
          created_at: string
          created_by: string
          id: string
          logo_url: string | null
          name: string
          plan: Database["public"]["Enums"]["school_plan"]
          seats: number
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          board?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          id?: string
          logo_url?: string | null
          name: string
          plan?: Database["public"]["Enums"]["school_plan"]
          seats?: number
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          board?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          id?: string
          logo_url?: string | null
          name?: string
          plan?: Database["public"]["Enums"]["school_plan"]
          seats?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      smart_challenges: {
        Row: {
          ai_generated: boolean
          ai_rationale: string | null
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          description: string
          difficulty: number
          expires_at: string
          id: string
          kind: Database["public"]["Enums"]["challenge_kind"]
          progress: Json
          student_id: string
          target: Json
          title: string
          xp_reward: number
        }
        Insert: {
          ai_generated?: boolean
          ai_rationale?: string | null
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          description: string
          difficulty?: number
          expires_at?: string
          id?: string
          kind: Database["public"]["Enums"]["challenge_kind"]
          progress?: Json
          student_id: string
          target?: Json
          title: string
          xp_reward?: number
        }
        Update: {
          ai_generated?: boolean
          ai_rationale?: string | null
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string
          difficulty?: number
          expires_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["challenge_kind"]
          progress?: Json
          student_id?: string
          target?: Json
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      student_engagement: {
        Row: {
          burnout_score: number
          current_streak: number
          daily_goal_minutes: number
          freeze_credits: number
          last_active_date: string | null
          level: number
          longest_streak: number
          motivation_profile: string
          student_id: string
          total_xp: number
          updated_at: string
          weekly_goal_xp: number
        }
        Insert: {
          burnout_score?: number
          current_streak?: number
          daily_goal_minutes?: number
          freeze_credits?: number
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          motivation_profile?: string
          student_id: string
          total_xp?: number
          updated_at?: string
          weekly_goal_xp?: number
        }
        Update: {
          burnout_score?: number
          current_streak?: number
          daily_goal_minutes?: number
          freeze_credits?: number
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          motivation_profile?: string
          student_id?: string
          total_xp?: number
          updated_at?: string
          weekly_goal_xp?: number
        }
        Relationships: []
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
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: Json
          student_id: string
          unlocked_at: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: Json
          student_id: string
          unlocked_at?: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: Json
          student_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
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
      waitlist_signups: {
        Row: {
          city: string | null
          created_at: string
          email: string
          grade: string | null
          id: string
          name: string | null
          referral_code: string | null
          referred_by_code: string | null
          role: string | null
          source: string | null
          status: string
          updated_at: string
          utm: Json | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          grade?: string | null
          id?: string
          name?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          role?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          utm?: Json | null
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          grade?: string | null
          id?: string
          name?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          role?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          utm?: Json | null
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
      xp_events: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["xp_kind"]
          metadata: Json
          points: number
          ref_id: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["xp_kind"]
          metadata?: Json
          points: number
          ref_id?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["xp_kind"]
          metadata?: Json
          points?: number
          ref_id?: string | null
          student_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_attempt_answer_key: {
        Args: { _attempt_id: string }
        Returns: {
          correct: Json
          question_id: string
        }[]
      }
      has_active_access: { Args: { _user: string }; Returns: boolean }
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
      is_school_admin: {
        Args: { _school: string; _user: string }
        Returns: boolean
      }
      is_school_member: {
        Args: { _school: string; _user: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      school_for_batch: { Args: { _batch: string }; Returns: string }
      score_quiz_attempt: {
        Args: { _answers: Json; _quiz_id: string }
        Returns: {
          per_question: Json
          score: number
          total: number
        }[]
      }
      student_in_batch: {
        Args: { _batch: string; _student: string }
        Returns: boolean
      }
      teaches_batch: {
        Args: { _batch: string; _user: string }
        Returns: boolean
      }
      username_available: { Args: { _username: string }; Returns: boolean }
    }
    Enums: {
      achievement_rarity: "common" | "rare" | "epic" | "legendary"
      app_role: "student" | "parent" | "admin" | "teacher" | "school_admin"
      assignment_status: "draft" | "published" | "closed"
      attendance_status: "present" | "absent" | "late" | "excused"
      bloom_level:
        | "remember"
        | "understand"
        | "apply"
        | "analyze"
        | "evaluate"
        | "create"
      challenge_kind:
        | "minutes"
        | "concepts"
        | "recall"
        | "quiz_score"
        | "streak"
        | "subject_focus"
        | "weakness_kill"
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
      school_member_role: "school_admin" | "teacher" | "student" | "parent"
      school_plan: "free" | "pro" | "enterprise"
      subscription_plan: "monthly" | "yearly"
      subscription_status:
        | "none"
        | "trialing"
        | "active"
        | "expired"
        | "canceled"
      xp_kind:
        | "study"
        | "recall"
        | "quiz"
        | "mastery_up"
        | "streak_bonus"
        | "daily_goal"
        | "challenge"
        | "achievement"
        | "remediation"
        | "manual"
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
      achievement_rarity: ["common", "rare", "epic", "legendary"],
      app_role: ["student", "parent", "admin", "teacher", "school_admin"],
      assignment_status: ["draft", "published", "closed"],
      attendance_status: ["present", "absent", "late", "excused"],
      bloom_level: [
        "remember",
        "understand",
        "apply",
        "analyze",
        "evaluate",
        "create",
      ],
      challenge_kind: [
        "minutes",
        "concepts",
        "recall",
        "quiz_score",
        "streak",
        "subject_focus",
        "weakness_kill",
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
      school_member_role: ["school_admin", "teacher", "student", "parent"],
      school_plan: ["free", "pro", "enterprise"],
      subscription_plan: ["monthly", "yearly"],
      subscription_status: [
        "none",
        "trialing",
        "active",
        "expired",
        "canceled",
      ],
      xp_kind: [
        "study",
        "recall",
        "quiz",
        "mastery_up",
        "streak_bonus",
        "daily_goal",
        "challenge",
        "achievement",
        "remediation",
        "manual",
      ],
    },
  },
} as const
