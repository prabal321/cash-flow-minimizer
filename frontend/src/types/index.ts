// ── GraphQL / Domain types ────────────────────────────────────────────────────

export type Role = 'OWNER' | 'MEMBER'
export type SplitType = 'EQUAL' | 'UNEQUAL'
export type BalanceStatus = 'OWED' | 'OWES' | 'SETTLED'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface Group {
  id: string
  name: string
  description?: string | null
  createdBy: User
  members: GroupMember[]
  expenses: Expense[]
  memberCount: number
  myBalance: number
  createdAt: string
  updatedAt: string
}

export interface GroupMember {
  id: string
  groupId: string
  user: User
  role: Role
  joinedAt: string
}

export interface GroupInvitation {
  id: string
  groupId: string
  email: string
  token: string
  expiresAt: string
  used: boolean
  createdAt: string
}

export interface Expense {
  id: string
  groupId: string
  description: string
  amount: number
  paidBy: User
  splits: ExpenseSplit[]
  splitCount: number
  createdAt: string
  updatedAt: string
}

export interface ExpenseSplit {
  id: string
  expenseId: string
  user: User
  amount: number
}

export interface Balance {
  user: User
  netBalance: number
  status: BalanceStatus
}

export interface Settlement {
  from: User
  to: User
  amount: number
}

// ── Navigation types ──────────────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined
  SignUp: undefined
}

export type AppStackParamList = {
  Groups: undefined
  GroupDetail: { groupId: string; groupName: string }
  AddExpense: { groupId: string }
  Settlements: { groupId: string }
  Profile: undefined
  CreateGroup: undefined
  InviteMember: { groupId: string }
  ExpenseDetail: { expenseId: string; groupId: string }
  AcceptInvitation: undefined
}
