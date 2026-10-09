import type { Context } from '../../types'
import { requireAuth, dbError, notFound } from '../../utils/errors'
import { createExpense, updateExpense, deleteExpense } from '../../services/expense.service'

export const expenseResolvers = {
  Query: {
    expense: async (_: unknown, { id }: { id: string }, context: Context) => {
      requireAuth(context.user)
      const { data, error } = await context.supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single()
      if (error || !data) notFound('Expense')
      return data
    },

    groupExpenses: async (_: unknown, { groupId }: { groupId: string }, context: Context) => {
      requireAuth(context.user)
      const { data, error } = await context.supabase
        .from('expenses')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
      if (error) dbError(error)
      return data ?? []
    },
  },

  Mutation: {
    createExpense: async (
      _: unknown,
      { input }: { input: Parameters<typeof createExpense>[2] },
      context: Context,
    ) => {
      requireAuth(context.user)
      return createExpense(context.supabase, context.user.id, input)
    },

    updateExpense: async (
      _: unknown,
      { id, input }: { id: string; input: Parameters<typeof updateExpense>[3] },
      context: Context,
    ) => {
      requireAuth(context.user)
      return updateExpense(context.supabase, context.user.id, id, input)
    },

    deleteExpense: async (_: unknown, { id }: { id: string }, context: Context) => {
      requireAuth(context.user)
      return deleteExpense(context.supabase, context.user.id, id)
    },
  },

  // ── Field resolvers on Expense ──────────────────────────

  Expense: {
    groupId: (parent: { group_id: string }) => parent.group_id,
    splitType: (parent: { split_type: string }) => parent.split_type?.toUpperCase() ?? 'EQUAL',
    splitCount: (parent: { split_count: number }) => parent.split_count,
    createdAt: (parent: { created_at: string }) => parent.created_at,
    updatedAt: (parent: { updated_at: string }) => parent.updated_at,

    paidBy: async (parent: { paid_by: string }, _: unknown, context: Context) => {
      const { data } = await context.supabase
        .from('profiles')
        .select('*')
        .eq('id', parent.paid_by)
        .single()
      return data
    },

    splits: async (parent: { id: string }, _: unknown, context: Context) => {
      const { data, error } = await context.supabase
        .from('expense_splits')
        .select('*')
        .eq('expense_id', parent.id)
      if (error) dbError(error)
      return data ?? []
    },
  },

  // ── Field resolvers on ExpenseSplit ────────────────────

  ExpenseSplit: {
    expenseId: (parent: { expense_id: string }) => parent.expense_id,

    user: async (parent: { user_id: string }, _: unknown, context: Context) => {
      const { data } = await context.supabase
        .from('profiles')
        .select('*')
        .eq('id', parent.user_id)
        .single()
      return data
    },
  },
}
