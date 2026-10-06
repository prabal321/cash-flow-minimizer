import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants'

// Used only for sign-in / sign-up. All data queries go through Apollo → GraphQL backend.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUp(email: string, password: string, name: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}
