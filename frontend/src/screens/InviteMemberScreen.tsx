import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useMutation } from '@apollo/client/react'
import { RouteProp } from '@react-navigation/native'
import { INVITE_MEMBER } from '../graphql/mutations'
import { COLORS, SPACING } from '../constants'
import type { AppStackParamList } from '../types'

type Props = { route: RouteProp<AppStackParamList, 'InviteMember'> }

export default function InviteMemberScreen({ route }: Props) {
  const { groupId } = route.params
  const [email, setEmail] = useState('')
  const [token, setToken] = useState<string | null>(null)

  const [inviteMember, { loading }] = useMutation(INVITE_MEMBER)

  async function handleInvite() {
    if (!email.trim()) { Alert.alert('Error', 'Please enter an email address.'); return }
    try {
      const { data } = await inviteMember({ variables: { input: { groupId, email: email.trim() } } })
      setToken((data as any).inviteMember.token)
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to send invitation')
    }
  }

  if (token) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successTitle}>Invitation created!</Text>
        <Text style={styles.successSubtitle}>Share this token with {email}</Text>
        <View style={styles.tokenBox}>
          <Text style={styles.tokenText} selectable>{token}</Text>
        </View>
        <Text style={styles.tokenHint}>The recipient should enter this token in the app to accept the invitation.</Text>
        <TouchableOpacity style={styles.button} onPress={() => { setToken(null); setEmail('') }}>
          <Text style={styles.buttonText}>Invite Another</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={styles.input}
          placeholder="friend@example.com"
          placeholderTextColor={COLORS.textSecondary}
          value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none"
        />
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleInvite} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Invitation</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SPACING.lg, gap: SPACING.sm },
  successContainer: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg, justifyContent: 'center', gap: SPACING.md },
  successTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  successSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  tokenBox: {
    backgroundColor: COLORS.surface, borderRadius: 10, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tokenText: { fontSize: 14, color: COLORS.text, fontFamily: 'monospace', textAlign: 'center', letterSpacing: 1 },
  tokenHint: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: SPACING.md, fontSize: 15, color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 10, padding: SPACING.md,
    alignItems: 'center', marginTop: SPACING.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
