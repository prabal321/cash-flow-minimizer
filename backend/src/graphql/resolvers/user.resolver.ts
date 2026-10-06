import type { Context } from '../../types'
import { requireAuth } from '../../utils/errors'
import { dbError } from '../../utils/errors'

export const userResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, context: Context) => {
      requireAuth(context.user)
      const { data, error } = await context.supabase
        .from('profiles')
        .select('*')
        .eq('id', context.user.id)
        .single()
      if (error) dbError(error)
      return data
    },
  },

  Mutation: {
    updateProfile: async (
      _: unknown,
      { input }: { input: { name?: string; avatarUrl?: string } },
      context: Context,
    ) => {
      requireAuth(context.user)

      const updates: Record<string, unknown> = {}
      if (input.name !== undefined) updates.name = input.name.trim()
      if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl

      const { data, error } = await context.supabase
        .from('profiles')
        .update(updates)
        .eq('id', context.user.id)
        .select()
        .single()

      if (error) dbError(error)
      return data
    },
  },
}
