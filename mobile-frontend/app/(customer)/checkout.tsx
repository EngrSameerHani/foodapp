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
import { Toast }          from '../../src/components/ui';
import { palette, spacing, radius, typography, shadows } from '../../src/theme';
import { fmt, localId }   from '../../src/utils';
import type { Address, Order } from '../../src/types';

const STEPS = ['Address', 'Payment', 'Confirm'];

export default function Checkout() {
  const { colors } = useTheme();
  const { user }   = useAuthStore();
  const { isMockMode } = useAppStore();
  const { items, restaurantId, restaurantName, deliveryFee, subtotal, total, discount, voucherCode, clear } = useCartStore();
  const addOrder = useOrderStore((s) => s.addOrder);

  const [step,      setStep]      = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selAddr,   setSelAddr]   = useState<string | null>(null);
  const [note,      setNote]      = useState('');
  const [payment,   setPayment]   = useState('cash');
  const [placing,   setPlacing]   = useState(false);

  useEffect(() => {
    addressService.list().then((a) => {
      setAddresses(a);
      const def = a.find((x) => x.is_default);
      if (def) setSelAddr(def.id);
    });
  }, []);

  const place = async () => {
    if (!selAddr) { Toast.show('Select a delivery address', 'error'); return; }
    setPlacing(true);
    try {
      const addr = addresses.find((a) => a.id === selAddr)!;
      const sub  = subtotal();
      const tax  = sub * 0.08;
      const tot  = total();
      const newOrder: Order = {
        id: localId(), order_number: `ZF-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
        customer_id: user?.id ?? 'guest', restaurant_id: restaurantId ?? '',
        restaurant_name: restaurantName, rider_id: null, rider_name: null,
        status: 'PLACED', subtotal: sub, delivery_fee: deliveryFee,
        service_fee: 1.99, tax, discount, total: tot,
        payment_method: payment, payment_status: 'pending',
        delivery_note: note || null, rejection_reason: null,
        delivery_address_snapshot: { full_address: addr.full_address, lat: addr.lat, lng: addr.lng },
        estimated_delivery_minutes: 30,
        items: items.map((i) => ({
          id: localId(), item_id: i.item_id, item_name: i.item_name,
          quantity: i.quantity, unit_price: i.unit_price,
          options_snapshot: i.selected_options, special_note: i.special_note,
        })),
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      if (isMockMode) { addOrder(newOrder); clear(); router.replace(`/(customer)/order/${newOrder.id}`); }
      else {
        const real = await orderService.place({ address_id: selAddr, payment_method: payment, delivery_note: note || undefined });
        clear(); router.replace(`/(customer)/order/${real.id}`);
      }
    } catch (e: unknown) {
      Toast.show((e as { message?: string })?.message ?? 'Failed to place order', 'error');
    } finally { setPlacing(false); }
  };

  return (
    <SafeAreaView style={[st.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[st.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => step === 0 ? router.back() : setStep(step - 1)}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[st.headerTitle, { color: colors.textPrimary }]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step progress */}
      <View style={[st.progressWrap, { backgroundColor: colors.surface }]}>
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <View style={st.stepItem}>
              <View style={[st.stepCircle, {
                backgroundColor: i <= step ? palette.orange : colors.background,
                borderColor: i <= step ? palette.orange : colors.border,
              }]}>
                {i < step
                  ? <Ionicons name="checkmark" size={14} color="#fff" />
                  : <Text style={[st.stepNum, { color: i === step ? '#fff' : colors.textTertiary }]}>{i + 1}</Text>}
              </View>
              <Text style={[st.stepLabel, { color: i <= step ? palette.orange : colors.textTertiary }]}>{label}</Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[st.stepLine, { backgroundColor: i < step ? palette.orange : colors.border }]} />
            )}
          </React.Fragment>
        ))}
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        {/* ── STEP 0: Address ── */}
        {step === 0 && (
          <View style={{ gap: spacing[3] }}>
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Delivery Address</Text>
            {addresses.map((a) => (
              <Pressable key={a.id} onPress={() => setSelAddr(a.id)}
                style={[st.addrCard, { backgroundColor: colors.surface, borderColor: selAddr === a.id ? palette.orange : colors.border }, shadows.sm]}>
                <View style={[st.addrIcon, { backgroundColor: selAddr === a.id ? palette.orangeBg : colors.background }]}>
                  <Ionicons name={a.label === 'Home' ? 'home' : a.label === 'Work' ? 'briefcase' : 'location'}
                    size={20} color={selAddr === a.id ? palette.orange : colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[st.addrLabel, { color: colors.textPrimary }]}>{a.label}</Text>
                  <Text style={[st.addrTxt, { color: colors.textSecondary }]} numberOfLines={2}>{a.full_address}</Text>
                </View>
                {selAddr === a.id && <Ionicons name="checkmark-circle" size={24} color={palette.orange} />}
              </Pressable>
            ))}
            <Pressable style={[st.addAddrBtn, { borderColor: palette.orange }]}
              onPress={() => Toast.show('Connect backend to add addresses', 'info')}>
              <Ionicons name="add-circle-outline" size={20} color={palette.orange} />
              <Text style={[st.addAddrTxt, { color: palette.orange }]}>Add New Address</Text>
            </Pressable>

            <Text style={[st.sectionTitle, { color: colors.textPrimary, marginTop: spacing[2] }]}>Delivery Time</Text>
            <View style={[st.infoRow, { backgroundColor: colors.surface }, shadows.sm]}>
              <Ionicons name="time-outline" size={20} color={palette.orange} />
              <Text style={[st.infoTxt, { color: colors.textPrimary }]}>ASAP (30–40 min)</Text>
              <Text style={[st.changeBtn, { color: palette.orange }]}>Change</Text>
            </View>

            <Pressable onPress={() => setStep(1)} disabled={!selAddr} style={[st.nextBtn, { opacity: selAddr ? 1 : 0.4 }]}>
              <Text style={st.nextBtnTxt}>Continue to Payment</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* ── STEP 1: Payment ── */}
        {step === 1 && (
          <View style={{ gap: spacing[3] }}>
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Payment Method</Text>
            {[
              { id: 'cash', label: 'Cash on Delivery', sub: 'Pay when you receive', icon: 'cash-outline', available: true },
              { id: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard', icon: 'card-outline', available: false },
              { id: 'wallet', label: 'Digital Wallet', sub: 'EasyPaisa, JazzCash', icon: 'wallet-outline', available: false },
            ].map((pm) => (
              <Pressable key={pm.id} onPress={() => pm.available && setPayment(pm.id)}
                style={[st.payCard, { backgroundColor: colors.surface, borderColor: payment === pm.id ? palette.orange : colors.border, opacity: pm.available ? 1 : 0.5 }, shadows.sm]}>
                <View style={[st.payIcon, { backgroundColor: payment === pm.id ? palette.orangeBg : colors.background }]}>
                  <Ionicons name={pm.icon as 'cash-outline'} size={22} color={payment === pm.id ? palette.orange : colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[st.payLabel, { color: colors.textPrimary }]}>{pm.label}</Text>
                  <Text style={[st.paySub, { color: colors.textSecondary }]}>{pm.sub}</Text>
                </View>
                {!pm.available
                  ? <View style={[st.soonPill, { backgroundColor: colors.background }]}>
                      <Text style={{ fontSize: typography.sizes.sm, color: colors.textTertiary }}>Soon</Text>
                    </View>
                  : payment === pm.id && <Ionicons name="checkmark-circle" size={24} color={palette.orange} />}
              </Pressable>
            ))}

            <Text style={[st.sectionTitle, { color: colors.textPrimary, marginTop: spacing[2] }]}>Apply Promo Code</Text>
            <Pressable style={[st.infoRow, { backgroundColor: colors.surface }, shadows.sm]}
              onPress={() => router.back()}>
              <Ionicons name="pricetag-outline" size={20} color={palette.orange} />
              <Text style={[st.infoTxt, { color: colors.textSecondary }]}>{voucherCode ?? 'Apply promo code'}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </Pressable>

            <Pressable onPress={() => setStep(2)} style={st.nextBtn}>
              <Text style={st.nextBtnTxt}>Review Order</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* ── STEP 2: Confirm ── */}
        {step === 2 && (
          <View style={{ gap: spacing[3] }}>
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Order Summary</Text>
            <View style={[st.orderCard, { backgroundColor: colors.surface }, shadows.sm]}>
              {items.map((i) => (
                <View key={i.id} style={st.orderRow}>
                  <Text style={[st.orderQty, { color: palette.orange }]}>{i.quantity}×</Text>
                  <Text style={[st.orderName, { color: colors.textPrimary }]}>{i.item_name}</Text>
                  <Text style={[st.orderPrice, { color: colors.textPrimary }]}>{fmt.currency(i.unit_price * i.quantity)}</Text>
                </View>
              ))}
              <View style={[st.divider, { backgroundColor: colors.divider, marginVertical: spacing[2] }]} />
              {[
                ['Subtotal', fmt.currency(subtotal())],
                ['Delivery', fmt.currency(deliveryFee)],
                ['Service fee', fmt.currency(1.99)],
                ...(discount > 0 ? [['Discount', `-${fmt.currency(discount)}`]] : []),
              ].map(([l, v]) => (
                <View key={l} style={st.orderRow}>
                  <Text style={[st.orderLabel, { color: colors.textSecondary, flex: 1 }]}>{l}</Text>
                  <Text style={[st.orderLabel, { color: l === 'Discount' ? palette.success : colors.textPrimary }]}>{v}</Text>
                </View>
              ))}
              <View style={[st.divider, { backgroundColor: colors.divider, marginVertical: spacing[2] }]} />
              <View style={st.orderRow}>
                <Text style={[st.totalLabel2, { color: colors.textPrimary }]}>Total</Text>
                <Text style={[st.totalVal2, { color: palette.orange }]}>{fmt.currency(total())}</Text>
              </View>
            </View>

            {/* Delivery note */}
            <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Delivery Instructions</Text>
            <View style={[st.noteWrap, { backgroundColor: colors.surface }, shadows.sm]}>
              <TextInput value={note} onChangeText={setNote}
                placeholder="Leave at door, ring bell…"
                placeholderTextColor={colors.textTertiary} multiline
                style={[st.noteInput, { color: colors.textPrimary }]} />
            </View>

            <Pressable onPress={place} disabled={placing}
              style={[st.placeBtn, { opacity: placing ? 0.7 : 1 }]}>
              <Text style={st.placeBtnTxt}>{placing ? 'Placing Order…' : 'Place Order'}</Text>
              <Text style={[st.placeBtnTotal, { color: 'rgba(255,255,255,0.8)' }]}>{fmt.currency(total())}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  headerTitle:{ fontSize: typography.sizes.xl, fontWeight: '700' },
  scroll:     { padding: spacing[4], paddingBottom: spacing[8] },

  progressWrap:{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[6], paddingVertical: spacing[4] },
  stepItem:   { alignItems: 'center', gap: spacing[1] },
  stepCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepNum:    { fontSize: typography.sizes.sm, fontWeight: '700' },
  stepLabel:  { fontSize: typography.sizes.sm, fontWeight: '500' },
  stepLine:   { flex: 1, height: 2, marginBottom: spacing[5] },

  sectionTitle:{ fontSize: typography.sizes.body, fontWeight: '700' },

  addrCard:   { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius.xl, borderWidth: 2 },
  addrIcon:   { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  addrLabel:  { fontSize: typography.sizes.body, fontWeight: '600' },
  addrTxt:    { fontSize: typography.sizes.sm, marginTop: 2, lineHeight: 18 },
  addAddrBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[4], borderRadius: radius.xl, borderWidth: 1.5, borderStyle: 'dashed', justifyContent: 'center' },
  addAddrTxt: { fontSize: typography.sizes.base, fontWeight: '600' },

  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius.xl },
  infoTxt:    { flex: 1, fontSize: typography.sizes.base },
  changeBtn:  { fontSize: typography.sizes.base, fontWeight: '600' },

  payCard:    { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius.xl, borderWidth: 2 },
  payIcon:    { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  payLabel:   { fontSize: typography.sizes.base, fontWeight: '600' },
  paySub:     { fontSize: typography.sizes.sm, marginTop: 2 },
  soonPill:   { paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: radius.sm },

  orderCard:  { borderRadius: radius.xl, padding: spacing[4], gap: spacing[1] },
  orderRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  orderQty:   { fontWeight: '700', width: 24, fontSize: typography.sizes.base },
  orderName:  { flex: 1, fontSize: typography.sizes.base },
  orderPrice: { fontSize: typography.sizes.base, fontWeight: '500' },
  orderLabel: { fontSize: typography.sizes.base },
  divider:    { height: 1 },
  totalLabel2:{ fontSize: typography.sizes.lg, fontWeight: '700' },
  totalVal2:  { fontSize: typography.sizes.xl, fontWeight: '800' },

  noteWrap:   { borderRadius: radius.xl, padding: spacing[3] },
  noteInput:  { fontSize: typography.sizes.base, minHeight: 72, lineHeight: 22 },

  nextBtn:    { flexDirection: 'row', backgroundColor: palette.orange, borderRadius: radius.full, paddingVertical: spacing[4], alignItems: 'center', justifyContent: 'center', gap: spacing[2], marginTop: spacing[2], ...shadows.card },
  nextBtnTxt: { color: '#fff', fontSize: typography.sizes.body, fontWeight: '700' },

  placeBtn:   { flexDirection: 'row', backgroundColor: palette.orange, borderRadius: radius.full, paddingVertical: spacing[4], paddingHorizontal: spacing[5], alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[2], ...shadows.card },
  placeBtnTxt:{ color: '#fff', fontSize: typography.sizes.body, fontWeight: '700' },
  placeBtnTotal:{ fontSize: typography.sizes.body, fontWeight: '700' },
});
