import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://spb-bp1ud8u47k09283b.supabase.opentrust.net';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi1icDF1ZDh1NDdrMDkyODNiIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njc0NDQ2NjUsImV4cCI6MjA4MzAyMDY2NX0.dgzflsFmz9hASNrfBXDmcNrM9uz70InNusjTxAt8Qws';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

