import { userResolvers } from './user.resolver'
import { groupResolvers } from './group.resolver'
import { expenseResolvers } from './expense.resolver'

// Map snake_case DB columns to camelCase GraphQL fields shared across all User resolvers
const userFieldResolvers = {
  User: {
    avatarUrl: (parent: { avatar_url: string | null }) => parent.avatar_url,
    createdAt: (parent: { created_at: string }) => parent.created_at,
    updatedAt: (parent: { updated_at: string }) => parent.updated_at,
  },
}

export const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...groupResolvers.Query,
    ...expenseResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...groupResolvers.Mutation,
    ...expenseResolvers.Mutation,
  },
  ...userFieldResolvers,
  Group: groupResolvers.Group,
  GroupMember: groupResolvers.GroupMember,
  GroupInvitation: groupResolvers.GroupInvitation,
  Expense: expenseResolvers.Expense,
  ExpenseSplit: expenseResolvers.ExpenseSplit,
}
