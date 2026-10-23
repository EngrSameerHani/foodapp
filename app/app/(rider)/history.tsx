import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { riderApi } from '@/services/rider';
import { useTheme } from '@/hooks/useTheme';
import { EmptyState, Skeleton } from '@/components/ui';
import { spacing, typography, borderRadius, shadows } from '@/theme';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Order } from '@/types/api';

export default function RiderHistoryScreen() {
  const { colors } = useTheme();
  const { data, isLoading } = useQuery({
    queryKey: ['rider-deliveries'],
    queryFn: () => riderApi.getDeliveries().then((r) => r.data),
  });

  const deliveries: Order[] = (data?.data as Order[]) ?? [];
  const totalEarnings: number = (data?.total_earnings as number) ?? 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Delivery History</Text>
      </View>

      {/* Earnings summary */}
      <View style={[styles.earningsCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsValue}>{formatCurrency(totalEarnings)}</Text>
      </View>

      {isLoading && (
        <View style={{ padding: spacing[4], gap: 10 }}>
          {[1, 2, 3].map((n) => <Skeleton key={n} height={80} borderRadius={10} />)}
        </View>
      )}

      <FlatList
        data={deliveries}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
        ListEmptyComponent={!isLoading ? <EmptyState icon="bicycle-outline" title="No deliveries yet" /> : null}
        renderItem={({ item: order }) => (
          <View style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}>
            <View style={styles.row}>
              <Text style={[styles.orderNum, { color: colors.textPrimary }]}>{order.order_number}</Text>
              <Text style={[styles.earning, { color: colors.success }]}>+{formatCurrency(order.delivery_fee)}</Text>
            </View>
            <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(order.created_at)}</Text>
            {order.delivery_address_snapshot && (
              <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>
                📍 {order.delivery_address_snapshot.full_address}
              </Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing[4] },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  earningsCard: { margin: spacing[4], borderRadius: borderRadius.lg, padding: spacing[5], alignItems: 'center' },
  earningsLabel: { color: 'rgba(255,255,255,0.8)', fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  earningsValue: { color: '#fff', fontSize: typography.sizes['3xl'], fontWeight: typography.weights.extrabold, marginTop: 4 },
  card: { borderRadius: borderRadius.lg, padding: spacing[4], gap: spacing[1] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderNum: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold },
  earning: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  date: { fontSize: typography.sizes.sm },
  address: { fontSize: typography.sizes.sm, marginTop: 2 },
});
