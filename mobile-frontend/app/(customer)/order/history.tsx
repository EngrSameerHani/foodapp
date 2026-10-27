import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }      from '../../../src/hooks/useTheme';
import { useOrderStore } from '../../../src/store/orderStore';
import { useAuthStore }  from '../../../src/store/authStore';
import { useCartStore }  from '../../../src/store/cartStore';
import { reviewService } from '../../../src/services';
import { Toast, Empty }  from '../../../src/components/ui';
import { palette, spacing, radius, typography, shadows } from '../../../src/theme';
import { fmt } from '../../../src/utils';
import type { Order } from '../../../src/types';

const STATUS_COLOR: Record<string, string> = {
  DELIVERED: palette.success,
  CANCELLED: palette.error,
  REJECTED:  palette.error,
  FAILED:    palette.error,
  PLACED:    palette.info,
  PREPARING: palette.warning,
  ON_THE_WAY:palette.orange,
};

function ReviewModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { colors } = useTheme();
  const [rRating, setRRating] = useState(5);
  const [dRating, setDRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving,  setSaving]  = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await reviewService.create({ order_id: order.id, restaurant_rating: rRating, rider_rating: order.rider_id ? dRating : undefined, comment: comment || undefined });
      Toast.show('Review submitted! Thank you 🌟', 'success');
      onClose();
    } catch { Toast.show('Could not submit review', 'error'); }
    finally { setSaving(false); }
  };

  const Stars = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
    <View style={{ flexDirection: 'row', gap: spacing[2] }}>
      {[1,2,3,4,5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={32} color="#F59E0B" />
        </Pressable>
      ))}
    </View>
  );

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing[5] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[5] }}>
            <Pressable onPress={onClose} style={{ marginRight: spacing[3] }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[rv.title, { color: colors.textPrimary }]}>Rate Your Experience</Text>
          </View>

          <View style={[rv.orderInfo, { backgroundColor: palette.orangeBg }]}>
            <Text style={{ fontSize: 28 }}>🍽️</Text>
            <View>
              <Text style={[rv.orderNum, { color: colors.textPrimary }]}>{order.order_number}</Text>
              <Text style={[rv.orderAmt, { color: palette.orange }]}>{fmt.currency(order.total)}</Text>
            </View>
          </View>

          <Text style={[rv.label, { color: colors.textPrimary }]}>Restaurant Rating</Text>
          <Stars value={rRating} onChange={setRRating} />

          {order.rider_id && (
            <>
              <Text style={[rv.label, { color: colors.textPrimary }]}>Rider Rating</Text>
              <Stars value={dRating} onChange={setDRating} />
            </>
          )}

          <Text style={[rv.label, { color: colors.textPrimary }]}>Share your feedback</Text>
          <TextInput value={comment} onChangeText={setComment}
            placeholder="How was your experience?"
            placeholderTextColor={colors.textTertiary} multiline
            style={[rv.input, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]} />

          <Pressable onPress={submit} disabled={saving} style={[rv.submitBtn, { opacity: saving ? 0.7 : 1 }]}>
            <Ionicons name="star" size={20} color="#fff" />
            <Text style={rv.submitTxt}>{saving ? 'Submitting…' : 'Submit Review'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function OrderHistory() {
  const { colors } = useTheme();
  const { user }   = useAuthStore();
  const { customerOrders } = useOrderStore();
  const { clear, addItem } = useCartStore();
  const [tab,         setTab]         = useState<'Ongoing' | 'Completed'>('Ongoing');
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);

  const orders = customerOrders.filter((o) =>
    tab === 'Ongoing'
      ? ['PLACED','ACCEPTED','PREPARING','READY_FOR_PICKUP','PICKED_UP','ON_THE_WAY'].includes(o.status)
      : ['DELIVERED','CANCELLED','REJECTED','FAILED'].includes(o.status),
  );

  const reorder = (order: Order) => {
    clear();
    order.items.forEach((item) => {
      addItem(order.restaurant_id, order.restaurant_name ?? '', 2.99, {
        item_id: item.item_id, item_name: item.item_name, unit_price: item.unit_price,
        quantity: item.quantity, selected_options: item.options_snapshot, special_note: item.special_note,
      });
    });
    router.push('/(customer)/cart');
    Toast.show('Items added to cart', 'success');
  };

  return (
    <SafeAreaView style={[st.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[st.headerTitle, { color: colors.textPrimary }]}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={[st.tabsWrap, { backgroundColor: colors.surface }]}>
        {(['Ongoing', 'Completed'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[st.tabBtn, { backgroundColor: tab === t ? palette.orange : colors.background }]}>
            <Text style={[st.tabTxt, { color: tab === t ? '#fff' : colors.textSecondary }]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Empty icon="receipt-outline" title={`No ${tab.toLowerCase()} orders`}
            message="Your orders will appear here." actionLabel="Browse Restaurants"
            onAction={() => router.push('/(customer)/')} />
        }
        renderItem={({ item: order }) => {
          const statusColor = STATUS_COLOR[order.status] ?? palette.info;
          const isDelivered = order.status === 'DELIVERED';
          return (
            <Pressable onPress={() => router.push(`/(customer)/order/${order.id}`)}
              style={[st.orderCard, { backgroundColor: colors.surface }, shadows.sm]}>
              {/* Restaurant icon */}
              <View style={[st.restIcon, { backgroundColor: palette.orangeBg }]}>
                <Text style={{ fontSize: 28 }}>🍽️</Text>
              </View>
              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={[st.restName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {order.restaurant_name ?? 'Restaurant'}
                </Text>
                <Text style={[st.itemsList, { color: colors.textSecondary }]} numberOfLines={1}>
                  {order.items.map((i) => i.item_name).join(', ')}
                </Text>
                <Text style={[st.amountTxt, { color: colors.textPrimary }]}>
                  {fmt.currency(order.total)}
                </Text>
                <Text style={[st.dateTxt, { color: colors.textTertiary }]}>{fmt.date(order.created_at)}</Text>
              </View>
              {/* Status + actions */}
              <View style={st.rightCol}>
                <View style={[st.statusPill, { backgroundColor: statusColor + '18' }]}>
                  <View style={[st.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[st.statusTxt, { color: statusColor }]}>{fmt.status(order.status)}</Text>
                </View>
                {isDelivered && (
                  <Pressable onPress={() => setReviewOrder(order)} style={[st.actionBtn, { backgroundColor: palette.orangeBg }]}>
                    <Ionicons name="star-outline" size={14} color={palette.orange} />
                    <Text style={[st.actionTxt, { color: palette.orange }]}>Rate</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => reorder(order)} style={[st.actionBtn, { backgroundColor: colors.background }]}>
                  <Ionicons name="refresh-outline" size={14} color={colors.textSecondary} />
                  <Text style={[st.actionTxt, { color: colors.textSecondary }]}>Reorder</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />
      {reviewOrder && <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} />}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  headerTitle:{ fontSize: typography.sizes.xl, fontWeight: '700' },

  tabsWrap:   { flexDirection: 'row', margin: spacing[4], padding: spacing[1], borderRadius: radius.full, gap: spacing[1] },
  tabBtn:     { flex: 1, paddingVertical: spacing[3], borderRadius: radius.full, alignItems: 'center' },
  tabTxt:     { fontSize: typography.sizes.base, fontWeight: '600' },

  orderCard:  { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], borderRadius: radius.xl, padding: spacing[3] },
  restIcon:   { width: 64, height: 64, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  restName:   { fontSize: typography.sizes.base, fontWeight: '700' },
  itemsList:  { fontSize: typography.sizes.sm, marginTop: 2 },
  amountTxt:  { fontSize: typography.sizes.body, fontWeight: '700', marginTop: spacing[1] },
  dateTxt:    { fontSize: typography.sizes.xs, marginTop: 2 },

  rightCol:   { alignItems: 'flex-end', gap: spacing[2] },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[2], paddingVertical: 4, borderRadius: radius.full },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusTxt:  { fontSize: typography.sizes.xs, fontWeight: '700' },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing[2], paddingVertical: 4, borderRadius: radius.full },
  actionTxt:  { fontSize: typography.sizes.xs, fontWeight: '600' },
});

const rv = StyleSheet.create({
  title:     { fontSize: typography.sizes.xl, fontWeight: '700', flex: 1 },
  orderInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: radius.xl, marginBottom: spacing[4] },
  orderNum:  { fontSize: typography.sizes.base, fontWeight: '600' },
  orderAmt:  { fontSize: typography.sizes.body, fontWeight: '700' },
  label:     { fontSize: typography.sizes.base, fontWeight: '600', marginTop: spacing[4], marginBottom: spacing[2] },
  input:     { borderWidth: 1.5, borderRadius: radius.lg, padding: spacing[3], minHeight: 80, fontSize: typography.sizes.base },
  submitBtn: { flexDirection: 'row', backgroundColor: palette.orange, borderRadius: radius.full, paddingVertical: spacing[4], alignItems: 'center', justifyContent: 'center', gap: spacing[2], marginTop: spacing[5], ...shadows.card },
  submitTxt: { color: '#fff', fontSize: typography.sizes.body, fontWeight: '700' },
});
