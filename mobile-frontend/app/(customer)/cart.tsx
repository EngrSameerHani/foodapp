import React, { useState } from 'react';
import {
  Alert, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }       from '../../src/hooks/useTheme';
import { useCartStore }   from '../../src/store/cartStore';
import { voucherService } from '../../src/services';
import { Toast }          from '../../src/components/ui';
import { palette, spacing, radius, typography, shadows } from '../../src/theme';
import { fmt } from '../../src/utils';

const SERVICE_FEE = 1.99;
const TAX_RATE    = 0.08;

export default function Cart() {
  const { colors } = useTheme();
  const { items, restaurantName, deliveryFee, updateQty, remove, clear,
          setVoucher, clearVoucher, voucherCode, discount, subtotal } = useCartStore();
  const [code,     setCode]     = useState('');
  const [applying, setApplying] = useState(false);

  const sub = subtotal();
  const tax  = sub * TAX_RATE;
  const tot  = sub + deliveryFee + SERVICE_FEE + tax - discount;

  const applyVoucher = async () => {
    if (!code.trim()) return;
    setApplying(true);
    try {
      const v = await voucherService.validate(code.trim(), sub);
      setVoucher(v.code, v.discount_amount);
      Toast.show(`${v.code} — ${fmt.currency(v.discount_amount)} off! 🎉`, 'success');
      setCode('');
    } catch (e: unknown) {
      Toast.show((e as { message?: string })?.message ?? 'Invalid code', 'error');
    } finally { setApplying(false); }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={[st.root, { backgroundColor: colors.background }]}>
        <View style={st.empty}>
          <View style={[st.emptyIcon, { backgroundColor: palette.orangeBg }]}>
            <Text style={{ fontSize: 56 }}>🛒</Text>
          </View>
          <Text style={[st.emptyTitle, { color: colors.textPrimary }]}>Your cart is empty</Text>
          <Text style={[st.emptySub, { color: colors.textSecondary }]}>
            Looks like you haven't added anything yet
          </Text>
          <Pressable onPress={() => router.push('/(customer)/')} style={st.emptyBtn}>
            <Text style={st.emptyBtnTxt}>Browse Restaurants</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[st.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.surface }, shadows.sm]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[st.headerTitle, { color: colors.textPrimary }]}>Your Cart</Text>
        <Pressable onPress={() => Alert.alert('Clear cart?', 'Remove all items?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: clear },
        ])}>
          <Text style={{ color: palette.error, fontSize: typography.sizes.base, fontWeight: '600' }}>Clear</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        {/* Restaurant label */}
        <View style={[st.restRow, { backgroundColor: palette.orangeBg }]}>
          <Ionicons name="restaurant-outline" size={16} color={palette.orange} />
          <Text style={[st.restName, { color: palette.orangeDark }]}>{restaurantName}</Text>
        </View>

        {/* Items */}
        <View style={[st.card, { backgroundColor: colors.surface }, shadows.sm]}>
          {items.map((item, i) => (
            <View key={item.id}>
              {i > 0 && <View style={[st.divider, { backgroundColor: colors.divider }]} />}
              <View style={st.itemRow}>
                {/* Stepper */}
                <View style={[st.stepper, { backgroundColor: colors.background }]}>
                  <Pressable onPress={() => updateQty(item.id, item.quantity - 1)} style={st.stepBtn}>
                    <Ionicons
                      name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                      size={16}
                      color={item.quantity === 1 ? palette.error : palette.orange}
                    />
                  </Pressable>
                  <Text style={[st.qty, { color: colors.textPrimary }]}>{item.quantity}</Text>
                  <Pressable onPress={() => updateQty(item.id, item.quantity + 1)} style={st.stepBtn}>
                    <Ionicons name="add" size={16} color={palette.orange} />
                  </Pressable>
                </View>
                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={[st.itemName, { color: colors.textPrimary }]}>{item.item_name}</Text>
                  {item.selected_options.length > 0 && (
                    <Text style={[st.itemOpts, { color: colors.textSecondary }]}>
                      {item.selected_options.map((o) => o.option_name).join(', ')}
                    </Text>
                  )}
                </View>
                <Text style={[st.lineTotal, { color: colors.textPrimary }]}>
                  {fmt.currency(item.unit_price * item.quantity)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Promo code */}
        <View style={[st.card, { backgroundColor: colors.surface }, shadows.sm, { flexDirection: 'row', alignItems: 'center', gap: spacing[2] }]}>
          <View style={[st.promoIcon, { backgroundColor: palette.orangeBg }]}>
            <Text style={{ fontSize: 18 }}>%</Text>
          </View>
          <TextInput
            value={voucherCode ?? code} onChangeText={setCode}
            placeholder="Promo code (WELCOME20, SAVE5)"
            placeholderTextColor={colors.textTertiary}
            editable={!voucherCode}
            autoCapitalize="characters"
            style={[st.promoInput, { color: colors.textPrimary }]}
          />
          {voucherCode
            ? <Pressable onPress={clearVoucher} style={st.promoApplied}>
                <Ionicons name="close-circle" size={20} color={palette.error} />
              </Pressable>
            : <Pressable onPress={applyVoucher} disabled={applying}
                style={[st.promoBtn, { opacity: applying ? 0.6 : 1 }]}>
                <Text style={st.promoBtnTxt}>{applying ? '…' : 'Apply'}</Text>
              </Pressable>}
        </View>

        {/* Price summary */}
        <View style={[st.card, { backgroundColor: colors.surface }, shadows.sm]}>
          <Text style={[st.summaryTitle, { color: colors.textPrimary }]}>Order Summary</Text>
          {[
            { label: 'Subtotal',    value: fmt.currency(sub) },
            { label: 'Delivery Fee', value: fmt.currency(deliveryFee) },
            { label: 'Service Fee', value: fmt.currency(SERVICE_FEE) },
            { label: `Tax (${(TAX_RATE * 100).toFixed(0)}%)`, value: fmt.currency(tax) },
            ...(discount > 0 ? [{ label: 'Promo Discount', value: `-${fmt.currency(discount)}`, green: true }] : []),
          ].map((row) => (
            <View key={row.label} style={st.summaryRow}>
              <Text style={[st.summaryLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              <Text style={[st.summaryValue, { color: (row as { green?: boolean }).green ? palette.success : colors.textPrimary }]}>
                {row.value}
              </Text>
            </View>
          ))}
          <View style={[st.divider, { backgroundColor: colors.divider, marginVertical: spacing[2] }]} />
          <View style={st.summaryRow}>
            <Text style={[st.totalLabel, { color: colors.textPrimary }]}>Total</Text>
            <Text style={[st.totalValue, { color: palette.orange }]}>{fmt.currency(tot)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[st.footer, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
        <Pressable onPress={() => router.push('/(customer)/checkout')} style={st.cta}>
          <Text style={st.ctaText}>Proceed to Checkout</Text>
          <View style={st.ctaBadge}>
            <Text style={[st.ctaBadgeTxt]}>{fmt.currency(tot)}</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root:      { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  headerTitle:{ fontSize: typography.sizes.xl, fontWeight: '700' },
  scroll:    { padding: spacing[4], gap: spacing[3], paddingBottom: spacing[4] },

  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4], padding: spacing[8] },
  emptyIcon: { width: 120, height: 120, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:{ fontSize: typography.sizes.xl, fontWeight: '700', textAlign: 'center' },
  emptySub:  { fontSize: typography.sizes.body, textAlign: 'center', lineHeight: 24 },
  emptyBtn:  { backgroundColor: palette.orange, borderRadius: radius.full, paddingVertical: spacing[4], paddingHorizontal: spacing[8], ...shadows.card },
  emptyBtnTxt:{ color: '#fff', fontSize: typography.sizes.body, fontWeight: '700' },

  restRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[3], borderRadius: radius.lg },
  restName:  { fontSize: typography.sizes.base, fontWeight: '600' },

  card:      { borderRadius: radius.xl, padding: spacing[4] },
  divider:   { height: 1 },

  itemRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] },
  stepper:   { flexDirection: 'row', alignItems: 'center', borderRadius: radius.full, overflow: 'hidden' },
  stepBtn:   { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qty:       { width: 28, textAlign: 'center', fontSize: typography.sizes.body, fontWeight: '700' },
  itemName:  { fontSize: typography.sizes.base, fontWeight: '600' },
  itemOpts:  { fontSize: typography.sizes.sm, marginTop: 2 },
  lineTotal: { fontSize: typography.sizes.body, fontWeight: '600' },

  promoIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  promoInput:{ flex: 1, fontSize: typography.sizes.base },
  promoApplied:{ padding: spacing[1] },
  promoBtn:  { backgroundColor: palette.orange, borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[2] },
  promoBtnTxt:{ color: '#fff', fontSize: typography.sizes.base, fontWeight: '600' },

  summaryTitle:{ fontSize: typography.sizes.body, fontWeight: '700', marginBottom: spacing[3] },
  summaryRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
  summaryLabel:{ fontSize: typography.sizes.base, },
  summaryValue:{ fontSize: typography.sizes.base, fontWeight: '500' },
  totalLabel:{ fontSize: typography.sizes.lg, fontWeight: '700' },
  totalValue:{ fontSize: typography.sizes.xl, fontWeight: '800' },

  footer:    { padding: spacing[4], borderTopWidth: 1 },
  cta:       { flexDirection: 'row', backgroundColor: palette.orange, borderRadius: radius.full, paddingVertical: spacing[4], paddingHorizontal: spacing[5], alignItems: 'center', justifyContent: 'space-between', ...shadows.card },
  ctaText:   { color: '#fff', fontSize: typography.sizes.body, fontWeight: '700' },
  ctaBadge:  { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[1] },
  ctaBadgeTxt:{ color: '#fff', fontSize: typography.sizes.base, fontWeight: '700' },
});
