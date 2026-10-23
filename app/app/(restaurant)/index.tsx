import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Badge, statusBadgeVariant, EmptyState, Skeleton } from '@/components/ui';
import { Button } from '@/components/ui';
import { spacing, typography, borderRadius, shadows } from '@/theme';
import { formatCurrency, formatTime, formatOrderStatus } from '@/utils/format';
import type { Order } from '@/types/api';

type Tab = 'New' | 'Active' | 'History';

const TAB_STATUSES: Record<Tab, string[]> = {
  New: ['PLACED'],
  Active: ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'],
  History: ['DELIVERED', 'REJECTED', 'CANCELLED', 'FAILED'],
};

const NEXT_STATUS: Record<string, string> = {
  ACCEPTED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
};

export default function RestaurantOrdersScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('New');
  const { data, isLoading, refetch } = useOrders();
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus();

  const all = data?.pages.flatMap((p) => p.data) ?? [];
  const filtered = all.filter((o) => TAB_STATUSES[tab].includes(o.status));

  const accept = (order: Order) =>
    updateStatus({ id: order.id, status: 'ACCEPTED' }, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Order accepted' }),
    });

  const reject = (order: Order) =>
    updateStatus({ id: order.id, status: 'REJECTED', reason: 'Currently unavailable' }, {
      onSuccess: () => Toast.show({ type: 'info', text1: 'Order rejected' }),
    });

  const advance = (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (next) updateStatus({ id: order.id, status: next }, {
      onSuccess: () => Toast.show({ type: 'success', text1: `Status → ${formatOrderStatus(next)}` }),
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Orders</Text>
        <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
        <Text style={[styles.onlineText, { color: colors.success }]}>Open</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['New', 'Active', 'History'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.textSecondary }]}>{t}</Text>
            {t === 'New' && all.filter((o) => o.status === 'PLACED').length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>{all.filter((o) => o.status === 'PLACED').length}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {isLoading && (
        <View style={{ padding: spacing[4], gap: 12 }}>
          {[1, 2].map((n) => <Skeleton key={n} height={120} borderRadius={12} />)}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={!isLoading ? <EmptyState icon="receipt-outline" title={`No ${tab.toLowerCase()} orders`} /> : null}
        renderItem={({ item: order }) => (
          <View style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.orderNum, { color: colors.textPrimary }]}>{order.order_number}</Text>
              <Badge label={formatOrderStatus(order.status)} variant={statusBadgeVariant(order.status)} />
            </View>
            <Text style={[styles.time, { color: colors.textSecondary }]}>{formatTime(order.created_at)}</Text>
            <Text style={[styles.items, { color: colors.textSecondary }]} numberOfLines={2}>
              {order.items.map((i) => `${i.quantity}× ${i.item_name}`).join(', ')}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.total, { color: colors.textPrimary }]}>{formatCurrency(order.total)}</Text>
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                {order.status === 'PLACED' && (
                  <>
                    <Button title="Reject" onPress={() => reject(order)} variant="danger" size="sm" loading={isPending} />
                    <Button title="Accept" onPress={() => accept(order)} size="sm" loading={isPending} />
                  </>
                )}
                {(order.status === 'ACCEPTED' || order.status === 'PREPARING') && (
                  <Button
                    title={order.status === 'ACCEPTED' ? 'Start Preparing' : 'Mark Ready'}
                    onPress={() => advance(order)}
                    size="sm"
                    loading={isPending}
                  />
                )}
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[4] },
  title: { flex: 1, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  onlineText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing[3] },
  tabText: { fontSize: typography.sizes.base, fontWeight: typography.weights.medium },
  badge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  card: { borderRadius: borderRadius.lg, padding: spacing[4], gap: spacing[2] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderNum: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold },
  time: { fontSize: typography.sizes.sm },
  items: { fontSize: typography.sizes.sm, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[2] },
  total: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
});
