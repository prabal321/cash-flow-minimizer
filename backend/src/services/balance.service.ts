import type { SupabaseClient } from '@supabase/supabase-js'
import { round2 } from '../utils/money'
import { dbError } from '../utils/errors'

export interface ProfileRow {
  id: string
  name: string
  email: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface BalanceResult {
  user: ProfileRow
  netBalance: number
  status: 'OWED' | 'OWES' | 'SETTLED'
}

export async function calculateGroupBalances(
  supabase: SupabaseClient,
  groupId: string,
): Promise<BalanceResult[]> {
  // 1. All member user_ids
  const { data: memberRows, error: memberErr } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)

  if (memberErr) dbError(memberErr)
  if (!memberRows || memberRows.length === 0) return []

  const userIds = memberRows.map((m) => m.user_id as string)

  // 2. Profiles for all members
  const { data: profileRows, error: profileErr } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_url, created_at, updated_at')
    .in('id', userIds)

  if (profileErr) dbError(profileErr)
  const profileMap = Object.fromEntries((profileRows ?? []).map((p) => [p.id, p as ProfileRow]))

  // 3. All expenses in the group (paid amounts)
  const { data: expenseRows, error: expenseErr } = await supabase
    .from('expenses')
    .select('id, paid_by, amount')
    .eq('group_id', groupId)

  if (expenseErr) dbError(expenseErr)

  // 4. All splits for those expenses (owed amounts)
  const expenseIds = (expenseRows ?? []).map((e) => e.id as string)
  let splitRows: Array<{ user_id: string; amount: number }> = []

  if (expenseIds.length > 0) {
    const { data, error: splitErr } = await supabase
      .from('expense_splits')
      .select('user_id, amount')
      .in('expense_id', expenseIds)

    if (splitErr) dbError(splitErr)
    splitRows = (data ?? []) as typeof splitRows
  }

  // 5. Aggregate
  const paidMap: Record<string, number> = {}
  const owedMap: Record<string, number> = {}

  for (const e of expenseRows ?? []) {
    paidMap[e.paid_by] = (paidMap[e.paid_by] ?? 0) + Number(e.amount)
  }
  for (const s of splitRows) {
    owedMap[s.user_id] = (owedMap[s.user_id] ?? 0) + Number(s.amount)
  }

  return userIds.map((uid) => {
    const netBalance = round2((paidMap[uid] ?? 0) - (owedMap[uid] ?? 0))
    return {
      user: profileMap[uid],
      netBalance,
      status: netBalance > 0.005 ? 'OWED' : netBalance < -0.005 ? 'OWES' : 'SETTLED',
    } as BalanceResult
  })
}
