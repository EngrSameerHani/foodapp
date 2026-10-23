import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOrder } from '@/hooks/useOrders';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { useTheme } from '@/hooks/useTheme';
import { Badge, statusBadgeVariant, Skeleton } from '@/components/ui';
import { spacing, typography, borderRadius, shadows } from '@/theme';
import { formatCurrency, formatTime } from '@/utils/format';
import type { OrderStatus } from '@/types/api';

const STATUS_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'PLACED', label: 'Order Placed', icon: 'receipt-outline' },
  { status: 'ACCEPTED', label: 'Accepted', icon: 'checkmark-circle-outline' },
  { status: 'PREPARING', label: 'Preparing', icon: 'flame-outline' },
  { status: 'READY_FOR_PICKUP', label: 'Ready', icon: 'bag-check-outline' },
  { status: 'PICKED_UP', label: 'Picked Up', icon: 'bicycle-outline' },
  { status: 'ON_THE_WAY', label: 'On the Way', icon: 'navigate-outline' },
  { status: 'DELIVERED', label: 'Delivered', icon: 'checkmark-done-outline' },
];

const STEP_ORDER = STATUS_STEPS.map((s) => s.status);

function getStepIndex(status: OrderStatus): number {
  return STEP_ORDER.indexOf(status);
}

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: order, isLoading } = useOrder(id);
  const { status: liveStatus, riderLat, riderLng, connected } = useOrderTracking(id);

  const currentStatus = (liveStatus ?? order?.status) as OrderStatus | undefined;
  const currentStepIdx = currentStatus ? getStepIndex(currentStatus) : -1;

  const isTerminal = ['DELIVERED', 'CANCELLED', 'REJECTED', 'FAILED'].includes(currentStatus ?? '');

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: spacing[4], gap: spacing[3] }}>
          <Skeleton height={200} borderRadius={12} />
          {[1, 2, 3].map((n) => <Skeleton key={n} height={48} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (!order) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{order.order_number}</Text>
        <Badge label={currentStatus ?? order.status} variant={statusBadgeVariant(currentStatus ?? order.status)} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        {/* Map placeholder — react-native-maps would go here */}
        <View style={[styles.mapPlaceholder, { backgroundColor: colors.border }]}>
          <Ionicons name="map-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.mapText, { color: colors.textSecondary }]}>
            {riderLat ? `Rider at ${riderLat.toFixed(4)}, ${riderLng?.toFixed(4)}` : 'Waiting for rider location…'}
          </Text>
          {connected && (
            <View style={[styles.liveTag, { backgroundColor: colors.success }]}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* ETA */}
        {order.estimated_delivery_minutes && !isTerminal && (
          <View style={[styles.etaCard, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={[styles.etaText, { color: colors.primary }]}>
              Estimated arrival in ~{order.estimated_delivery_minutes} min
            </Text>
          </View>
        )}

        {/* Status timeline */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Order Status</Text>
          {STATUS_STEPS.map((step, idx) => {
            const done = currentStepIdx >= idx;
            const active = currentStepIdx === idx;
            return (
              <View key={step.status} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.dot, { backgroundColor: done ? colors.primary : colors.border, borderColor: active ? colors.primary : 'transparent' }]}>
                    {done && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  {idx < STATUS_STEPS.length - 1 && (
                    <View style={[styles.line, { backgroundColor: currentStepIdx > idx ? colors.primary : colors.border }]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.stepLabel, { color: done ? colors.textPrimary : colors.textTertiary, fontWeight: active ? typography.weights.bold : typography.weights.regular }]}>
                    {step.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Order items */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Order Summary</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={[styles.itemQty, { color: colors.primary }]}>{item.quantity}×</Text>
              <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.item_name}</Text>
              <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
                {formatCurrency(item.unit_price * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.itemRow}>
            <Text style={{ color: colors.textSecondary, flex: 1 }}>Total</Text>
            <Text style={[styles.totalVal, { color: colors.primary }]}>{formatCurrency(order.total)}</Text>
          </View>
        </View>

        {/* Review CTA */}
        {currentStatus === 'DELIVERED' && (
          <Pressable
            style={[styles.reviewBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push({ pathname: '/(customer)/order/history', params: { reviewOrderId: order.id } })}
          >
            <Ionicons name="star-outline" size={20} color="#fff" />
            <Text style={styles.reviewBtnText}>Rate your experience</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  title: { flex: 1, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  mapPlaceholder: { height: 180, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' },
  mapText: { fontSize: typography.sizes.sm },
  liveTag: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  etaCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[3], borderRadius: borderRadius.md, borderWidth: 1 },
  etaText: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold },
  section: { borderRadius: borderRadius.lg, padding: spacing[4], gap: spacing[2], ...shadows.sm },
  sectionTitle: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold, marginBottom: spacing[2] },
  timelineRow: { flexDirection: 'row', minHeight: 48 },
  timelineLeft: { width: 28, alignItems: 'center' },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, zIndex: 1 },
  line: { flex: 1, width: 2, marginTop: 2 },
  timelineContent: { flex: 1, paddingLeft: spacing[3], justifyContent: 'center' },
  stepLabel: { fontSize: typography.sizes.base },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  itemQty: { fontWeight: typography.weights.bold, width: 28 },
  itemName: { flex: 1, fontSize: typography.sizes.base },
  itemPrice: { fontSize: typography.sizes.base, fontWeight: typography.weights.medium },
  divider: { height: 1, marginVertical: spacing[2] },
  totalVal: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], padding: spacing[4], borderRadius: borderRadius.full },
  reviewBtnText: { color: '#fff', fontSize: typography.sizes.base, fontWeight: typography.weights.bold },
});
