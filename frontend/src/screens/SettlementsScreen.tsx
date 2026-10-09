import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Platform } from 'react-native'
import { useQuery, useMutation } from '@apollo/client/react'
import { RouteProp } from '@react-navigation/native'
import { GET_GROUP_BALANCES, GET_GROUP_SETTLEMENTS } from '../graphql/queries'
import { CREATE_EXPENSE } from '../graphql/mutations'
import { COLORS, SPACING } from '../constants'
import type { AppStackParamList, Balance, Settlement } from '../types'

type Props = { route: RouteProp<AppStackParamList, 'Settlements'> }

export default function SettlementsScreen({ route }: Props) {
  const { groupId } = route.params
  const [settlingKey, setSettlingKey] = useState<string | null>(null)

  const { data: rawBalData, loading: balLoading, refetch: refetchBal } = useQuery(GET_GROUP_BALANCES, { variables: { groupId } })
  const { data: rawSetData, loading: setLoading, refetch: refetchSet } = useQuery(GET_GROUP_SETTLEMENTS, { variables: { groupId } })
  const balData = rawBalData as any
  const setData = rawSetData as any

  const [createExpense] = useMutation(CREATE_EXPENSE, {
    refetchQueries: [
      { query: GET_GROUP_BALANCES, variables: { groupId } },
      { query: GET_GROUP_SETTLEMENTS, variables: { groupId } },
    ],
  })

  const loading = balLoading || setLoading
  function refetch() { refetchBal(); refetchSet() }

  async function doSettle(s: Settlement) {
    const key = `${s.from.id}-${s.to.id}`
    setSettlingKey(key)
    try {
      await createExpense({
        variables: {
          input: {
            groupId,
            description: `Settlement: ${s.from.name} → ${s.to.name}`,
            amount: s.amount,
            paidBy: s.from.id,
            splitType: 'UNEQUAL',
            participantIds: [s.from.id, s.to.id],
            splits: [
              { userId: s.from.id, amount: 0 },
              { userId: s.to.id, amount: s.amount },
            ],
          },
        },
      })
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to record settlement')
    } finally {
      setSettlingKey(null)
    }
  }

  function confirmSettle(s: Settlement) {
    if (Platform.OS === 'web') {
      if (window.confirm(`Mark ₹${s.amount.toFixed(2)} from ${s.from.name} to ${s.to.name} as settled?`)) doSettle(s)
      return
    }
    Alert.alert(
      'Settle Up',
      `Record that ${s.from.name} paid ₹${s.amount.toFixed(2)} to ${s.to.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => doSettle(s) },
      ]
    )
  }

  function balanceColor(status: string) {
    if (status === 'OWED') return COLORS.success
    if (status === 'OWES') return COLORS.error
    return COLORS.textSecondary
  }

  function balanceLabel(b: Balance) {
    if (b.status === 'OWED') return `Should receive ₹${b.netBalance.toFixed(2)}`
    if (b.status === 'OWES') return `Needs to pay ₹${Math.abs(b.netBalance).toFixed(2)}`
    return 'Settled'
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.primary} />}
    >
      {/* Net Balances */}
      <Text style={styles.sectionTitle}>Net Balances</Text>
      {balLoading && !balData ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <View style={styles.card}>
          {(balData?.groupBalances ?? []).length === 0 ? (
            <View style={styles.emptyRow}><Text style={styles.emptyText}>No balances yet</Text></View>
          ) : (
            (balData?.groupBalances ?? []).map((b: Balance, i: number) => (
              <View key={b.user.id} style={[styles.balanceRow, i < (balData?.groupBalances?.length ?? 0) - 1 && styles.divider]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{b.user.name[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{b.user.name}</Text>
                  <Text style={[styles.balanceLabel, { color: balanceColor(b.status) }]}>{balanceLabel(b)}</Text>
                </View>
                <Text style={[styles.netBalance, { color: balanceColor(b.status) }]}>
                  {b.netBalance > 0 ? '+' : ''}{b.netBalance.toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* Recommended Settlements */}
      <Text style={styles.sectionTitle}>Recommended Settlements</Text>
      {setLoading && !setData ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <View style={styles.card}>
          {(setData?.groupSettlements ?? []).length === 0 ? (
            <View style={styles.emptyRow}><Text style={styles.emptyText}>Everyone is settled up 🎉</Text></View>
          ) : (
            (setData?.groupSettlements ?? []).map((s: Settlement, i: number) => {
              const key = `${s.from.id}-${s.to.id}`
              const isSettling = settlingKey === key
              return (
                <View key={key} style={[styles.settlementRow, i < (setData?.groupSettlements?.length ?? 0) - 1 && styles.divider]}>
                  <View style={styles.settlementTop}>
                    <View style={styles.settlementNames}>
                      <Text style={styles.settlementFrom}>{s.from.name}</Text>
                      <Text style={styles.settlementArrow}>→</Text>
                      <Text style={styles.settlementTo}>{s.to.name}</Text>
                    </View>
                    <Text style={styles.settlementAmount}>₹{s.amount.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.settleBtn, isSettling && styles.settleBtnDisabled]}
                    onPress={() => confirmSettle(s)}
                    disabled={isSettling}
                  >
                    {isSettling
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.settleBtnText}>Settle Up</Text>
                    }
                  </TouchableOpacity>
                </View>
              )
            })
          )}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  userName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  balanceLabel: { fontSize: 12, marginTop: 2 },
  netBalance: { fontSize: 16, fontWeight: '700' },
  settlementRow: { padding: SPACING.md },
  settlementTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settlementNames: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  settlementFrom: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  settlementArrow: { fontSize: 16, color: COLORS.textSecondary },
  settlementTo: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  settlementAmount: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  settleBtn: {
    marginTop: SPACING.sm, backgroundColor: COLORS.primary,
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  settleBtnDisabled: { opacity: 0.6 },
  settleBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  emptyRow: { padding: SPACING.lg, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },
})
