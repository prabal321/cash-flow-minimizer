import type { SupabaseClient, User } from '@supabase/supabase-js'

export interface Context {
  user: User | null
  supabase: SupabaseClient
}
