import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useMutation } from '@apollo/client/react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { CREATE_GROUP } from '../graphql/mutations'
import { GET_GROUPS } from '../graphql/queries'
import { COLORS, SPACING } from '../constants'
import type { AppStackParamList } from '../types'

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'CreateGroup'> }

export default function CreateGroupScreen({ navigation }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const [createGroup, { loading }] = useMutation(CREATE_GROUP, {
    refetchQueries: [{ query: GET_GROUPS }],
  })

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name is required.')
      return
    }
    try {
      const { data } = await createGroup({ variables: { input: { name: name.trim(), description: description.trim() || null } } })
      const g = (data as any).createGroup
      navigation.replace('GroupDetail', { groupId: g.id, groupName: g.name })
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to create group')
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Group Name *</Text>
        <TextInput
          style={styles.input} placeholder="e.g. Goa Trip"
          placeholderTextColor={COLORS.textSecondary}
          value={name} onChangeText={setName}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Optional description"
          placeholderTextColor={COLORS.textSecondary}
          value={description} onChangeText={setDescription}
          multiline numberOfLines={3}
        />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Group</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SPACING.lg, gap: SPACING.sm },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: SPACING.md, fontSize: 15, color: COLORS.text,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 10, padding: SPACING.md,
    alignItems: 'center', marginTop: SPACING.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
