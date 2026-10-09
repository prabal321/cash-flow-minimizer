import React from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useQuery } from '@apollo/client/react'
import { RouteProp } from '@react-navigation/native'
import { GET_EXPENSE } from '../graphql/queries'
import { COLORS, SPACING } from '../constants'
import type { AppStackParamList } from '../types'

type Props = { route: RouteProp<AppStackParamList, 'ExpenseDetail'> }

export default function ExpenseDetailScreen({ route }: Props) {
  const { expenseId } = route.params
  const { data: rawData, loading, error } = useQuery(GET_EXPENSE, { variables: { id: expenseId } })
  const data = rawData as any

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
  if (error || !data?.expense) return <View style={styles.center}><Text style={styles.errorText}>Failed to load expense</Text></View>

  const expense = data.expense

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.description}>{expense.description}</Text>
      <Text style={styles.amount}>₹{expense.amount.toFixed(2)}</Text>
      <Text style={styles.paidBy}>Paid by <Text style={styles.paidByName}>{expense.paidBy.name}</Text></Text>
      <Text style={styles.date}>{new Date(expense.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>

      <View style={styles.badgeRow}>
        <View style={[styles.badge, expense.splitType === 'EQUAL' ? styles.badgeEqual : styles.badgeUnequal]}>
          <Text style={[styles.badgeText, expense.splitType === 'EQUAL' ? styles.badgeEqualText : styles.badgeUnequalText]}>
            {expense.splitType === 'EQUAL' ? 'Equal Split' : 'Unequal Split'}
          </Text>
        </View>
        <Text style={styles.splitCount}>{expense.splits.length} people</Text>
      </View>

      <Text style={styles.sectionTitle}>Individual shares</Text>
      <View style={styles.card}>
        {expense.splits.map((split: any, i: number) => (
          <View key={split.id} style={[styles.splitRow, i < expense.splits.length - 1 && styles.divider]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{split.user.name[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.splitName}>{split.user.name}</Text>
            <Text style={styles.splitAmount}>₹{split.amount.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, gap: SPACING.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.error, fontSize: 15 },
  description: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  amount: { fontSize: 36, fontWeight: '800', color: COLORS.primary },
  paidBy: { fontSize: 15, color: COLORS.textSecondary },
  paidByName: { fontWeight: '600', color: COLORS.text },
  date: { fontSize: 13, color: COLORS.textSecondary },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeEqual: { backgroundColor: '#EFF6FF' },
  badgeUnequal: { backgroundColor: '#FFF7ED' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeEqualText: { color: '#1D4ED8' },
  badgeUnequalText: { color: '#C2410C' },
  splitCount: { fontSize: 13, color: COLORS.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: SPACING.sm },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  splitRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  splitName: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500' },
  splitAmount: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  divider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
})
