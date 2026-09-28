import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True whenever there's no real Supabase project wired up (or the caller
 * has explicitly forced demo mode). All data access goes through
 * src/lib/data, which reads this flag and falls back to mock-data.ts.
 */
export const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !supabaseUrl || !supabaseAnonKey;

export const supabase =
  !isDemoMode && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
