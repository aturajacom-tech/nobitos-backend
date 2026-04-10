/**
 * Database Configuration
 * Supabase client using HTTPS (port 443) — works on any server
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export async function initializeDatabase(): Promise<SupabaseClient> {
  if (supabase) {
    return supabase;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Test connection
  const { error } = await supabase.from('organizations').select('id').limit(1);
  if (error) {
    throw new Error(`Database connection test failed: ${error.message}`);
  }

  console.log('✅ Database connection verified (Supabase HTTPS)');
  return supabase;
}

export function getDatabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return supabase;
}

export async function closeDatabase(): Promise<void> {
  supabase = null;
  console.log('✅ Database connection closed');
}
