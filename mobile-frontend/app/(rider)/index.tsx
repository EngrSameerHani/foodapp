import React, { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }      from '../../src/hooks/useTheme';
import { useOrderStore } from '../../src/store/orderStore';
import { useAppStore }   from '../../src/store/appStore';
import { riderService }  from '../../src/services';
import { Button, Badge, statusVariant, Toast } from '../../src/components/ui';
import { spacing, typography, radius, shadows } from '../../src/theme';
import { fmt } from '../../src/utils';
import type { Order, OrderStatus } from '../../src/types';

export default function RiderDeliver() {
  const { colors } = useTheme();
  const { isMockMode } = useAppStore();
  const { restaurantOrders, riderOrders, transitionOrder } = useOrderStore();
  const [isOnline, setIsOnline] = useState(false);
  const locInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeOrder: Order | undefined = [...restaurantOrders, ...riderOrders].find((o) =>
    ['READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY'].includes(o.status) && o.rider_id === 'user-rider-001',
  );

  const toggleOnline = async (v: boolean) => {
    setIsOnline(v);
    await riderService.setStatus(v);
    if (v) {
      locInterval.current = setInterval(async () => {
        await riderService.updateLocation(37.7749, -122.4194);
      }, 10_000);
      Toast.show('You are now online', 'success');
    } else {
      if (locInterval.current) clearInterval(locInterval.current);
      Toast.show('You are now offline', 'info');
    }
  };

  useEffect(() => () => { if (locInterval.current) clearInterval(locInterval.current); }, []);

  const advance = (order: Order) => {
    const map: Record<string, OrderStatus> = {
      READY_FOR_PICKUP: 'PICKED_UP',
      PICKED_UP:        'ON_THE_WAY',
      ON_THE_WAY:       'DELIVERED',
    };
    const next = map[order.status];
    if (next) {
      transitionOrder(order.id, next);
      Toast.show(`Status updated: ${fmt.status(next)}`, 'success');
    }
  };

  const navigate = (addr: string) => {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(addr)}`);
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      {/* online toggle */}
      <View style={[s.header, { backgroundColor: colors.surface }]}>
        <View>
          <Text style={[s.title, { color: colors.textPrimary }]}>{isOnline ? 'You are online' : 'You are offline'}</Text>
          <Text style={[s.sub, { color: colors.textSecondary }]}>{isOnline ? 'Waiting for deliveries…' : 'Go online to receive orders'}</Text>
        </View>
        <Switch value={isOnline} onValueChange={toggleOnline}
          trackColor={{ false: colors.border, true: colors.primary + '66' }}
          thumbColor={isOnline ? colors.primary : colors.textTertiary} />
      </View>

      {/* active delivery */}
      {activeOrder ? (
        <View style={[s.deliveryCard, { backgroundColor: colors.surface }, shadows.md]}>
          <View style={s.cardRow}>
            <Text style={[s.orderNum, { color: colors.textPrimary }]}>{activeOrder.order_number}</Text>
            <Badge label={fmt.status(activeOrder.status)} variant={statusVariant(activeOrder.status)} />
          </View>
          <Text style={[s.earning, { color: colors.textPrimary }]}>Earning: {fmt.currency(activeOrder.delivery_fee)}</Text>

          {activeOrder.status === 'READY_FOR_PICKUP' && (
            <>
              <Text style={[s.phase, { color: colors.textSecondary }]}>📍 Head to restaurant</Text>
              <Button title="Navigate to Restaurant" variant="outline" size="sm"
                onPress={() => navigate(activeOrder.restaurant_name ?? 'Restaurant')} />
              <Button title="Mark as Picked Up" onPress={() => advance(activeOrder)} />
            </>
          )}
          {activeOrder.status === 'PICKED_UP' && (
            <>
              <Text style={[s.phase, { color: colors.textSecondary }]}>🏠 Head to customer</Text>
              <Button title="Navigate to Customer" variant="outline" size="sm"
                onPress={() => navigate(activeOrder.delivery_address_snapshot?.full_address ?? 'Customer')} />
              <Button title="On the Way" onPress={() => advance(activeOrder)} />
            </>
          )}
          {activeOrder.status === 'ON_THE_WAY' && (
            <Button title="✓ Mark Delivered" onPress={() => advance(activeOrder)} />
          )}
        </View>
      ) : (
        <View style={s.waiting}>
          {isOnline ? (
            <>
              <Ionicons name="radio-outline" size={64} color={colors.primary} />
              <Text style={[s.waitTitle, { color: colors.textPrimary }]}>Waiting for an order…</Text>
              <Text style={[s.waitSub, { color: colors.textSecondary }]}>You'll be notified when a delivery is assigned.</Text>
            </>
          ) : (
            <>
              <Ionicons name="moon-outline" size={64} color={colors.textTertiary} />
              <Text style={[s.waitTitle, { color: colors.textTertiary }]}>Go online to start earning</Text>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4], marginBottom: spacing[3] },
  title:        { fontSize: typography.sizes.lg, fontWeight: '700' },
  sub:          { fontSize: typography.sizes.sm, marginTop: 2 },
  deliveryCard: { margin: spacing[4], borderRadius: radius.lg, padding: spacing[4], gap: spacing[3] },
  cardRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderNum:     { fontSize: typography.sizes.base, fontWeight: '700' },
  earning:      { fontSize: typography.sizes.lg, fontWeight: '700', textAlign: 'center' },
  phase:        { fontSize: typography.sizes.base },
  waiting:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[8] },
  waitTitle:    { fontSize: typography.sizes.xl, fontWeight: '700', textAlign: 'center' },
  waitSub:      { fontSize: typography.sizes.base, textAlign: 'center', lineHeight: 22 },
});
