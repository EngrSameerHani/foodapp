import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }      from '../../src/hooks/useTheme';
import { useCartStore }  from '../../src/store/cartStore';
import { voucherService } from '../../src/services';
import { Button, Empty, Toast } from '../../src/components/ui';
import { spacing, typography, radius, shadows } from '../../src/theme';
import { fmt } from '../../src/utils';

const SERVICE_FEE = 1.99;
const TAX_RATE    = 0.08;

export default function Cart() {
  const { colors } = useTheme();
  const { items, restaurantName, deliveryFee, updateQty, remove, clear, setVoucher, clearVoucher, voucherCode, discount, subtotal } = useCartStore();
  const [code,   setCode]   = useState('');
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
      Toast.show(`${v.code} applied — ${fmt.currency(v.discount_amount)} off!`, 'success');
      setCode('');
    } catch (e: unknown) { Toast.show((e as { message?: string })?.message ?? 'Invalid code', 'error'); }
    finally { setApplying(false); }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
        <Empty icon="bag-outline" title="Your cart is empty" message="Add items from a restaurant to get started."
          actionLabel="Browse Restaurants" onAction={() => router.push('/(customer)/')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Your Cart</Text>
        <Pressable onPress={() => Alert.alert('Clear cart?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: clear }])}>
          <Text style={{ color: colors.error, fontWeight: '600' }}>Clear</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        <Text style={[s.restName, { color: colors.textSecondary }]}>From {restaurantName}</Text>

        {/* items */}
        <View style={[s.section, { backgroundColor: colors.surface }, shadows.sm]}>
          {items.map((item, i) => (
            <View key={item.id}>
              {i > 0 && <View style={[s.divider, { backgroundColor: colors.border }]} />}
              <View style={s.itemRow}>
                <View style={[s.stepper, { borderColor: colors.border }]}>
                  <Pressable onPress={() => updateQty(item.id, item.quantity - 1)} style={s.stepBtn}>
                    <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={16} color={item.quantity === 1 ? colors.error : colors.textPrimary} />
                  </Pressable>
                  <Text style={[s.qtyTxt, { color: colors.textPrimary }]}>{item.quantity}</Text>
                  <Pressable onPress={() => updateQty(item.id, item.quantity + 1)} style={s.stepBtn}>
                    <Ionicons name="add" size={16} color={colors.textPrimary} />
                  </Pressable>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.itemName, { color: colors.textPrimary }]}>{item.item_name}</Text>
                  {item.selected_options.length > 0 && (
                    <Text style={[s.opts, { color: colors.textSecondary }]}>{item.selected_options.map((o) => o.option_name).join(', ')}</Text>
                  )}
                </View>
                <Text style={[s.lineTotal, { color: colors.textPrimary }]}>{fmt.currency(item.unit_price * item.quantity)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* promo */}
        <View style={[s.section, s.promoRow, { backgroundColor: colors.surface }, shadows.sm]}>
          <TextInput value={voucherCode ?? code} onChangeText={setCode}
            placeholder="Promo code (try WELCOME20)" placeholderTextColor={colors.textTertiary}
            editable={!voucherCode}
            style={[s.promoInput, { color: colors.textPrimary, borderColor: colors.border }]}
            autoCapitalize="characters" />
          {voucherCode
            ? <Pressable onPress={clearVoucher} style={{ padding: spacing[2] }}><Ionicons name="close-circle" size={20} color={colors.error} /></Pressable>
            : <Button title="Apply" onPress={applyVoucher} loading={applying} size="sm" variant="outline" />}
        </View>

        {/* price breakdown */}
        <View style={[s.section, { backgroundColor: colors.surface, gap: spacing[2] }, shadows.sm]}>
          {[
            ['Subtotal', fmt.currency(sub)],
            ['Delivery', fmt.currency(deliveryFee)],
            ['Service fee', fmt.currency(SERVICE_FEE)],
            [`Tax (${(TAX_RATE * 100).toFixed(0)}%)`, fmt.currency(tax)],
            ...(discount > 0 ? [['Discount', `-${fmt.currency(discount)}`]] : []),
          ].map(([l, v]) => (
            <View key={l} style={s.priceRow}>
              <Text style={[s.priceLabel, { color: colors.textSecondary }]}>{l}</Text>
              <Text style={[s.priceVal, { color: l === 'Discount' ? colors.success : colors.textPrimary }]}>{v}</Text>
            </View>
          ))}
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <View style={s.priceRow}>
            <Text style={[s.totalLabel, { color: colors.textPrimary }]}>Total</Text>
            <Text style={[s.totalVal, { color: colors.primary }]}>{fmt.currency(tot)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[s.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button title={`Checkout  ${fmt.currency(tot)}`} onPress={() => router.push('/(customer)/checkout')} fullWidth size="lg" />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  title:      { fontSize: typography.sizes.xl, fontWeight: '700' },
  restName:   { fontSize: typography.sizes.sm, fontWeight: '500' },
  section:    { borderRadius: radius.lg, padding: spacing[4] },
  divider:    { height: 1, marginVertical: spacing[2] },
  itemRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  stepper:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: radius.full },
  stepBtn:    { padding: spacing[2] },
  qtyTxt:     { paddingHorizontal: spacing[3], fontSize: typography.sizes.base, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  itemName:   { fontSize: typography.sizes.base, fontWeight: '500' },
  opts:       { fontSize: typography.sizes.sm, marginTop: 2 },
  lineTotal:  { fontSize: typography.sizes.base, fontWeight: '600' },
  promoRow:   { flexDirection: 'row', gap: spacing[2], alignItems: 'center' },
  promoInput: { flex: 1, borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: spacing[3], paddingVertical: spacing[2], fontSize: typography.sizes.base },
  priceRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: typography.sizes.base },
  priceVal:   { fontSize: typography.sizes.base, fontWeight: '500' },
  totalLabel: { fontSize: typography.sizes.lg, fontWeight: '700' },
  totalVal:   { fontSize: typography.sizes.lg, fontWeight: '700' },
  footer:     { padding: spacing[4], borderTopWidth: 1 },
});
