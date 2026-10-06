import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY must be set',
  )
}

const DB_OPTIONS = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
}

// Service-role client: used by all database queries on the backend.
// This bypasses RLS — the service layer enforces all authorization.
// NEVER send this key to the mobile client.
export const serviceClient: SupabaseClient = createClient(
  SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY!,
  DB_OPTIONS,
)

// Anon client: used only for verifying user JWTs via auth.getUser().
// No database queries go through this client.
export const anonClient: SupabaseClient = createClient(
  SUPABASE_URL!,
  SUPABASE_ANON_KEY!,
  DB_OPTIONS,
)
