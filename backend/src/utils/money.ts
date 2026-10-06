// Distributes `total` evenly across `count` recipients.
// Leftover cents are assigned to the first recipients so the
// split amounts always sum exactly to the total.
// e.g. distributeAmount(10, 3) → [3.34, 3.33, 3.33]
export function distributeAmount(total: number, count: number): number[] {
  if (count === 0) return []
  const totalCents = Math.round(total * 100)
  const baseCents = Math.floor(totalCents / count)
  const remainder = totalCents % count
  return Array.from({ length: count }, (_, i) => (baseCents + (i < remainder ? 1 : 0)) / 100)
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}
