// Supabase client for LMAC.
// Configure via environment variables (see .env.example):
//   VITE_SUPABASE_URL      — e.g. https://abcdefgh.supabase.co
//   VITE_SUPABASE_ANON_KEY — the project's public (anon) API key
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
    'in .env.local (local development) or in your Vercel project environment variables (production).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});