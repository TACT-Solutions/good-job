import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../supabase';

export function createClient() {
  // Use fallback values for build time (will be replaced at runtime)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}
