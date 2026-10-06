import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { badRequest, dbError, forbidden, notFound } from '../utils/errors'

export async function createGroup(
  supabase: SupabaseClient,
  userId: string,
  input: { name: string; description?: string | null },
) {
  const name = input.name.trim()
  if (!name) badRequest('Group name cannot be empty')

  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .insert({ name, description: input.description ?? null, created_by: userId })
    .select()
    .single()

  if (groupErr) dbError(groupErr)

  const { error: memberErr } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'owner' })

  if (memberErr) {
    await supabase.from('groups').delete().eq('id', group.id)
    dbError(memberErr)
  }

  return group
}

export async function inviteMember(
  supabase: SupabaseClient,
  userId: string,
  input: { groupId: string; email: string },
) {
  const email = input.email.trim().toLowerCase()
  if (!email.includes('@')) badRequest('Invalid email address')

  // Caller must be owner
  const { data: callerMembership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', input.groupId)
    .eq('user_id', userId)
    .single()

  if (!callerMembership) notFound('Group')
  if (callerMembership.role !== 'owner') forbidden()

  // Check target is not already a member
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingProfile) {
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', input.groupId)
      .eq('user_id', existingProfile.id)
      .single()

    if (existingMember) badRequest('This user is already a member of the group')
  }

  // Check no active invitation already exists
  const { data: existingInvite } = await supabase
    .from('group_invitations')
    .select('id')
    .eq('group_id', input.groupId)
    .eq('email', email)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existingInvite) badRequest('An active invitation already exists for this email')

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: invitation, error: invErr } = await supabase
    .from('group_invitations')
    .insert({
      group_id: input.groupId,
      email,
      token: randomUUID(),
      invited_by: userId,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (invErr) dbError(invErr)
  return invitation
}

export async function acceptInvitation(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  token: string,
) {
  const { data: invitation, error: invErr } = await supabase
    .from('group_invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (invErr || !invitation) notFound('Invitation')
  if (invitation.used) badRequest('This invitation has already been used')
  if (new Date(invitation.expires_at) < new Date()) badRequest('This invitation has expired')
  if (invitation.email !== userEmail.toLowerCase()) forbidden()

  // Check not already a member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', invitation.group_id)
    .eq('user_id', userId)
    .single()

  if (existingMember) badRequest('You are already a member of this group')

  const { data: member, error: memberErr } = await supabase
    .from('group_members')
    .insert({ group_id: invitation.group_id, user_id: userId, role: 'member' })
    .select()
    .single()

  if (memberErr) dbError(memberErr)

  await supabase.from('group_invitations').update({ used: true }).eq('id', invitation.id)

  return member
}
