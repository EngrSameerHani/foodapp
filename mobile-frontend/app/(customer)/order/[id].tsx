import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }      from '../../../src/hooks/useTheme';
import { useOrderStore } from '../../../src/store/orderStore';
import { useAppStore }   from '../../../src/store/appStore';
import { orderService }  from '../../../src/services';
import { Skeleton }      from '../../../src/components/ui';
import { palette, spacing, radius, typography, shadows } from '../../../src/theme';
import { fmt } from '../../../src/utils';
import type { Order, OrderStatus } from '../../../src/types';

const STEPS: { status: OrderStatus; label: string; time?: string }[] = [
  { status: 'PLACED',           label: 'Order Confirmed' },
  { status: 'ACCEPTED',         label: 'Accepted by Restaurant' },
  { status: 'PREPARING',        label: 'Preparing Your Food' },
  { status: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { status: 'PICKED_UP',        label: 'Rider Picked Up' },
  { status: 'ON_THE_WAY',       label: 'Out for Delivery' },
  { status: 'DELIVERED',        label: 'Delivered' },
];
const ORDER = STEPS.map((s) => s.status);

export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { isMockMode } = useAppStore();
  const getOrder = useOrderStore((s) => s.getOrder);
  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockMode) { setOrder(getOrder(id) ?? null); setLoading(false); }
    else { orderService.get(id).then(setOrder).finally(() => setLoading(false)); }
  }, [id]);

  // Auto-advance in mock mode for demo
  useEffect(() => {
    if (!isMockMode || !order) return;
    const TERMINAL: OrderStatus[] = ['DELIVERED','CANCELLED','REJECTED','FAILED'];
    if (TERMINAL.includes(order.status)) return;
    const idx = ORDER.indexOf(order.status);
    if (idx < ORDER.length - 1) {
      const advance = useOrderStore.getState().transitionOrder;
      const t = setTimeout(() => {
        advance(order.id, ORDER[idx + 1] as OrderStatus);
        setOrder((o) => o ? { ...o, status: ORDER[idx + 1] as OrderStatus } : o);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [order?.status]);

  if (loading) return (
    <SafeAreaView style={[st.root, { backgroundColor: colors.background }]}>
      <View style={{ padding: spacing[4], gap: spacing[3] }}>
        <Skeleton height={48} /><Skeleton height={200} br={16} />
        {[1,2,3].map((n)=><Skeleton key={n} height={56}/>)}
      </View>
    </SafeAreaView>
  );
  if (!order) return null;

  const curIdx = ORDER.indexOf(order.status);
  const isTerminal = ['DELIVERED','CANCELLED','REJECTED','FAILED'].includes(order.status);
  const isDelivered = order.status === 'DELIVERED';

  return (
    <SafeAreaView style={[st.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: spacing[3] }}>
          <Text style={[st.headerTitle, { color: colors.textPrimary }]}>Track Order</Text>
          <Text style={[st.headerSub, { color: colors.textSecondary }]}>{order.order_number}</Text>
        </View>
        <Pressable style={[st.helpBtn, { backgroundColor: colors.background }]}>
          <Ionicons name="headset-outline" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        {/* Map placeholder */}
        <View style={[st.mapBox, { backgroundColor: '#E8F5E9' }]}>
          {/* Simulated map */}
          <View style={st.mapRoute}>
            <View style={[st.mapPin, { backgroundColor: palette.orange }]}>
              <Ionicons name="restaurant" size={16} color="#fff" />
            </View>
            <View style={[st.mapLine, { backgroundColor: palette.orange }]} />
            <View style={[st.mapPin, { backgroundColor: palette.success }]}>
              <Ionicons name="home" size={16} color="#fff" />
            </View>
          </View>
          {order.status === 'ON_THE_WAY' && (
            <View style={[st.riderPin, { backgroundColor: '#fff' }, shadows.md]}>
              <Text style={{ fontSize: 24 }}>🏍️</Text>
            </View>
          )}
          <View style={[st.etaBubble, { backgroundColor: palette.orange }]}>
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={st.etaTxt}>
              {isDelivered ? 'Delivered!' : `~${order.estimated_delivery_minutes ?? 30} min`}
            </Text>
          </View>
        </View>

        {/* Status card */}
        {!isDelivered && (
          <View style={[st.statusCard, { backgroundColor: colors.surface }, shadows.md]}>
            <Text style={[st.statusTitle, { color: colors.textPrimary }]}>
              {order.status === 'ON_THE_WAY' ? 'Your order is on the way!' :
               order.status === 'PREPARING'  ? 'Restaurant is preparing your food' :
               order.status === 'PLACED'     ? 'Looking for a restaurant…' :
               fmt.status(order.status)}
            </Text>
            <Text style={[st.statusSub, { color: colors.textSecondary }]}>
              {order.status === 'ON_THE_WAY'
                ? `Arriving in ${order.estimated_delivery_minutes ?? 30} minutes`
                : 'We\'ll keep you updated every step of the way'}
            </Text>

            {/* Rider info — show when picked up */}
            {(order.status === 'PICKED_UP' || order.status === 'ON_THE_WAY') && (
              <View style={[st.riderCard, { backgroundColor: colors.background }]}>
                <View style={[st.riderAvatar, { backgroundColor: palette.orangeBg }]}>
                  <Text style={{ fontSize: 24 }}>🏍️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[st.riderName, { color: colors.textPrimary }]}>{order.rider_name ?? 'Your Rider'}</Text>
                  <Text style={[st.riderRole, { color: colors.textSecondary }]}>Delivery Partner</Text>
                </View>
                <Pressable style={[st.callBtn, { backgroundColor: palette.orangeBg }]}>
                  <Ionicons name="call" size={18} color={palette.orange} />
                </Pressable>
                <Pressable style={[st.callBtn, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="chatbubble" size={18} color={palette.info} />
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Delivered success */}
        {isDelivered && (
          <View style={[st.successCard, { backgroundColor: colors.surface }, shadows.md]}>
            <View style={[st.successIcon, { backgroundColor: palette.successBg }]}>
              <Ionicons name="checkmark-circle" size={48} color={palette.success} />
            </View>
            <Text style={[st.successTitle, { color: colors.textPrimary }]}>Order Delivered! 🎉</Text>
            <Text style={[st.successSub, { color: colors.textSecondary }]}>
              Your food has been delivered. Enjoy your meal!
            </Text>
            <Pressable onPress={() => router.push('/(customer)/order/history')} style={st.rateBtn}>
              <Ionicons name="star-outline" size={18} color="#fff" />
              <Text style={st.rateBtnTxt}>Rate Your Experience</Text>
            </Pressable>
          </View>
        )}

        {/* Timeline */}
        <View style={[st.timelineCard, { backgroundColor: colors.surface }, shadows.sm]}>
          <Text style={[st.timelineTitle, { color: colors.textPrimary }]}>Order Status</Text>
          {STEPS.map((step, i) => {
            const done = curIdx >= i;
            const active = curIdx === i;
            return (
              <View key={step.status} style={st.timelineRow}>
                <View style={st.timelineLeft}>
                  <View style={[st.dot, {
                    backgroundColor: done ? palette.orange : colors.border,
                    ...(active && { borderWidth: 3, borderColor: palette.orangeLight }),
                  }]}>
                    {done && !active && <Ionicons name="checkmark" size={10} color="#fff" />}
                  </View>
                  {i < STEPS.length - 1 && (
                    <View style={[st.connector, { backgroundColor: curIdx > i ? palette.orange : colors.border }]} />
                  )}
                </View>
                <View style={st.timelineContent}>
                  <Text style={[st.dotLabel, {
                    color: done ? colors.textPrimary : colors.textTertiary,
                    fontWeight: active ? '700' : '400',
                  }]}>{step.label}</Text>
                  {active && (
                    <Text style={[st.dotTime, { color: palette.orange }]}>
                      {fmt.time(order.updated_at)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Order # */}
        <View style={[st.orderNumCard, { backgroundColor: colors.surface }, shadows.sm]}>
          <View>
            <Text style={[st.orderNumLabel, { color: colors.textSecondary }]}>Order #</Text>
            <Text style={[st.orderNumVal, { color: colors.textPrimary }]}>{order.order_number}</Text>
          </View>
          <View style={[st.dividerV, { backgroundColor: colors.divider }]} />
          <View>
            <Text style={[st.orderNumLabel, { color: colors.textSecondary }]}>Time</Text>
            <Text style={[st.orderNumVal, { color: colors.textPrimary }]}>{fmt.time(order.created_at)}</Text>
          </View>
          <View style={[st.dividerV, { backgroundColor: colors.divider }]} />
          <View>
            <Text style={[st.orderNumLabel, { color: colors.textSecondary }]}>Total</Text>
            <Text style={[st.orderNumVal, { color: palette.orange }]}>{fmt.currency(order.total)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', padding: spacing[4] },
  headerTitle: { fontSize: typography.sizes.body, fontWeight: '700' },
  headerSub:   { fontSize: typography.sizes.sm },
  helpBtn:     { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  scroll:      { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },

  mapBox:      { height: 200, borderRadius: radius.xl, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  mapRoute:    { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  mapPin:      { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  mapLine:     { width: 120, height: 3, borderRadius: 2 },
  riderPin:    { position: 'absolute', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  etaBubble:   { position: 'absolute', bottom: spacing[3], right: spacing[3], flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full },
  etaTxt:      { color: '#fff', fontSize: typography.sizes.sm, fontWeight: '700' },

  statusCard:  { borderRadius: radius.xl, padding: spacing[4], gap: spacing[3] },
  statusTitle: { fontSize: typography.sizes.body, fontWeight: '700' },
  statusSub:   { fontSize: typography.sizes.sm, lineHeight: 20 },
  riderCard:   { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: radius.lg },
  riderAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  riderName:   { fontSize: typography.sizes.base, fontWeight: '600' },
  riderRole:   { fontSize: typography.sizes.sm },
  callBtn:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  successCard: { borderRadius: radius.xl, padding: spacing[5], alignItems: 'center', gap: spacing[3] },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  successTitle:{ fontSize: typography.sizes.xl, fontWeight: '800' },
  successSub:  { fontSize: typography.sizes.base, textAlign: 'center', lineHeight: 22 },
  rateBtn:     { flexDirection: 'row', backgroundColor: palette.orange, borderRadius: radius.full, paddingVertical: spacing[3], paddingHorizontal: spacing[6], alignItems: 'center', gap: spacing[2], ...shadows.card },
  rateBtnTxt:  { color: '#fff', fontSize: typography.sizes.base, fontWeight: '700' },

  timelineCard: { borderRadius: radius.xl, padding: spacing[4] },
  timelineTitle:{ fontSize: typography.sizes.body, fontWeight: '700', marginBottom: spacing[3] },
  timelineRow:  { flexDirection: 'row' },
  timelineLeft: { width: 28, alignItems: 'center' },
  dot:          { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  connector:    { flex: 1, width: 2, marginTop: 2, minHeight: 32 },
  timelineContent:{ flex: 1, paddingLeft: spacing[3], paddingBottom: spacing[3] },
  dotLabel:     { fontSize: typography.sizes.base },
  dotTime:      { fontSize: typography.sizes.sm, fontWeight: '600', marginTop: 2 },

  orderNumCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderRadius: radius.xl, padding: spacing[4] },
  dividerV:     { width: 1, height: 40 },
  orderNumLabel:{ fontSize: typography.sizes.sm, textAlign: 'center', marginBottom: 2 },
  orderNumVal:  { fontSize: typography.sizes.base, fontWeight: '700', textAlign: 'center' },
});
