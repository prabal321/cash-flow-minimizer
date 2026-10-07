import type { Request } from 'express'
import { anonClient, serviceClient } from '../../config/supabase'
import type { Context } from '../../types'

export async function createContext({ req }: { req: Request }): Promise<Context> {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  if (!token) {
    return { user: null, supabase: serviceClient }
  }

  // Verify the user's JWT using the anon client 
  const { data: { user }, error } = await anonClient.auth.getUser(token)

  if (error || !user) {
    return { user: null, supabase: serviceClient }
  }

  // The service layer enforces authorization (requireAuth, membership checks, etc.).
  return { user, supabase: serviceClient }
}
