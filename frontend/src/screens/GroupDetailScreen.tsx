import React from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Platform,
} from 'react-native'
import { useQuery, useMutation } from '@apollo/client/react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { GET_GROUP } from '../graphql/queries'
import { DELETE_EXPENSE } from '../graphql/mutations'
import { COLORS, SPACING } from '../constants'
import { useAppSelector } from '../hooks/useAppDispatch'
import type { AppStackParamList, Expense } from '../types'

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, 'GroupDetail'>
  route: RouteProp<AppStackParamList, 'GroupDetail'>
}

export default function GroupDetailScreen({ navigation, route }: Props) {
  const { groupId, groupName } = route.params
  const currentUser = useAppSelector((s) => s.auth.user)
  const { data: rawData, loading, error, refetch } = useQuery(GET_GROUP, { variables: { id: groupId } })
  const data = rawData as any
  const [deleteExpense] = useMutation(DELETE_EXPENSE, { refetchQueries: [{ query: GET_GROUP, variables: { id: groupId } }] })

  const group = data?.group

  async function doDelete(expense: Expense) {
    try {
      await deleteExpense({ variables: { id: expense.id } })
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  function confirmDelete(expense: Expense) {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${expense.description}"?`)) doDelete(expense)
      return
    }
    Alert.alert('Delete Expense', `Delete "${expense.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => doDelete(expense) },
    ])
  }

  if (loading && !group) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
  }
  if (error || !group) {
    return <View style={styles.center}><Text style={styles.errorText}>Failed to load group</Text></View>
  }

  const myBalance = group.myBalance
  const balanceText = myBalance > 0
    ? `You are owed ₹${myBalance.toFixed(2)}`
    : myBalance < 0
    ? `You owe ₹${Math.abs(myBalance).toFixed(2)}`
    : 'Settled up'
  const balanceColor = myBalance > 0 ? COLORS.success : myBalance < 0 ? COLORS.error : COLORS.textSecondary

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.primary} />}
    >
      {/* Balance banner */}
      <View style={[styles.balanceBanner, { borderLeftColor: balanceColor }]}>
        <Text style={styles.balanceBannerLabel}>Your balance</Text>
        <Text style={[styles.balanceBannerValue, { color: balanceColor }]}>{balanceText}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('AddExpense', { groupId })}
        >
          <Text style={styles.actionBtnText}>+ Add Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOutline]}
          onPress={() => navigation.navigate('Settlements', { groupId })}
        >
          <Text style={[styles.actionBtnText, styles.actionBtnOutlineText]}>Settlements</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOutline]}
          onPress={() => navigation.navigate('InviteMember', { groupId })}
        >
          <Text style={[styles.actionBtnText, styles.actionBtnOutlineText]}>Invite</Text>
        </TouchableOpacity>
      </View>

      {/* Members */}
      <Text style={styles.sectionTitle}>Members ({group.memberCount})</Text>
      <View style={styles.card}>
        {group.members.map((m: any, i: number) => (
          <View key={m.id} style={[styles.memberRow, i < group.members.length - 1 && styles.divider]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{m.user.name[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{m.user.name}{m.user.id === currentUser?.id ? ' (You)' : ''}</Text>
              <Text style={styles.memberRole}>{m.role}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Expenses */}
      <Text style={styles.sectionTitle}>Expenses ({group.expenses.length})</Text>
      {group.expenses.length === 0 ? (
        <View style={styles.emptyExpenses}>
          <Text style={styles.emptyText}>No expenses yet. Add the first one!</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {group.expenses.map((e: Expense, i: number) => (
            <TouchableOpacity
              key={e.id}
              style={[styles.expenseRow, i < group.expenses.length - 1 && styles.divider]}
              onPress={() => navigation.navigate('ExpenseDetail', { expenseId: e.id, groupId })}
              onLongPress={() => confirmDelete(e)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseDesc}>{e.description}</Text>
                <Text style={styles.expensePaidBy}>Paid by {(e as any).paidBy.name}</Text>
              </View>
              <Text style={styles.expenseAmount}>₹{e.amount.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.error, fontSize: 15 },
  balanceBanner: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md,
    borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  balanceBannerLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  balanceBannerValue: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  actions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: SPACING.sm, alignItems: 'center',
  },
  actionBtnOutline: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  actionBtnOutlineText: { color: COLORS.text },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  memberName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  memberRole: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  expenseDesc: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  expensePaidBy: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  divider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  emptyExpenses: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.xl, alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
})
