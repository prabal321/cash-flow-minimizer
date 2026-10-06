import React from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { useQuery } from '@apollo/client/react'
import { RouteProp } from '@react-navigation/native'
import { GET_GROUP_BALANCES, GET_GROUP_SETTLEMENTS } from '../graphql/queries'
import { COLORS, SPACING } from '../constants'
import type { AppStackParamList, Balance, Settlement } from '../types'

type Props = { route: RouteProp<AppStackParamList, 'Settlements'> }

export default function SettlementsScreen({ route }: Props) {
  const { groupId } = route.params

  const { data: rawBalData, loading: balLoading, refetch: refetchBal } = useQuery(GET_GROUP_BALANCES, { variables: { groupId } })
  const { data: rawSetData, loading: setLoading, refetch: refetchSet } = useQuery(GET_GROUP_SETTLEMENTS, { variables: { groupId } })
  const balData = rawBalData as any
  const setData = rawSetData as any

  const loading = balLoading || setLoading
  function refetch() { refetchBal(); refetchSet() }

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
            (setData?.groupSettlements ?? []).map((s: Settlement, i: number) => (
              <View key={`${s.from.id}-${s.to.id}`} style={[styles.settlementRow, i < (setData?.groupSettlements?.length ?? 0) - 1 && styles.divider]}>
                <View style={styles.settlementNames}>
                  <Text style={styles.settlementFrom}>{s.from.name}</Text>
                  <Text style={styles.settlementArrow}>→</Text>
                  <Text style={styles.settlementTo}>{s.to.name}</Text>
                </View>
                <Text style={styles.settlementAmount}>₹{s.amount.toFixed(2)}</Text>
              </View>
            ))
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
  settlementRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  settlementNames: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  settlementFrom: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  settlementArrow: { fontSize: 16, color: COLORS.textSecondary },
  settlementTo: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  settlementAmount: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  divider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  emptyRow: { padding: SPACING.lg, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },
})
