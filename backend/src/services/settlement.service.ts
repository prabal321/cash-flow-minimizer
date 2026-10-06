import { MaxHeap } from '../utils/heap'
import { round2 } from '../utils/money'
import type { BalanceResult, ProfileRow } from './balance.service'

export interface SettlementResult {
  from: ProfileRow
  to: ProfileRow
  amount: number
}

const EPSILON = 0.005

// Greedy cash-flow minimization using two max-heaps.
//
// Algorithm (O(n log n), at most n-1 transactions for n non-zero participants):
//   1. Separate users into creditors (netBalance > 0) and debtors (netBalance < 0).
//   2. Push creditor balances into a max-heap; push |debtor balances| into another max-heap.
//   3. Repeatedly pair the largest creditor with the largest debtor:
//      settlement = min(creditorBalance, debtorBalance)
//      Re-insert any remaining balance back into the appropriate heap.
//   4. Stop when one heap is empty.
export function minimizeCashFlow(balances: BalanceResult[]): SettlementResult[] {
  const creditorHeap = new MaxHeap()
  const debtorHeap = new MaxHeap()

  balances.forEach((b, i) => {
    if (b.netBalance > EPSILON) {
      creditorHeap.insert(b.netBalance, i)
    } else if (b.netBalance < -EPSILON) {
      debtorHeap.insert(-b.netBalance, i) // store as positive
    }
  })

  const settlements: SettlementResult[] = []

  while (creditorHeap.size > 0 && debtorHeap.size > 0) {
    const maxCreditor = creditorHeap.extractMax()
    const maxDebtor = debtorHeap.extractMax()

    const amount = round2(Math.min(maxCreditor.balance, maxDebtor.balance))

    settlements.push({
      from: balances[maxDebtor.index].user,
      to: balances[maxCreditor.index].user,
      amount,
    })

    const creditorRemainder = round2(maxCreditor.balance - amount)
    const debtorRemainder = round2(maxDebtor.balance - amount)

    if (creditorRemainder > EPSILON) creditorHeap.insert(creditorRemainder, maxCreditor.index)
    if (debtorRemainder > EPSILON) debtorHeap.insert(debtorRemainder, maxDebtor.index)
  }

  return settlements
}
