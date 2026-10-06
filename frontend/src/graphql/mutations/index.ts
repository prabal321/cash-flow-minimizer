import { gql } from '@apollo/client'

export const CREATE_GROUP = gql`
  mutation CreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      id
      name
      description
      memberCount
      myBalance
    }
  }
`

export const INVITE_MEMBER = gql`
  mutation InviteMember($input: InviteMemberInput!) {
    inviteMember(input: $input) {
      id
      token
      email
      expiresAt
    }
  }
`

export const ACCEPT_INVITATION = gql`
  mutation AcceptInvitation($token: String!) {
    acceptInvitation(token: $token) {
      id
      role
      user { id name }
    }
  }
`

export const CREATE_EXPENSE = gql`
  mutation CreateExpense($input: CreateExpenseInput!) {
    createExpense(input: $input) {
      id
      description
      amount
      splitCount
      paidBy { id name }
      splits { id amount user { id name } }
    }
  }
`

export const UPDATE_EXPENSE = gql`
  mutation UpdateExpense($id: ID!, $input: UpdateExpenseInput!) {
    updateExpense(id: $id, input: $input) {
      id
      description
      amount
      paidBy { id name }
      splits { id amount user { id name } }
    }
  }
`

export const DELETE_EXPENSE = gql`
  mutation DeleteExpense($id: ID!) {
    deleteExpense(id: $id)
  }
`

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      name
      email
      avatarUrl
      updatedAt
    }
  }
`
