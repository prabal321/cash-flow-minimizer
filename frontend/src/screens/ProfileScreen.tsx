import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native'
import { useMutation } from '@apollo/client/react'
import { useDispatch } from 'react-redux'
import { deleteItem } from '../utils/storage'
import { UPDATE_PROFILE } from '../graphql/mutations'
import { clearCredentials } from '../store/slices/authSlice'
import { apolloClient } from '../graphql/client'
import { COLORS, SPACING, STORAGE_KEY_TOKEN } from '../constants'
import { useAppSelector } from '../hooks/useAppDispatch'
import { signOut } from '../utils/supabaseAuth'

export default function ProfileScreen() {
  const dispatch = useDispatch()
  const currentUser = useAppSelector((s) => s.auth.user)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(currentUser?.name ?? '')

  if (!currentUser) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={COLORS.primary} size="large" /></View>
  }

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE)

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty.'); return }
    try {
      await updateProfile({ variables: { input: { name: name.trim() } } })
      setEditing(false)
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to update profile')
    }
  }

  async function doLogout() {
    await signOut()
    await deleteItem(STORAGE_KEY_TOKEN)
    await apolloClient.clearStore()
    dispatch(clearCredentials())
  }

  function handleLogout() {
    if (Platform.OS === 'web') {
      // Alert.alert doesn't support callbacks on web
      if (window.confirm('Are you sure you want to log out?')) {
        doLogout()
      }
      return
    }
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: doLogout },
    ])
  }

  const initials = (currentUser?.name ?? '?')[0].toUpperCase()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Name</Text>
          {editing ? (
            <TextInput
              style={styles.input} value={name} onChangeText={setName}
              autoFocus placeholder="Your name" placeholderTextColor={COLORS.textSecondary}
            />
          ) : (
            <Text style={styles.fieldValue}>{currentUser?.name}</Text>
          )}
        </View>
        <View style={[styles.fieldRow, styles.divider]}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{currentUser?.email}</Text>
        </View>
      </View>

      {editing ? (
        <View style={styles.row}>
          <TouchableOpacity style={[styles.button, styles.buttonOutline, { flex: 1 }]} onPress={() => { setEditing(false); setName(currentUser?.name ?? '') }}>
            <Text style={[styles.buttonText, { color: COLORS.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { flex: 1 }, loading && styles.buttonDisabled]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => setEditing(true)}>
          <Text style={[styles.buttonText, { color: COLORS.text }]}>Edit Name</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.button, styles.buttonDanger]} onPress={handleLogout}>
        <Text style={[styles.buttonText, { color: COLORS.error }]}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, gap: SPACING.md },
  avatarContainer: { alignItems: 'center', marginVertical: SPACING.lg },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  fieldRow: { padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  fieldValue: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  input: {
    flex: 1, marginLeft: SPACING.sm, fontSize: 15, color: COLORS.text,
    borderBottomWidth: 1, borderBottomColor: COLORS.primary, paddingVertical: 2,
  },
  divider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  row: { flexDirection: 'row', gap: SPACING.sm },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 10, padding: SPACING.md, alignItems: 'center',
  },
  buttonOutline: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  buttonDanger: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
