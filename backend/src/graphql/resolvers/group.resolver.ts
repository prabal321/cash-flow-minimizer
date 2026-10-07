import type { Context } from '../../types'
import { requireAuth, dbError, notFound } from '../../utils/errors'
import { createGroup, inviteMember, acceptInvitation } from '../../services/group.service'
import { calculateGroupBalances } from '../../services/balance.service'
import { minimizeCashFlow } from '../../services/settlement.service'

export const groupResolvers = {
  Query: {
    groups: async (_: unknown, __: unknown, context: Context) => {
      requireAuth(context.user)
      const { data, error } = await context.supabase
        .from('groups')
        .select('*, group_members!inner(user_id)')
        .eq('group_members.user_id', context.user!.id)
        .order('created_at', { ascending: false })
      if (error) dbError(error)
      return data ?? []
    },

    group: async (_: unknown, { id }: { id: string }, context: Context) => {
      requireAuth(context.user)
      const { data, error } = await context.supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single()
      if (error || !data) notFound('Group')
      return data
    },

    groupBalances: async (_: unknown, { groupId }: { groupId: string }, context: Context) => {
      requireAuth(context.user)
      return calculateGroupBalances(context.supabase, groupId)
    },

    groupSettlements: async (_: unknown, { groupId }: { groupId: string }, context: Context) => {
      requireAuth(context.user)
      const balances = await calculateGroupBalances(context.supabase, groupId)
      return minimizeCashFlow(balances)
    },

    myInvitations: async (_: unknown, __: unknown, context: Context) => {
      requireAuth(context.user)
      const { data: profile } = await context.supabase
        .from('profiles')
        .select('email')
        .eq('id', context.user.id)
        .single()

      if (!profile) return []

      const { data, error } = await context.supabase
        .from('group_invitations')
        .select('*')
        .eq('email', profile.email)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) dbError(error)
      return data ?? []
    },
  },

  Mutation: {
    createGroup: async (
      _: unknown,
      { input }: { input: { name: string; description?: string } },
      context: Context,
    ) => {
      requireAuth(context.user)
      return createGroup(context.supabase, context.user.id, input)
    },

    inviteMember: async (
      _: unknown,
      { input }: { input: { groupId: string; email: string } },
      context: Context,
    ) => {
      requireAuth(context.user)
      return inviteMember(context.supabase, context.user.id, input)
    },

    acceptInvitation: async (
      _: unknown,
      { token }: { token: string },
      context: Context,
    ) => {
      requireAuth(context.user)
      return acceptInvitation(context.supabase, context.user.id, context.user.email!, token)
    },
  },

  //  Field resolvers 

  Group: {
    createdBy: async (parent: { created_by: string }, _: unknown, context: Context) => {
      const { data } = await context.supabase
        .from('profiles')
        .select('*')
        .eq('id', parent.created_by)
        .single()
      return data
    },

    members: async (parent: { id: string }, _: unknown, context: Context) => {
      const { data, error } = await context.supabase
        .from('group_members')
        .select('*')
        .eq('group_id', parent.id)
        .order('joined_at', { ascending: true })
      if (error) dbError(error)
      return data ?? []
    },

    expenses: async (parent: { id: string }, _: unknown, context: Context) => {
      const { data, error } = await context.supabase
        .from('expenses')
        .select('*')
        .eq('group_id', parent.id)
        .order('created_at', { ascending: false })
      if (error) dbError(error)
      return data ?? []
    },

    memberCount: async (parent: { id: string }, _: unknown, context: Context) => {
      const { count, error } = await context.supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', parent.id)
      if (error) dbError(error)
      return count ?? 0
    },

    myBalance: async (parent: { id: string }, _: unknown, context: Context) => {
      if (!context.user) return 0
      const balances = await calculateGroupBalances(context.supabase, parent.id)
      const mine = balances.find((b) => b.user.id === context.user?.id)
      return mine?.netBalance ?? 0
    },

    createdAt: (parent: { created_at: string }) => parent.created_at,
    updatedAt: (parent: { updated_at: string }) => parent.updated_at,
  },

  // ── Field resolvers on GroupMember ─────────────────────

  GroupMember: {
    groupId: (parent: { group_id: string }) => parent.group_id,

    user: async (parent: { user_id: string }, _: unknown, context: Context) => {
      const { data } = await context.supabase
        .from('profiles')
        .select('*')
        .eq('id', parent.user_id)
        .single()
      return data
    },

    role: (parent: { role: string }) => parent.role.toUpperCase(),
    joinedAt: (parent: { joined_at: string }) => parent.joined_at,
  },

  // ── Field resolvers on GroupInvitation ─────────────────

  GroupInvitation: {
    groupId: (parent: { group_id: string }) => parent.group_id,
    expiresAt: (parent: { expires_at: string }) => parent.expires_at,
    createdAt: (parent: { created_at: string }) => parent.created_at,
  },
}
