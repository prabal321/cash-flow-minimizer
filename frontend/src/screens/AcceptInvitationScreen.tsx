import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { useMutation } from '@apollo/client/react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ACCEPT_INVITATION } from '../graphql/mutations'
import { GET_GROUPS } from '../graphql/queries'
import { COLORS, SPACING } from '../constants'
import type { AppStackParamList } from '../types'

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'AcceptInvitation'> }

export default function AcceptInvitationScreen({ navigation }: Props) {
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [acceptInvitation, { loading }] = useMutation(ACCEPT_INVITATION, {
    refetchQueries: [{ query: GET_GROUPS }],
  })

  async function handleAccept() {
    const trimmed = token.trim()
    if (!trimmed) { setError('Please enter the invitation token.'); return }
    setError(null)
    try {
      const { data } = await acceptInvitation({ variables: { token: trimmed } })
      const member = (data as any).acceptInvitation
      setSuccess(`You joined the group as ${member.role.toLowerCase()}!`)
      setTimeout(() => navigation.navigate('Groups'), 1500)
    } catch (err: any) {
      setError(err.message ?? 'Invalid or expired token.')
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Join a Group</Text>
        <Text style={styles.subtitle}>
          Ask the group owner to invite you. They will get a token — paste it below to join.
        </Text>

        {error ? (
          <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View>
        ) : null}

        {success ? (
          <View style={styles.successBanner}><Text style={styles.successText}>{success}</Text></View>
        ) : null}

        <Text style={styles.label}>Invitation Token</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste token here (e.g. 67bc612b-7be5-...)"
          placeholderTextColor={COLORS.textSecondary}
          value={token}
          onChangeText={(v) => { setToken(v); setError(null) }}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Join Group</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.xl, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: SPACING.md, fontSize: 14, color: COLORS.text,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 10, padding: SPACING.md,
    alignItems: 'center', marginTop: SPACING.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  errorBanner: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 10, padding: SPACING.md, marginBottom: SPACING.md,
  },
  errorText: { color: COLORS.error, fontSize: 14 },
  successBanner: {
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0',
    borderRadius: 10, padding: SPACING.md, marginBottom: SPACING.md,
  },
  successText: { color: COLORS.success, fontSize: 14, textAlign: 'center' },
})
