import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useDispatch } from 'react-redux'
import { signIn } from '../utils/supabaseAuth'
import { saveItem } from '../utils/storage'
import { setCredentials } from '../store/slices/authSlice'
import { apolloClient } from '../graphql/client'
import { GET_ME } from '../graphql/queries'
import { COLORS, SPACING, STORAGE_KEY_TOKEN } from '../constants'
import type { RootStackParamList } from '../types'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>
  route?: { params?: { message?: string } }
}

export default function LoginScreen({ navigation, route }: Props) {
  const dispatch = useDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const successMessage = (route as any)?.params?.message

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const { session } = await signIn(email.trim(), password)
      if (!session) throw new Error('No session returned. Please try again.')

      await saveItem(STORAGE_KEY_TOKEN, session.access_token)

      const { data } = await apolloClient.query({ query: GET_ME, fetchPolicy: 'network-only' })
      dispatch(setCredentials({ token: session.access_token, user: (data as any).me }))
    } catch (err: any) {
      const msg = err?.message ?? 'Sign in failed. Check your credentials and try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {successMessage ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={(v) => { setEmail(v); setError(null) }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={(v) => { setPassword(v); setError(null) }}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.link}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs, marginBottom: SPACING.lg },
  errorBanner: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 10, padding: SPACING.md, marginBottom: SPACING.md,
  },
  errorText: { color: COLORS.error, fontSize: 14 },
  successBanner: {
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0',
    borderRadius: 10, padding: SPACING.md, marginBottom: SPACING.md,
  },
  successText: { color: COLORS.success, fontSize: 14 },
  form: { gap: SPACING.sm },
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
  link: { marginTop: SPACING.xl, alignItems: 'center' },
  linkText: { color: COLORS.textSecondary, fontSize: 14 },
  linkBold: { color: COLORS.primary, fontWeight: '600' },
})
