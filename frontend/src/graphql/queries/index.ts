import { gql } from '@apollo/client'

export const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      email
      avatarUrl
      createdAt
      updatedAt
    }
  }
`

export const GET_GROUPS = gql`
  query GetGroups {
    groups {
      id
      name
      description
      memberCount
      myBalance
      createdAt
    }
  }
`

export const GET_GROUP = gql`
  query GetGroup($id: ID!) {
    group(id: $id) {
      id
      name
      description
      memberCount
      myBalance
      createdBy { id name }
      members {
        id
        role
        joinedAt
        user { id name email avatarUrl }
      }
      expenses {
        id
        description
        amount
        splitCount
        createdAt
        paidBy { id name }
      }
    }
  }
`

export const GET_EXPENSE = gql`
  query GetExpense($id: ID!) {
    expense(id: $id) {
      id
      description
      amount
      createdAt
      paidBy { id name }
      splits {
        id
        amount
        user { id name }
      }
    }
  }
`

export const GET_GROUP_BALANCES = gql`
  query GetGroupBalances($groupId: ID!) {
    groupBalances(groupId: $groupId) {
      netBalance
      status
      user { id name }
    }
  }
`

export const GET_GROUP_SETTLEMENTS = gql`
  query GetGroupSettlements($groupId: ID!) {
    groupSettlements(groupId: $groupId) {
      amount
      from { id name }
      to { id name }
    }
  }
`

export const GET_MY_INVITATIONS = gql`
  query GetMyInvitations {
    myInvitations {
      id
      groupId
      email
      token
      expiresAt
    }
  }
`
