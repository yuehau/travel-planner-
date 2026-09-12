import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
    : null;

export const supabase: SupabaseClient<Database> | null = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? 'Supabase is not available.');
  }

  return supabase;
};
