import React, { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }      from '../../../src/hooks/useTheme';
import { useOrderStore } from '../../../src/store/orderStore';
import { useAppStore }   from '../../../src/store/appStore';
import { useAuthStore }  from '../../../src/store/authStore';
import { useCartStore }  from '../../../src/store/cartStore';
import { reviewService } from '../../../src/services';
import { Badge, statusVariant, Empty, Toast } from '../../../src/components/ui';
import { spacing, typography, radius, shadows } from '../../../src/theme';
import { fmt } from '../../../src/utils';
import type { Order } from '../../../src/types';

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
      Toast.show('Review submitted! Thank you.', 'success');
      onClose();
    } catch { Toast.show('Could not submit review', 'error'); }
    finally { setSaving(false); }
  };

  const Stars = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1,2,3,4,5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)}>
          <Ionicons name={n <= value ? 'star' : 'star-outline'} size={28} color="#F59E0B" />
        </Pressable>
      ))}
    </View>
  );

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing[4] }}>
          <Pressable onPress={onClose} style={{ alignSelf: 'flex-end' }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[rv.title, { color: colors.textPrimary }]}>Rate your experience</Text>
          <Text style={[rv.sub, { color: colors.textSecondary }]}>{order.order_number}</Text>
          <Text style={[rv.label, { color: colors.textPrimary }]}>Restaurant</Text>
          <Stars value={rRating} onChange={setRRating} />
          {order.rider_id && (
            <>
              <Text style={[rv.label, { color: colors.textPrimary }]}>Rider</Text>
              <Stars value={dRating} onChange={setDRating} />
            </>
          )}
          <Text style={[rv.label, { color: colors.textPrimary }]}>Comments (optional)</Text>
          <TextInput value={comment} onChangeText={setComment} placeholder="Share your thoughts…"
            placeholderTextColor={colors.textTertiary} multiline
            style={[rv.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]} />
          <Pressable onPress={submit} disabled={saving}
            style={[rv.submitBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sizes.base }}>
              {saving ? 'Submitting…' : 'Submit Review'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function OrderHistory() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { isMockMode } = useAppStore();
  const { customerOrders } = useOrderStore();
  const { clear, addItem } = useCartStore();
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);

  const orders = isMockMode
    ? customerOrders.filter((o) => o.customer_id === (user?.id ?? 'user-cust-001'))
    : customerOrders;

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
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></Pressable>
        <Text style={[s.title, { color: colors.textPrimary }]}>Order History</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList data={orders} keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
        ListEmptyComponent={<Empty icon="receipt-outline" title="No orders yet" message="Your past orders will appear here." />}
        renderItem={({ item: order }) => (
          <View style={[s.card, { backgroundColor: colors.surface }, shadows.sm]}>
            <View style={s.cardHeader}>
              <Text style={[s.orderNum, { color: colors.textPrimary }]}>{order.order_number}</Text>
              <Badge label={fmt.status(order.status)} variant={statusVariant(order.status)} />
            </View>
            <Text style={[s.date, { color: colors.textSecondary }]}>{fmt.date(order.created_at)}</Text>
            {order.restaurant_name && <Text style={[s.restName, { color: colors.textSecondary }]}>{order.restaurant_name}</Text>}
            <Text style={[s.items, { color: colors.textSecondary }]} numberOfLines={2}>
              {order.items.map((i) => `${i.quantity}× ${i.item_name}`).join(', ')}
            </Text>
            <View style={s.cardFooter}>
              <Text style={[s.total, { color: colors.textPrimary }]}>{fmt.currency(order.total)}</Text>
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                {order.status === 'DELIVERED' && (
                  <Pressable onPress={() => setReviewOrder(order)} style={[s.actionBtn, { borderColor: colors.primary }]}>
                    <Text style={[s.actionTxt, { color: colors.primary }]}>Rate</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => reorder(order)} style={[s.actionBtn, { borderColor: colors.border }]}>
                  <Text style={[s.actionTxt, { color: colors.textPrimary }]}>Reorder</Text>
                </Pressable>
                <Pressable onPress={() => router.push(`/(customer)/order/${order.id}`)} style={[s.actionBtn, { borderColor: colors.border }]}>
                  <Text style={[s.actionTxt, { color: colors.textPrimary }]}>Track</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
      {reviewOrder && <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  title:      { fontSize: typography.sizes.xl, fontWeight: '700' },
  card:       { borderRadius: radius.lg, padding: spacing[4], gap: spacing[2] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderNum:   { fontSize: typography.sizes.base, fontWeight: '700' },
  date:       { fontSize: typography.sizes.sm },
  restName:   { fontSize: typography.sizes.sm, fontWeight: '500' },
  items:      { fontSize: typography.sizes.sm, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[2] },
  total:      { fontSize: typography.sizes.lg, fontWeight: '700' },
  actionBtn:  { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1.5 },
  actionTxt:  { fontSize: typography.sizes.sm, fontWeight: '600' },
});
const rv = StyleSheet.create({
  title:     { fontSize: typography.sizes.xl, fontWeight: '700', marginTop: spacing[4] },
  sub:       { fontSize: typography.sizes.sm, marginBottom: spacing[4] },
  label:     { fontSize: typography.sizes.base, fontWeight: '600', marginTop: spacing[4], marginBottom: spacing[2] },
  input:     { borderWidth: 1.5, borderRadius: radius.md, padding: spacing[3], minHeight: 80, fontSize: typography.sizes.base },
  submitBtn: { marginTop: spacing[5], padding: spacing[4], borderRadius: radius.full, alignItems: 'center' },
});
