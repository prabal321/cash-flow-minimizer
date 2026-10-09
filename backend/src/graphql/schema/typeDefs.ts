export const typeDefs = `#graphql

  # ── Enums ──────────────────────────────────────────────

  enum Role {
    OWNER
    MEMBER
  }

  enum SplitType {
    EQUAL
    UNEQUAL
  }

  enum BalanceStatus {
    OWED
    OWES
    SETTLED
  }

  # ── Core types ─────────────────────────────────────────

  type User {
    id: ID!
    name: String!
    email: String!
    avatarUrl: String
    createdAt: String!
    updatedAt: String!
  }

  type Group {
    id: ID!
    name: String!
    description: String
    createdBy: User!
    members: [GroupMember!]!
    expenses: [Expense!]!
    memberCount: Int!
    myBalance: Float!
    createdAt: String!
    updatedAt: String!
  }

  type GroupMember {
    id: ID!
    groupId: ID!
    user: User!
    role: Role!
    joinedAt: String!
  }

  type GroupInvitation {
    id: ID!
    groupId: ID!
    email: String!
    token: String!
    expiresAt: String!
    used: Boolean!
    createdAt: String!
  }

  type Expense {
    id: ID!
    groupId: ID!
    description: String!
    amount: Float!
    splitType: SplitType!
    paidBy: User!
    splits: [ExpenseSplit!]!
    splitCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  type ExpenseSplit {
    id: ID!
    expenseId: ID!
    user: User!
    amount: Float!
  }

  type Balance {
    user: User!
    netBalance: Float!
    status: BalanceStatus!
  }

  type Settlement {
    from: User!
    to: User!
    amount: Float!
  }

  # ── Inputs ─────────────────────────────────────────────

  input CreateGroupInput {
    name: String!
    description: String
  }

  input InviteMemberInput {
    groupId: ID!
    email: String!
  }

  input SplitAmountInput {
    userId: ID!
    amount: Float!
  }

  input CreateExpenseInput {
    groupId: ID!
    description: String!
    amount: Float!
    paidBy: ID!
    splitType: SplitType!
    participantIds: [ID!]!
    splits: [SplitAmountInput!]
  }

  input UpdateExpenseInput {
    description: String
    amount: Float
    paidBy: ID
    splitType: SplitType
    participantIds: [ID!]
    splits: [SplitAmountInput!]
  }

  input UpdateProfileInput {
    name: String
    avatarUrl: String
  }

  # ── Queries ────────────────────────────────────────────

  type Query {
    me: User
    groups: [Group!]!
    group(id: ID!): Group
    expense(id: ID!): Expense
    groupExpenses(groupId: ID!): [Expense!]!
    groupBalances(groupId: ID!): [Balance!]!
    groupSettlements(groupId: ID!): [Settlement!]!
    myInvitations: [GroupInvitation!]!
  }

  # ── Mutations ──────────────────────────────────────────

  type Mutation {
    createGroup(input: CreateGroupInput!): Group!
    inviteMember(input: InviteMemberInput!): GroupInvitation!
    acceptInvitation(token: String!): GroupMember!
    createExpense(input: CreateExpenseInput!): Expense!
    updateExpense(id: ID!, input: UpdateExpenseInput!): Expense!
    deleteExpense(id: ID!): Boolean!
    updateProfile(input: UpdateProfileInput!): User!
  }
`
