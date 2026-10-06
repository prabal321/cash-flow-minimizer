interface HeapNode {
  balance: number
  index: number
}

// Binary max-heap — root always holds the node with the highest balance.
// Used for both creditors (positive balances) and debtors (absolute values
// of negative balances) in the cash-flow minimizer.
export class MaxHeap {
  private heap: HeapNode[] = []

  get size(): number {
    return this.heap.length
  }

  insert(balance: number, index: number): void {
    this.heap.push({ balance, index })
    this.siftUp(this.heap.length - 1)
  }

  extractMax(): HeapNode {
    const top = this.heap[0]
    const last = this.heap.pop()!
    if (this.heap.length > 0) {
      this.heap[0] = last
      this.siftDown(0)
    }
    return top
  }

  private siftUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2)
      if (this.heap[parent].balance < this.heap[i].balance) {
        ;[this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]]
        i = parent
      } else {
        break
      }
    }
  }

  private siftDown(i: number): void {
    const n = this.heap.length
    while (true) {
      let largest = i
      const left = 2 * i + 1
      const right = 2 * i + 2
      if (left < n && this.heap[left].balance > this.heap[largest].balance) largest = left
      if (right < n && this.heap[right].balance > this.heap[largest].balance) largest = right
      if (largest === i) break
      ;[this.heap[largest], this.heap[i]] = [this.heap[i], this.heap[largest]]
      i = largest
    }
  }
}
