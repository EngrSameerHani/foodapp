import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }       from '../../src/hooks/useTheme';
import { addressService, orderService } from '../../src/services';
import { useCartStore }   from '../../src/store/cartStore';
import { useAuthStore }   from '../../src/store/authStore';
import { useAppStore }    from '../../src/store/appStore';
import { useOrderStore }  from '../../src/store/orderStore';
import { Button, Toast }  from '../../src/components/ui';
import { spacing, typography, radius, shadows } from '../../src/theme';
import type { Address, Order } from '../../src/types';
import { localId, fmt } from '../../src/utils';

export default function Checkout() {
  const { colors } = useTheme();
  const { user }   = useAuthStore();
  const { isMockMode } = useAppStore();
  const { items, restaurantId, restaurantName, deliveryFee, subtotal, total, discount, voucherCode, clear } = useCartStore();
  const addOrder = useOrderStore((s) => s.addOrder);

  const [addresses, setAddresses]     = useState<Address[]>([]);
  const [selAddr,   setSelAddr]       = useState<string | null>(null);
  const [note,      setNote]          = useState('');
  const [payment,   setPayment]       = useState('cash');
  const [placing,   setPlacing]       = useState(false);

  useEffect(() => {
    addressService.list().then((a) => {
      setAddresses(a);
      const def = a.find((x) => x.is_default);
      if (def) setSelAddr(def.id);
    });
  }, []);

  const place = async () => {
    if (!selAddr) { Toast.show('Please select a delivery address', 'error'); return; }
    setPlacing(true);
    try {
      const addr = addresses.find((a) => a.id === selAddr)!;
      const sub  = subtotal();
      const tax  = sub * 0.08;
      const tot  = total();

      const newOrder: Order = {
        id: localId(),
        order_number: `ZF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        customer_id:  user?.id ?? 'guest',
        restaurant_id: restaurantId ?? '',
        restaurant_name: restaurantName,
        rider_id: null,
        rider_name: null,
        status: 'PLACED',
        subtotal: sub,
        delivery_fee: deliveryFee,
        service_fee: 1.99,
        tax,
        discount,
        total: tot,
        payment_method: payment,
        payment_status: 'pending',
        delivery_note: note || null,
        rejection_reason: null,
        delivery_address_snapshot: { full_address: addr.full_address, lat: addr.lat, lng: addr.lng },
        estimated_delivery_minutes: 30,
        voucher_code: voucherCode ?? undefined,
        items: items.map((i) => ({
          id: localId(), item_id: i.item_id, item_name: i.item_name,
          quantity: i.quantity, unit_price: i.unit_price,
          options_snapshot: i.selected_options, special_note: i.special_note,
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Order & { voucher_code?: string };

      if (isMockMode) {
        addOrder(newOrder);
        clear();
        router.replace(`/(customer)/order/${newOrder.id}`);
      } else {
        const real = await orderService.place({ address_id: selAddr, payment_method: payment, delivery_note: note || undefined, voucher_code: voucherCode ?? undefined });
        clear();
        router.replace(`/(customer)/order/${real.id}`);
      }
    } catch (e: unknown) {
      Toast.show((e as { message?: string })?.message ?? 'Failed to place order', 'error');
    } finally { setPlacing(false); }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></Pressable>
        <Text style={[s.title, { color: colors.textPrimary }]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        {/* addresses */}
        <View style={[s.section, { backgroundColor: colors.surface }, shadows.sm]}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Deliver to</Text>
          {addresses.map((a) => (
            <Pressable key={a.id} onPress={() => setSelAddr(a.id)}
              style={[s.addrRow, { borderColor: selAddr === a.id ? colors.primary : colors.border, backgroundColor: selAddr === a.id ? colors.primary + '08' : 'transparent' }]}>
              <Ionicons name={a.label === 'Home' ? 'home-outline' : 'location-outline'} size={20} color={selAddr === a.id ? colors.primary : colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[s.addrLabel, { color: colors.textPrimary }]}>{a.label}</Text>
                <Text style={[s.addrTxt, { color: colors.textSecondary }]} numberOfLines={2}>{a.full_address}</Text>
              </View>
              {selAddr === a.id && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
            </Pressable>
          ))}
        </View>

        {/* delivery note */}
        <View style={[s.section, { backgroundColor: colors.surface }, shadows.sm]}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Delivery instructions</Text>
          <TextInput value={note} onChangeText={setNote} placeholder="Leave at door, ring bell…"
            placeholderTextColor={colors.textTertiary} multiline
            style={[s.noteInput, { color: colors.textPrimary, borderColor: colors.border }]} />
        </View>

        {/* payment */}
        <View style={[s.section, { backgroundColor: colors.surface }, shadows.sm]}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Payment</Text>
          {[
            { id: 'cash', label: 'Cash on Delivery', icon: 'cash-outline' as const, available: true },
            { id: 'card', label: 'Card / Wallet',     icon: 'card-outline' as const, available: false },
          ].map((pm) => (
            <Pressable key={pm.id} onPress={() => pm.available && setPayment(pm.id)}
              style={[s.payRow, { borderColor: payment === pm.id ? colors.primary : colors.border, opacity: pm.available ? 1 : 0.5 }]}>
              <Ionicons name={pm.icon} size={22} color={payment === pm.id ? colors.primary : colors.textSecondary} />
              <Text style={[s.payLabel, { color: colors.textPrimary }]}>{pm.label}</Text>
              {!pm.available && (
                <View style={[s.comingSoon, { backgroundColor: colors.border }]}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary }}>Coming soon</Text>
                </View>
              )}
              {payment === pm.id && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
            </Pressable>
          ))}
        </View>

        {/* order summary */}
        <View style={[s.section, { backgroundColor: colors.surface }, shadows.sm]}>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Order Summary</Text>
          {items.map((i) => (
            <View key={i.id} style={s.summaryRow}>
              <Text style={[s.summaryTxt, { color: colors.textSecondary }]}>{i.quantity}× {i.item_name}</Text>
              <Text style={[s.summaryTxt, { color: colors.textPrimary }]}>{fmt.currency(i.unit_price * i.quantity)}</Text>
            </View>
          ))}
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <View style={s.summaryRow}>
            <Text style={[s.totalLabel, { color: colors.textPrimary }]}>Total</Text>
            <Text style={[s.totalVal, { color: colors.primary }]}>{fmt.currency(total())}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[s.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button title="Place Order" onPress={place} loading={placing} fullWidth size="lg" disabled={!selAddr} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  title:       { fontSize: typography.sizes.xl, fontWeight: '700' },
  section:     { borderRadius: radius.lg, padding: spacing[4], gap: spacing[3] },
  sectionTitle:{ fontSize: typography.sizes.base, fontWeight: '700', marginBottom: 4 },
  addrRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], padding: spacing[3], borderWidth: 1.5, borderRadius: radius.md },
  addrLabel:   { fontSize: typography.sizes.base, fontWeight: '600' },
  addrTxt:     { fontSize: typography.sizes.sm, marginTop: 2, lineHeight: 18 },
  noteInput:   { borderWidth: 1.5, borderRadius: radius.md, padding: spacing[3], minHeight: 72, fontSize: typography.sizes.base },
  payRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderWidth: 1.5, borderRadius: radius.md },
  payLabel:    { flex: 1, fontSize: typography.sizes.base },
  comingSoon:  { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  summaryRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTxt:  { fontSize: typography.sizes.base },
  divider:     { height: 1, marginVertical: spacing[2] },
  totalLabel:  { fontSize: typography.sizes.lg, fontWeight: '700' },
  totalVal:    { fontSize: typography.sizes.lg, fontWeight: '700' },
  footer:      { padding: spacing[4], borderTopWidth: 1 },
});
