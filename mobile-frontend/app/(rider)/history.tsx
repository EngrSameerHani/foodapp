import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme }     from '../../src/hooks/useTheme';
import { useOrderStore } from '../../src/store/orderStore';
import { Empty } from '../../src/components/ui';
import { spacing, typography, radius, shadows } from '../../src/theme';
import { fmt } from '../../src/utils';
import { MOCK_RIDER_DELIVERIES } from '../../src/data';

export default function RiderHistory() {
  const { colors } = useTheme();
  const deliveries = MOCK_RIDER_DELIVERIES;
  const totalEarnings = deliveries.reduce((s, o) => s + o.delivery_fee, 0);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Delivery History</Text>
      </View>

      <View style={[s.earningsCard, { backgroundColor: colors.primary }]}>
        <Text style={s.earningsLabel}>Total Earnings</Text>
        <Text style={s.earningsValue}>{fmt.currency(totalEarnings)}</Text>
        <Text style={s.earningsCount}>{deliveries.length} deliveries</Text>
      </View>

      <FlatList data={deliveries} keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
        ListEmptyComponent={<Empty icon="bicycle-outline" title="No deliveries yet" />}
        renderItem={({ item: order }) => (
          <View style={[s.card, { backgroundColor: colors.surface }, shadows.sm]}>
            <View style={s.row}>
              <Text style={[s.orderNum, { color: colors.textPrimary }]}>{order.order_number}</Text>
              <Text style={[s.earning, { color: colors.success }]}>+{fmt.currency(order.delivery_fee)}</Text>
            </View>
            <Text style={[s.date, { color: colors.textSecondary }]}>{fmt.date(order.created_at)}</Text>
            {order.delivery_address_snapshot && (
              <Text style={[s.addr, { color: colors.textSecondary }]} numberOfLines={1}>
                📍 {order.delivery_address_snapshot.full_address}
              </Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1 },
  header:         { padding: spacing[4] },
  title:          { fontSize: typography.sizes.xl, fontWeight: '700' },
  earningsCard:   { margin: spacing[4], borderRadius: radius.lg, padding: spacing[5], alignItems: 'center' },
  earningsLabel:  { color: 'rgba(255,255,255,0.8)', fontSize: typography.sizes.sm, fontWeight: '500' },
  earningsValue:  { color: '#fff', fontSize: typography.sizes['3xl'], fontWeight: '800', marginTop: 4 },
  earningsCount:  { color: 'rgba(255,255,255,0.7)', fontSize: typography.sizes.sm, marginTop: 4 },
  card:           { borderRadius: radius.lg, padding: spacing[4], gap: spacing[1] },
  row:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderNum:       { fontSize: typography.sizes.base, fontWeight: '700' },
  earning:        { fontSize: typography.sizes.lg, fontWeight: '700' },
  date:           { fontSize: typography.sizes.sm },
  addr:           { fontSize: typography.sizes.sm, marginTop: 2 },
});
