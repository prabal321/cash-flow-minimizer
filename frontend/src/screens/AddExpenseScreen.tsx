import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { useQuery, useMutation } from '@apollo/client/react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { GET_GROUP } from '../graphql/queries'
import { CREATE_EXPENSE } from '../graphql/mutations'
import { COLORS, SPACING } from '../constants'
import { useAppSelector } from '../hooks/useAppDispatch'
import type { AppStackParamList } from '../types'

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'AddExpense'>
  route: RouteProp<AppStackParamList, 'AddExpense'>
}

export default function AddExpenseScreen({ navigation, route }: Props) {
  const { groupId } = route.params
  const currentUser = useAppSelector((s) => s.auth.user)

  const { data: rawGroupData } = useQuery(GET_GROUP, { variables: { id: groupId } })
  const data = rawGroupData as any
  const members: any[] = data?.group?.members ?? []

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidById, setPaidById] = useState<string>(currentUser?.id ?? '')
  const [splitType, setSplitType] = useState<'EQUAL' | 'UNEQUAL'>('EQUAL')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [unequalAmounts, setUnequalAmounts] = useState<Record<string, string>>({})

  // Pre-select all members on load
  useEffect(() => {
    if (members.length && selectedIds.length === 0) {
      setSelectedIds(members.map((m) => m.user.id))
    }
  }, [members])

  const [createExpense, { loading }] = useMutation(CREATE_EXPENSE, {
    refetchQueries: [{ query: GET_GROUP, variables: { id: groupId } }],
  })

  function toggleParticipant(userId: string) {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const totalAmount = parseFloat(amount) || 0
  const perPerson = selectedIds.length > 0 ? totalAmount / selectedIds.length : 0
  const unequalTotal = Object.entries(unequalAmounts)
    .filter(([id]) => selectedIds.includes(id))
    .reduce((sum, [, v]) => sum + (parseFloat(v) || 0), 0)

  async function handleSubmit() {
    if (!description.trim()) { Alert.alert('Error', 'Description is required.'); return }
    if (totalAmount <= 0) { Alert.alert('Error', 'Amount must be greater than 0.'); return }
    if (selectedIds.length === 0) { Alert.alert('Error', 'Select at least one participant.'); return }
    if (!paidById) { Alert.alert('Error', 'Select who paid.'); return }

    if (splitType === 'UNEQUAL') {
      const diff = Math.abs(unequalTotal - totalAmount)
      if (diff > 0.01) {
        Alert.alert('Error', `Split amounts (₹${unequalTotal.toFixed(2)}) must equal total (₹${totalAmount.toFixed(2)}).`)
        return
      }
    }

    const input: any = {
      groupId,
      description: description.trim(),
      amount: totalAmount,
      paidBy: paidById,
      splitType,
      participantIds: selectedIds,
    }

    if (splitType === 'UNEQUAL') {
      input.splits = selectedIds.map((id) => ({ userId: id, amount: parseFloat(unequalAmounts[id] ?? '0') || 0 }))
    }

    try {
      await createExpense({ variables: { input } })
      navigation.goBack()
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to create expense')
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.input} placeholder="e.g. Dinner"
          placeholderTextColor={COLORS.textSecondary}
          value={description} onChangeText={setDescription}
        />

        <Text style={styles.label}>Amount (₹) *</Text>
        <TextInput
          style={styles.input} placeholder="0.00"
          placeholderTextColor={COLORS.textSecondary}
          value={amount} onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Paid By *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
          {members.map((m: any) => (
            <TouchableOpacity
              key={m.user.id}
              style={[styles.chip, paidById === m.user.id && styles.chipSelected]}
              onPress={() => setPaidById(m.user.id)}
            >
              <Text style={[styles.chipText, paidById === m.user.id && styles.chipTextSelected]}>
                {m.user.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Split Type</Text>
        <View style={styles.segmented}>
          {(['EQUAL', 'UNEQUAL'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.segment, splitType === t && styles.segmentActive]}
              onPress={() => setSplitType(t)}
            >
              <Text style={[styles.segmentText, splitType === t && styles.segmentTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Participants</Text>
        {members.map((m: any) => (
          <View key={m.user.id} style={styles.participantRow}>
            <TouchableOpacity
              style={styles.participantLeft}
              onPress={() => toggleParticipant(m.user.id)}
            >
              <View style={[styles.checkbox, selectedIds.includes(m.user.id) && styles.checkboxChecked]}>
                {selectedIds.includes(m.user.id) && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.participantName}>{m.user.name}</Text>
            </TouchableOpacity>

            {splitType === 'EQUAL' && selectedIds.includes(m.user.id) && totalAmount > 0 && (
              <Text style={styles.equalShare}>₹{perPerson.toFixed(2)}</Text>
            )}

            {splitType === 'UNEQUAL' && selectedIds.includes(m.user.id) && (
              <TextInput
                style={styles.unequalInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.textSecondary}
                value={unequalAmounts[m.user.id] ?? ''}
                onChangeText={(v) => setUnequalAmounts((prev) => ({ ...prev, [m.user.id]: v }))}
                keyboardType="decimal-pad"
              />
            )}
          </View>
        ))}

        {splitType === 'UNEQUAL' && totalAmount > 0 && (
          <View style={[styles.totalCheck, Math.abs(unequalTotal - totalAmount) < 0.01 && styles.totalCheckOk]}>
            <Text style={styles.totalCheckText}>
              Entered: ₹{unequalTotal.toFixed(2)} / Total: ₹{totalAmount.toFixed(2)}
              {Math.abs(unequalTotal - totalAmount) < 0.01 ? '  ✓' : '  ✗'}
            </Text>
          </View>
        )}

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Expense</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SPACING.lg, gap: SPACING.sm },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: SPACING.xs },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: SPACING.md, fontSize: 15, color: COLORS.text,
  },
  pickerRow: { flexGrow: 0 },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, marginRight: SPACING.sm,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, color: COLORS.text },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  segmented: { flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  segment: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', backgroundColor: COLORS.surface },
  segmentActive: { backgroundColor: COLORS.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  segmentTextActive: { color: '#fff' },
  participantRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  participantLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  participantName: { fontSize: 15, color: COLORS.text },
  equalShare: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  unequalInput: {
    width: 90, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    padding: SPACING.sm, fontSize: 14, color: COLORS.text,
    backgroundColor: COLORS.surface, textAlign: 'right',
  },
  totalCheck: {
    padding: SPACING.sm, borderRadius: 8,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: COLORS.error,
  },
  totalCheckOk: { backgroundColor: '#F0FDF4', borderColor: COLORS.success },
  totalCheckText: { fontSize: 13, color: COLORS.text, textAlign: 'center', fontWeight: '500' },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 10, padding: SPACING.md,
    alignItems: 'center', marginTop: SPACING.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
