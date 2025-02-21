import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Regular client for normal operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Let's revert back to using the regular signup method
export async function signUpUser(email: string, password: string, options = {}) {
  return supabase.auth.signUp({
    email,
    password,
    options
  });
}