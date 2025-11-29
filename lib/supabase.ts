import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          created_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          company: string;
          url: string | null;
          raw_description: string | null;
          extracted_description: string | null;
          status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
          resume_used: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          company: string;
          url?: string | null;
          raw_description?: string | null;
          extracted_description?: string | null;
          status?: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
          resume_used?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          company?: string;
          url?: string | null;
          raw_description?: string | null;
          extracted_description?: string | null;
          status?: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
          resume_used?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          job_id: string | null;
          name: string;
          email: string | null;
          title: string | null;
          source: 'user' | 'public_website' | 'linkedin_export';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id?: string | null;
          name: string;
          email?: string | null;
          title?: string | null;
          source?: 'user' | 'public_website' | 'linkedin_export';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string | null;
          name?: string;
          email?: string | null;
          title?: string | null;
          source?: 'user' | 'public_website' | 'linkedin_export';
          created_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          job_id: string | null;
          date: string;
          message: string;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id?: string | null;
          date: string;
          message: string;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string | null;
          date?: string;
          message?: string;
          completed?: boolean;
          created_at?: string;
        };
      };
      linkedin_connections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          company: string | null;
          title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          company?: string | null;
          title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          company?: string | null;
          title?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
