import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }      from '../../../src/hooks/useTheme';
import { useOrderStore } from '../../../src/store/orderStore';
import { useAppStore }   from '../../../src/store/appStore';
import { orderService }  from '../../../src/services';
import { Badge, statusVariant, Skeleton } from '../../../src/components/ui';
import { spacing, typography, radius, shadows } from '../../../src/theme';
import { fmt } from '../../../src/utils';
import type { Order, OrderStatus } from '../../../src/types';

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PLACED',           label: 'Order Placed'    },
  { status: 'ACCEPTED',         label: 'Accepted'        },
  { status: 'PREPARING',        label: 'Preparing'       },
  { status: 'READY_FOR_PICKUP', label: 'Ready'           },
  { status: 'PICKED_UP',        label: 'Picked Up'       },
  { status: 'ON_THE_WAY',       label: 'On the Way'      },
  { status: 'DELIVERED',        label: 'Delivered'       },
];
const ORDER = STEPS.map((s) => s.status);

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { isMockMode } = useAppStore();
  const getOrder = useOrderStore((s) => s.getOrder);
  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockMode) {
      setOrder(getOrder(id) ?? null);
      setLoading(false);
    } else {
      orderService.get(id).then(setOrder).finally(() => setLoading(false));
    }
  }, [id]);

  // auto-advance mock order for demo feel
  useEffect(() => {
    if (!isMockMode || !order) return;
    const TERMINAL: OrderStatus[] = ['DELIVERED', 'CANCELLED', 'REJECTED', 'FAILED'];
    if (TERMINAL.includes(order.status)) return;
    const advance = useOrderStore.getState().transitionOrder;
    const idx = ORDER.indexOf(order.status);
    if (idx < ORDER.length - 1) {
      const t = setTimeout(() => {
        advance(order.id, ORDER[idx + 1] as OrderStatus);
        setOrder((o) => o ? { ...o, status: ORDER[idx + 1] as OrderStatus } : o);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [order?.status]);

  if (loading) return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <View style={{ padding: spacing[4], gap: spacing[3] }}>
        <Skeleton height={48} /><Skeleton height={200} br={12} />{[1,2,3].map((n)=><Skeleton key={n} height={48} />)}
      </View>
    </SafeAreaView>
  );
  if (!order) return null;

  const curIdx = ORDER.indexOf(order.status);
  const isTerminal = ['DELIVERED','CANCELLED','REJECTED','FAILED'].includes(order.status);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></Pressable>
        <Text style={[s.title, { color: colors.textPrimary }]}>{order.order_number}</Text>
        <Badge label={fmt.status(order.status)} variant={statusVariant(order.status)} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        {/* map placeholder */}
        <View style={[s.mapBox, { backgroundColor: colors.borderLight }]}>
          <Ionicons name="map-outline" size={48} color={colors.textTertiary} />
          <Text style={[s.mapTxt, { color: colors.textSecondary }]}>
            {order.status === 'ON_THE_WAY' ? '🛵 Rider heading your way…' : 'Live map (requires backend)'}
          </Text>
        </View>

        {/* ETA */}
        {!isTerminal && order.estimated_delivery_minutes && (
          <View style={[s.eta, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={[s.etaTxt, { color: colors.primary }]}>Estimated arrival ~{order.estimated_delivery_minutes} min</Text>
          </View>
        )}

        {/* timeline */}
        <View style={[s.section, { backgroundColor: colors.surface }, shadows.sm]}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Status</Text>
          {STEPS.map((step, i) => {
            const done = curIdx >= i;
            const active = curIdx === i;
            return (
              <View key={step.status} style={s.timeRow}>
                <View style={s.timeLeft}>
                  <View style={[s.dot, { backgroundColor: done ? colors.primary : colors.border, borderColor: active ? colors.primary : 'transparent' }]}>
                    {done && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  {i < STEPS.length - 1 && <View style={[s.line, { backgroundColor: curIdx > i ? colors.primary : colors.border }]} />}
                </View>
                <Text style={[s.stepLabel, { color: done ? colors.textPrimary : colors.textTertiary, fontWeight: active ? '700' : '400' }]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* items */}
        <View style={[s.section, { backgroundColor: colors.surface }, shadows.sm]}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Items</Text>
          {order.items.map((i) => (
            <View key={i.id} style={s.itemRow}>
              <Text style={[s.itemQty, { color: colors.primary }]}>{i.quantity}×</Text>
              <Text style={[s.itemName, { color: colors.textPrimary }]}>{i.item_name}</Text>
              <Text style={[s.itemPrice, { color: colors.textPrimary }]}>{fmt.currency(i.unit_price * i.quantity)}</Text>
            </View>
          ))}
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <View style={s.itemRow}>
            <Text style={{ flex: 1, color: colors.textSecondary }}>Total</Text>
            <Text style={[s.totalVal, { color: colors.primary }]}>{fmt.currency(order.total)}</Text>
          </View>
        </View>

        {/* review CTA */}
        {order.status === 'DELIVERED' && (
          <Pressable style={[s.reviewBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(customer)/order/history')}>
            <Ionicons name="star-outline" size={20} color="#fff" />
            <Text style={s.reviewTxt}>Rate your experience</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  title:      { flex: 1, fontSize: typography.sizes.lg, fontWeight: '700' },
  mapBox:     { height: 160, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapTxt:     { fontSize: typography.sizes.sm },
  eta:        { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[3], borderRadius: radius.md, borderWidth: 1 },
  etaTxt:     { fontSize: typography.sizes.base, fontWeight: '600' },
  section:    { borderRadius: radius.lg, padding: spacing[4], gap: spacing[2] },
  sectionTitle:{ fontSize: typography.sizes.base, fontWeight: '700', marginBottom: spacing[2] },
  timeRow:    { flexDirection: 'row', minHeight: 48 },
  timeLeft:   { width: 28, alignItems: 'center' },
  dot:        { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  line:       { flex: 1, width: 2, marginTop: 2 },
  stepLabel:  { flex: 1, paddingLeft: spacing[3], alignSelf: 'center', fontSize: typography.sizes.base },
  itemRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  itemQty:    { fontWeight: '700', width: 28 },
  itemName:   { flex: 1, fontSize: typography.sizes.base },
  itemPrice:  { fontSize: typography.sizes.base, fontWeight: '500' },
  divider:    { height: 1, marginVertical: spacing[2] },
  totalVal:   { fontSize: typography.sizes.lg, fontWeight: '700' },
  reviewBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], padding: spacing[4], borderRadius: radius.full },
  reviewTxt:  { color: '#fff', fontSize: typography.sizes.base, fontWeight: '700' },
});
