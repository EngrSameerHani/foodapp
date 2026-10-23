import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useQuery } from '@tanstack/react-query';
import { addressesApi } from '@/services/addresses';
import { ordersApi } from '@/services/orders';
import { useCartStore } from '@/store/cartStore';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { spacing, typography, borderRadius, shadows } from '@/theme';
import type { Address } from '@/types/api';

export default function CheckoutScreen() {
  const { colors } = useTheme();
  const { restaurantId, subtotal } = useCartStore();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [placing, setPlacing] = useState(false);

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.list().then((r) => r.data),
  });

  const placeOrder = async () => {
    if (!selectedAddressId) {
      Toast.show({ type: 'error', text1: 'Please select a delivery address' });
      return;
    }
    setPlacing(true);
    try {
      const { data: order } = await ordersApi.placeOrder({
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        delivery_note: deliveryNote || undefined,
      });
      router.replace(`/(customer)/order/${order.id}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to place order';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}>
        {/* Delivery address */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Deliver to</Text>
          {addresses.length === 0 && (
            <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.base }}>
              No saved addresses. Please add one below.
            </Text>
          )}
          {addresses.map((addr: Address) => (
            <Pressable
              key={addr.id}
              onPress={() => setSelectedAddressId(addr.id)}
              style={[
                styles.addressRow,
                {
                  borderColor: selectedAddressId === addr.id ? colors.primary : colors.border,
                  backgroundColor: selectedAddressId === addr.id ? colors.primary + '08' : 'transparent',
                },
              ]}
            >
              <Ionicons
                name={addr.label === 'Home' ? 'home-outline' : addr.label === 'Work' ? 'briefcase-outline' : 'location-outline'}
                size={20}
                color={selectedAddressId === addr.id ? colors.primary : colors.textSecondary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.addrLabel, { color: colors.textPrimary }]}>{addr.label}</Text>
                <Text style={[styles.addrText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {addr.full_address}
                </Text>
              </View>
              {selectedAddressId === addr.id && (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              )}
            </Pressable>
          ))}
          <Pressable
            onPress={() => Toast.show({ type: 'info', text1: 'Map address picker — add in Task 4.4' })}
            style={[styles.addAddrBtn, { borderColor: colors.primary }]}
          >
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={[styles.addAddrText, { color: colors.primary }]}>Add new address</Text>
          </Pressable>
        </View>

        {/* Delivery note */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Delivery instructions</Text>
          <TextInput
            value={deliveryNote}
            onChangeText={setDeliveryNote}
            placeholder="Leave at door, ring doorbell…"
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[styles.noteInput, { color: colors.textPrimary, borderColor: colors.border }]}
          />
        </View>

        {/* Payment */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Payment method</Text>
          {[
            { id: 'cash', label: 'Cash on Delivery', icon: 'cash-outline', available: true },
            { id: 'card', label: 'Credit / Debit Card', icon: 'card-outline', available: false },
            { id: 'wallet', label: 'Digital Wallet', icon: 'wallet-outline', available: false },
          ].map((pm) => (
            <Pressable
              key={pm.id}
              onPress={() => pm.available && setPaymentMethod(pm.id)}
              style={[
                styles.payRow,
                {
                  borderColor: paymentMethod === pm.id ? colors.primary : colors.border,
                  opacity: pm.available ? 1 : 0.5,
                },
              ]}
            >
              <Ionicons name={pm.icon as 'cash-outline'} size={22} color={paymentMethod === pm.id ? colors.primary : colors.textSecondary} />
              <Text style={[styles.payLabel, { color: colors.textPrimary }]}>{pm.label}</Text>
              {!pm.available && (
                <View style={[styles.comingSoon, { backgroundColor: colors.border }]}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary }}>Coming soon</Text>
                </View>
              )}
              {paymentMethod === pm.id && (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button
          title="Place Order"
          onPress={placeOrder}
          loading={placing}
          fullWidth
          size="lg"
          disabled={!selectedAddressId}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  section: { borderRadius: borderRadius.lg, padding: spacing[4], gap: spacing[3], ...shadows.sm },
  sectionTitle: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold, marginBottom: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], padding: spacing[3], borderWidth: 1.5, borderRadius: borderRadius.md },
  addrLabel: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold },
  addrText: { fontSize: typography.sizes.sm, marginTop: 2, lineHeight: 18 },
  addAddrBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[3], borderWidth: 1.5, borderRadius: borderRadius.md, borderStyle: 'dashed' },
  addAddrText: { fontSize: typography.sizes.base, fontWeight: typography.weights.medium },
  noteInput: { borderWidth: 1.5, borderRadius: borderRadius.md, padding: spacing[3], minHeight: 80, fontSize: typography.sizes.base },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderWidth: 1.5, borderRadius: borderRadius.md },
  payLabel: { flex: 1, fontSize: typography.sizes.base },
  comingSoon: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  footer: { padding: spacing[4], borderTopWidth: 1 },
});
