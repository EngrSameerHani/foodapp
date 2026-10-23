import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useCartStore } from '@/store/cartStore';
import { ordersApi } from '@/services/orders';
import { useTheme } from '@/hooks/useTheme';
import { Button, EmptyState } from '@/components/ui';
import { spacing, typography, borderRadius, shadows } from '@/theme';
import { formatCurrency } from '@/utils/format';

const SERVICE_FEE = 1.99;
const TAX_RATE = 0.08;
// Delivery fee will come from restaurant — using store placeholder for display
const DELIVERY_FEE = 2.99;

export default function CartScreen() {
  const { colors } = useTheme();
  const { items, restaurantName, updateQuantity, removeItem, subtotal, clear } = useCartStore();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);

  const sub = subtotal();
  const tax = sub * TAX_RATE;
  const total = sub + DELIVERY_FEE + SERVICE_FEE + tax - discount;

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const { data } = await ordersApi.validateVoucher(promoCode.trim(), sub);
      setDiscount(data.discount_amount);
      Toast.show({ type: 'success', text1: `${data.code} applied — ${formatCurrency(data.discount_amount)} off!` });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Invalid code';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setPromoLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="bag-outline"
          title="Your cart is empty"
          message="Add items from a restaurant to get started."
          actionLabel="Browse Restaurants"
          onAction={() => router.push('/(customer)/')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Your Cart</Text>
        <Pressable onPress={() => Alert.alert('Clear cart?', 'Remove all items?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: clear },
        ])}>
          <Text style={{ color: colors.error, fontSize: typography.sizes.sm, fontWeight: '600' }}>Clear</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        {/* Restaurant */}
        <Text style={[styles.restName, { color: colors.textSecondary }]}>From {restaurantName}</Text>

        {/* Items */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          {items.map((item, idx) => (
            <View key={item.id}>
              {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View style={styles.itemRow}>
                <View style={[styles.stepper, { borderColor: colors.border }]}>
                  <Pressable onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.stepBtn}>
                    <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={16} color={item.quantity === 1 ? colors.error : colors.textPrimary} />
                  </Pressable>
                  <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{item.quantity}</Text>
                  <Pressable onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.stepBtn}>
                    <Ionicons name="add" size={16} color={colors.textPrimary} />
                  </Pressable>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.item_name}</Text>
                  {item.selected_options.length > 0 && (
                    <Text style={[styles.opts, { color: colors.textSecondary }]}>
                      {item.selected_options.map((o) => o.option_name).join(', ')}
                    </Text>
                  )}
                </View>
                <Text style={[styles.lineTotal, { color: colors.textPrimary }]}>
                  {formatCurrency(item.unit_price * item.quantity)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Promo code */}
        <View style={[styles.section, styles.promoRow, { backgroundColor: colors.surface }]}>
          <TextInput
            value={promoCode}
            onChangeText={setPromoCode}
            placeholder="Promo code"
            placeholderTextColor={colors.textTertiary}
            style={[styles.promoInput, { color: colors.textPrimary, borderColor: colors.border }]}
            autoCapitalize="characters"
          />
          <Button title="Apply" onPress={applyPromo} loading={promoLoading} size="sm" variant="outline" />
        </View>

        {/* Price breakdown */}
        <View style={[styles.section, { backgroundColor: colors.surface, gap: spacing[2] }]}>
          {[
            ['Subtotal', formatCurrency(sub)],
            ['Delivery fee', formatCurrency(DELIVERY_FEE)],
            ['Service fee', formatCurrency(SERVICE_FEE)],
            ['Tax (8%)', formatCurrency(tax)],
            ...(discount > 0 ? [['Promo discount', `-${formatCurrency(discount)}`]] : []),
          ].map(([label, value]) => (
            <View key={label} style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{label}</Text>
              <Text style={[styles.priceValue, { color: label === 'Promo discount' ? colors.success : colors.textPrimary }]}>{value}</Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.priceRow}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatCurrency(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button
          title={`Checkout  ${formatCurrency(total)}`}
          onPress={() => router.push('/(customer)/checkout')}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  restName: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  section: { borderRadius: borderRadius.lg, padding: spacing[4], ...shadows.sm },
  divider: { height: 1, marginVertical: spacing[2] },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: borderRadius.full },
  stepBtn: { padding: spacing[2] },
  qtyText: { paddingHorizontal: spacing[3], fontSize: typography.sizes.base, fontWeight: typography.weights.bold, minWidth: 24, textAlign: 'center' },
  itemName: { fontSize: typography.sizes.base, fontWeight: typography.weights.medium },
  opts: { fontSize: typography.sizes.sm, marginTop: 2 },
  lineTotal: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold },
  promoRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'center' },
  promoInput: { flex: 1, borderWidth: 1.5, borderRadius: borderRadius.md, paddingHorizontal: spacing[3], paddingVertical: spacing[2], fontSize: typography.sizes.base },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: typography.sizes.base },
  priceValue: { fontSize: typography.sizes.base, fontWeight: typography.weights.medium },
  totalLabel: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  totalValue: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  footer: { padding: spacing[4], borderTopWidth: 1 },
});
