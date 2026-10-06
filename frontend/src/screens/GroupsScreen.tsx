import React from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { useQuery } from '@apollo/client/react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { GET_GROUPS } from '../graphql/queries'
import { COLORS, SPACING } from '../constants'
import type { Group, AppStackParamList } from '../types'

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'Groups'> }

function balanceLabel(balance: number): { text: string; color: string } {
  if (balance > 0) return { text: `You are owed ₹${balance.toFixed(2)}`, color: COLORS.success }
  if (balance < 0) return { text: `You owe ₹${Math.abs(balance).toFixed(2)}`, color: COLORS.error }
  return { text: 'Settled up', color: COLORS.textSecondary }
}

export default function GroupsScreen({ navigation }: Props) {
  const { data: rawData, loading, error, refetch } = useQuery(GET_GROUPS)
  const data = rawData as any

  function renderGroup({ item }: { item: Group }) {
    const { text, color } = balanceLabel(item.myBalance)
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('GroupDetail', { groupId: item.id, groupName: item.name })}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.memberCount}>{item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}</Text>
        </View>
        <Text style={[styles.balance, { color }]}>{text}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      {loading && !data && (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      )}
      {error && (
        <View style={styles.center}><Text style={styles.errorText}>Failed to load groups</Text></View>
      )}
      {!loading && !error && (
        <FlatList
          data={data?.groups ?? []}
          keyExtractor={(g) => g.id}
          renderItem={renderGroup}
          contentContainerStyle={data?.groups?.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptySubtitle}>Create a group to start splitting expenses</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.joinBtn}
        onPress={() => navigation.navigate('AcceptInvitation')}
      >
        <Text style={styles.joinBtnText}>Join via Token</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateGroup')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, gap: SPACING.sm },
  emptyContainer: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.error, fontSize: 15 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLeft: { flex: 1, gap: 2 },
  groupName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  memberCount: { fontSize: 13, color: COLORS.textSecondary },
  balance: { fontSize: 13, fontWeight: '600', textAlign: 'right', flexShrink: 1, marginLeft: SPACING.sm },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, marginTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
  joinBtn: {
    position: 'absolute', left: SPACING.lg, bottom: SPACING.lg + 4,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 24, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  joinBtnText: { color: COLORS.text, fontWeight: '600', fontSize: 14 },
  fab: {
    position: 'absolute', right: SPACING.lg, bottom: SPACING.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
})
