import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { signUp } from '../utils/supabaseAuth'
import { COLORS, SPACING } from '../constants'
import type { RootStackParamList } from '../types'

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'SignUp'> }

export default function SignUpScreen({ navigation }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await signUp(email.trim(), password, name.trim())
      // Navigate to Login with a success message
      navigation.navigate('Login', {
        message: 'Account created! Please sign in.',
      } as any)
    } catch (err: any) {
      setError(err.message ?? 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join and start splitting expenses</Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input} placeholder="Your name"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={(v) => { setName(v); setError(null) }}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input} placeholder="you@example.com"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={(v) => { setEmail(v); setError(null) }}
            keyboardType="email-address" autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input} placeholder="At least 6 characters"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={(v) => { setPassword(v); setError(null) }}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Sign In</Text>
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
