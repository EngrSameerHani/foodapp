import React, { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useOrders } from '@/hooks/useOrders';
import { ordersApi } from '@/services/orders';
import { useCartStore } from '@/store/cartStore';
import { useTheme } from '@/hooks/useTheme';
import { Badge, statusBadgeVariant, Skeleton, EmptyState } from '@/components/ui';
import { spacing, typography, borderRadius, shadows } from '@/theme';
import { formatCurrency, formatDate, formatOrderStatus } from '@/utils/format';
import type { Order } from '@/types/api';

function ReviewModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { colors } = useTheme();
  const [restRating, setRestRating] = useState(5);
  const [riderRating, setRiderRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await ordersApi.createReview({
        order_id: order.id,
        restaurant_rating: restRating,
        rider_rating: order.rider_id ? riderRating : undefined,
        comment: comment || undefined,
      });
      Toast.show({ type: 'success', text1: 'Review submitted! Thank you.' });
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to submit review';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const Stars = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
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
          <Text style={[styles.reviewTitle, { color: colors.textPrimary }]}>Rate your experience</Text>
          <Text style={[styles.reviewSub, { color: colors.textSecondary }]}>{order.order_number}</Text>

          <Text style={[styles.label, { color: colors.textPrimary }]}>Restaurant</Text>
          <Stars value={restRating} onChange={setRestRating} />

          {order.rider_id && (
            <>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Rider</Text>
              <Stars value={riderRating} onChange={setRiderRating} />
            </>
          )}

          <Text style={[styles.label, { color: colors.textPrimary }]}>Comments (optional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share your thoughts…"
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[styles.commentInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
          />

          <Pressable
            onPress={submit}
            disabled={submitting}
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sizes.base }}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function OrderHistoryScreen() {
  const { colors } = useTheme();
  const { data, isLoading, fetchNextPage, hasNextPage } = useOrders();
  const { clear, addItem } = useCartStore();
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);

  const orders = data?.pages.flatMap((p) => p.data) ?? [];

  const reorder = (order: Order) => {
    clear();
    order.items.forEach((item) => {
      addItem(order.restaurant_id, '', {
        id: Math.random().toString(36),
        item_id: item.item_id,
        item_name: item.item_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        selected_options: item.options_snapshot,
        special_note: item.special_note,
      });
    });
    router.push('/(customer)/cart');
    Toast.show({ type: 'success', text1: 'Items added to cart' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Order History</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading && (
        <View style={{ padding: spacing[4], gap: 12 }}>
          {[1, 2, 3].map((n) => <Skeleton key={n} height={100} borderRadius={12} />)}
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        ListEmptyComponent={!isLoading ? <EmptyState icon="receipt-outline" title="No orders yet" message="Your past orders will appear here." /> : null}
        renderItem={({ item: order }) => (
          <View style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.orderNum, { color: colors.textPrimary }]}>{order.order_number}</Text>
              <Badge label={formatOrderStatus(order.status)} variant={statusBadgeVariant(order.status)} />
            </View>
            <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(order.created_at)}</Text>
            <Text style={[styles.items, { color: colors.textSecondary }]}>
              {order.items.map((i) => `${i.quantity}× ${i.item_name}`).join(', ')}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.total, { color: colors.textPrimary }]}>{formatCurrency(order.total)}</Text>
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                {order.status === 'DELIVERED' && (
                  <Pressable
                    onPress={() => setReviewOrder(order)}
                    style={[styles.actionBtn, { borderColor: colors.primary }]}
                  >
                    <Text style={[styles.actionText, { color: colors.primary }]}>Rate</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => reorder(order)}
                  style={[styles.actionBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.actionText, { color: colors.textPrimary }]}>Reorder</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      {reviewOrder && (
        <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  card: { borderRadius: borderRadius.lg, padding: spacing[4], gap: spacing[2] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderNum: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold },
  date: { fontSize: typography.sizes.sm },
  items: { fontSize: typography.sizes.sm, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[2] },
  total: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  actionBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full, borderWidth: 1.5 },
  actionText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  reviewTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginTop: spacing[4] },
  reviewSub: { fontSize: typography.sizes.sm, marginBottom: spacing[4] },
  label: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, marginTop: spacing[4], marginBottom: spacing[2] },
  commentInput: { borderWidth: 1.5, borderRadius: borderRadius.md, padding: spacing[3], minHeight: 80, fontSize: typography.sizes.base },
  submitBtn: { marginTop: spacing[5], padding: spacing[4], borderRadius: borderRadius.full, alignItems: 'center' },
});
