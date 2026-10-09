import type { SupabaseClient } from '@supabase/supabase-js'
import { distributeAmount, round2 } from '../utils/money'
import { badRequest, dbError, forbidden, notFound } from '../utils/errors'

interface SplitInput {
  userId: string
  amount: number
}

interface CreateExpenseInput {
  groupId: string
  description: string
  amount: number
  paidBy: string
  splitType: 'EQUAL' | 'UNEQUAL'
  participantIds: string[]
  splits?: SplitInput[] | null
}

interface UpdateExpenseInput {
  description?: string | null
  amount?: number | null
  paidBy?: string | null
  splitType?: 'EQUAL' | 'UNEQUAL' | null
  participantIds?: string[] | null
  splits?: SplitInput[] | null
}

async function assertGroupMember(supabase: SupabaseClient, groupId: string, userId: string) {
  const { data } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()
  if (!data) forbidden()
}

async function getGroupMemberIds(supabase: SupabaseClient, groupId: string): Promise<string[]> {
  const { data } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
  return (data ?? []).map((m) => m.user_id as string)
}

function buildSplits(
  expenseId: string,
  splitType: 'EQUAL' | 'UNEQUAL',
  totalAmount: number,
  participantIds: string[],
  splits?: SplitInput[] | null,
): Array<{ expense_id: string; user_id: string; amount: number }> {
  if (splitType === 'EQUAL') {
    const amounts = distributeAmount(totalAmount, participantIds.length)
    return participantIds.map((uid, i) => ({
      expense_id: expenseId,
      user_id: uid,
      amount: amounts[i],
    }))
  }

  // UNEQUAL
  if (!splits || splits.length === 0) badRequest('splits are required for UNEQUAL split type')

  const splitTotal = round2(splits.reduce((sum, s) => sum + s.amount, 0))
  if (Math.abs(splitTotal - totalAmount) > 0.01) {
    badRequest(
      `Split amounts sum to ${splitTotal} but expense amount is ${totalAmount}`,
    )
  }

  return splits.map((s) => ({
    expense_id: expenseId,
    user_id: s.userId,
    amount: s.amount,
  }))
}

export async function createExpense(
  supabase: SupabaseClient,
  userId: string,
  input: CreateExpenseInput,
) {
  if (input.amount <= 0) badRequest('Expense amount must be greater than zero')
  if (!input.description.trim()) badRequest('Description cannot be empty')
  if (input.participantIds.length === 0) badRequest('At least one participant is required')

  const uniqueParticipants = [...new Set(input.participantIds)]
  if (uniqueParticipants.length !== input.participantIds.length) {
    badRequest('Duplicate participants are not allowed')
  }

  await assertGroupMember(supabase, input.groupId, userId)

  const memberIds = await getGroupMemberIds(supabase, input.groupId)
  const memberSet = new Set(memberIds)

  if (!memberSet.has(input.paidBy)) badRequest('The payer must be a member of the group')

  for (const pid of uniqueParticipants) {
    if (!memberSet.has(pid)) badRequest(`Participant ${pid} is not a member of the group`)
  }

  const { data: expense, error: expErr } = await supabase
    .from('expenses')
    .insert({
      group_id: input.groupId,
      description: input.description.trim(),
      amount: input.amount,
      paid_by: input.paidBy,
      split_count: uniqueParticipants.length,
      split_type: input.splitType.toLowerCase(),
    })
    .select()
    .single()

  if (expErr) dbError(expErr)

  const splitRows = buildSplits(
    expense.id,
    input.splitType,
    input.amount,
    uniqueParticipants,
    input.splits,
  )

  const { error: splitErr } = await supabase.from('expense_splits').insert(splitRows)

  if (splitErr) {
    // Compensate: remove the orphaned expense row
    await supabase.from('expenses').delete().eq('id', expense.id)
    dbError(splitErr)
  }

  return expense
}

export async function updateExpense(
  supabase: SupabaseClient,
  userId: string,
  expenseId: string,
  input: UpdateExpenseInput,
) {
  const { data: existing, error: fetchErr } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', expenseId)
    .single()

  if (fetchErr || !existing) notFound('Expense')

  // Only payer or group owner can update
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', existing.group_id)
    .eq('user_id', userId)
    .single()

  if (!membership) forbidden()
  if (existing.paid_by !== userId && membership.role !== 'owner') forbidden()

  const newAmount = input.amount ?? existing.amount
  const newPaidBy = input.paidBy ?? existing.paid_by
  const newDescription = input.description?.trim() ?? existing.description
  const newSplitType = input.splitType ?? 'EQUAL'
  const newParticipantIds = input.participantIds ?? null

  if (newAmount <= 0) badRequest('Expense amount must be greater than zero')

  if (newParticipantIds) {
    const memberIds = await getGroupMemberIds(supabase, existing.group_id)
    const memberSet = new Set(memberIds)

    if (!memberSet.has(newPaidBy)) badRequest('The payer must be a member of the group')
    for (const pid of newParticipantIds) {
      if (!memberSet.has(pid)) badRequest(`Participant ${pid} is not a member of the group`)
    }

    // Delete existing splits
    await supabase.from('expense_splits').delete().eq('expense_id', expenseId)

    const splitRows = buildSplits(expenseId, newSplitType, newAmount, newParticipantIds, input.splits)
    const { error: splitErr } = await supabase.from('expense_splits').insert(splitRows)
    if (splitErr) dbError(splitErr)
  }

  const { data: updated, error: updateErr } = await supabase
    .from('expenses')
    .update({
      description: newDescription,
      amount: newAmount,
      paid_by: newPaidBy,
      split_count: newParticipantIds?.length ?? existing.split_count,
      split_type: newSplitType.toLowerCase(),
    })
    .eq('id', expenseId)
    .select()
    .single()

  if (updateErr) dbError(updateErr)
  return updated
}

export async function deleteExpense(
  supabase: SupabaseClient,
  userId: string,
  expenseId: string,
): Promise<boolean> {
  const { data: existing, error: fetchErr } = await supabase
    .from('expenses')
    .select('paid_by, group_id')
    .eq('id', expenseId)
    .single()

  if (fetchErr || !existing) notFound('Expense')

  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', existing.group_id)
    .eq('user_id', userId)
    .single()

  if (!membership) forbidden()
  if (existing.paid_by !== userId && membership.role !== 'owner') forbidden()

  // expense_splits deleted automatically via CASCADE
  const { error: deleteErr } = await supabase.from('expenses').delete().eq('id', expenseId)
  if (deleteErr) dbError(deleteErr)

  return true
}
