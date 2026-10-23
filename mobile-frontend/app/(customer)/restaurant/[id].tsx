import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }      from '../../../src/hooks/useTheme';
import { restaurantService } from '../../../src/services';
import { useCartStore }  from '../../../src/store/cartStore';
import { Button, Empty, Toast } from '../../../src/components/ui';
import { spacing, typography, radius, shadows } from '../../../src/theme';
import { fmt, localId } from '../../../src/utils';
import type { MenuItem, MenuCategory, ItemVariation, Restaurant } from '../../../src/types';

function ItemSheet({ item, restaurant, onClose }: { item: MenuItem; restaurant: Restaurant; onClose: () => void }) {
  const { colors } = useTheme();
  const { addItem, restaurantId, clear } = useCartStore();
  const [qty,  setQty]  = useState(1);
  const [sel,  setSel]  = useState<Record<string, string[]>>({});
  const [note, setNote] = useState('');

  const delta = Object.values(sel).flat().reduce((s, name) => {
    for (const v of item.variations) {
      const o = v.options.find((x) => x.name === name);
      if (o) return s + o.price_delta;
    }
    return s;
  }, 0);
  const unitPrice = item.price + delta;

  const toggle = (v: ItemVariation, name: string) => {
    setSel((p) => {
      const cur = p[v.id] ?? [];
      const next = v.is_multi_select
        ? (cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name])
        : [name];
      return { ...p, [v.id]: next };
    });
  };

  const doAdd = () => {
    const opts = Object.entries(sel).flatMap(([vId, names]) =>
      names.map((name) => {
        const v = item.variations.find((x) => x.id === vId);
        const o = v?.options.find((x) => x.name === name);
        return { variation_id: vId, option_name: name, price_delta: o?.price_delta ?? 0 };
      }),
    );
    addItem(restaurant.id, restaurant.name, restaurant.delivery_fee, {
      item_id: item.id, item_name: item.name, unit_price: unitPrice,
      quantity: qty, selected_options: opts, special_note: note || null,
    });
    Toast.show(`${item.name} added to cart`, 'success');
    onClose();
  };

  const handleAdd = () => {
    if (restaurantId && restaurantId !== restaurant.id) {
      Alert.alert('Clear cart?', 'Your cart has items from a different restaurant.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear & Add', style: 'destructive', onPress: () => { clear(); doAdd(); } },
      ]);
    } else { doAdd(); }
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView>
          <View style={[s.sheetCover, { backgroundColor: colors.borderLight }]}>
            <Ionicons name="fast-food-outline" size={56} color={colors.textTertiary} />
          </View>
          <View style={{ padding: spacing[4] }}>
            <Pressable onPress={onClose} style={{ alignSelf: 'flex-end' }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[s.sheetName, { color: colors.textPrimary }]}>{item.name}</Text>
            {item.description && <Text style={[s.sheetDesc, { color: colors.textSecondary }]}>{item.description}</Text>}
            <Text style={[s.sheetPrice, { color: colors.primary }]}>{fmt.currency(unitPrice)}</Text>

            {item.variations.map((v) => (
              <View key={v.id} style={{ marginTop: spacing[4] }}>
                <Text style={[s.varLabel, { color: colors.textPrimary }]}>
                  {v.label}{v.is_required && <Text style={{ color: colors.error }}> *</Text>}
                </Text>
                {v.options.map((opt) => {
                  const on = (sel[v.id] ?? []).includes(opt.name);
                  return (
                    <Pressable key={opt.name} onPress={() => toggle(v, opt.name)}
                      style={[s.optRow, { borderColor: on ? colors.primary : colors.border }]}>
                      <Text style={[s.optName, { color: colors.textPrimary }]}>{opt.name}</Text>
                      {opt.price_delta !== 0 && <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>+{fmt.currency(opt.price_delta)}</Text>}
                      <View style={[s.check, { borderColor: colors.primary, backgroundColor: on ? colors.primary : 'transparent' }]}>
                        {on && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <View style={{ marginTop: spacing[4] }}>
              <Text style={[s.varLabel, { color: colors.textPrimary }]}>Special instructions</Text>
              <TextInput value={note} onChangeText={setNote} placeholder="E.g. no onions…"
                placeholderTextColor={colors.textTertiary} multiline
                style={[s.noteInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]} />
            </View>

            <View style={s.qtyRow}>
              <View style={[s.stepper, { borderColor: colors.border }]}>
                <Pressable onPress={() => setQty(Math.max(1, qty - 1))} style={s.stepBtn}><Ionicons name="remove" size={18} color={colors.textPrimary} /></Pressable>
                <Text style={[s.qtyTxt, { color: colors.textPrimary }]}>{qty}</Text>
                <Pressable onPress={() => setQty(qty + 1)} style={s.stepBtn}><Ionicons name="add" size={18} color={colors.textPrimary} /></Pressable>
              </View>
              <Button title={`Add  ${fmt.currency(unitPrice * qty)}`} onPress={handleAdd} style={{ flex: 1 }} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [rest,    setRest]    = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selItem, setSelItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    restaurantService.get(id).then(setRest).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  if (!rest)   return <Empty icon="alert-circle-outline" title="Restaurant not found" />;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView>
        {/* cover */}
        <View style={[s.cover, { backgroundColor: colors.borderLight }]}>
          <Ionicons name="restaurant-outline" size={64} color={colors.textTertiary} />
          <Pressable onPress={() => router.back()} style={[s.backBtn, { backgroundColor: colors.surface }, shadows.sm]}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* info */}
        <View style={[s.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.restName, { color: colors.textPrimary }]}>{rest.name}</Text>
          {rest.description && <Text style={[s.restDesc, { color: colors.textSecondary }]}>{rest.description}</Text>}
          <View style={s.metaRow}>
            {[
              { icon: 'star' as const, color: '#F59E0B', text: `${rest.rating.toFixed(1)} (${rest.review_count})` },
              { icon: 'time-outline' as const, color: colors.primary, text: `${rest.estimated_delivery_minutes} min` },
              { icon: 'bicycle-outline' as const, color: colors.primary, text: `${fmt.currency(rest.delivery_fee)} delivery` },
            ].map((m) => (
              <View key={m.text} style={s.metaItem}>
                <Ionicons name={m.icon} size={14} color={m.color} />
                <Text style={[s.metaTxt, { color: colors.textPrimary }]}>{m.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* menu */}
        {(rest.categories ?? []).map((cat: MenuCategory) => (
          <View key={cat.id} style={{ marginTop: spacing[2] }}>
            <Text style={[s.catHeader, { color: colors.textPrimary, backgroundColor: colors.background }]}>{cat.name}</Text>
            {cat.items.map((item: MenuItem) => (
              <Pressable key={item.id} onPress={() => item.is_available && setSelItem(item)}
                style={[s.menuItem, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
                disabled={!item.is_available}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.itemName, { color: item.is_available ? colors.textPrimary : colors.textTertiary }]}>{item.name}</Text>
                  {item.description && <Text style={[s.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>}
                  <Text style={[s.itemPrice, { color: item.is_available ? colors.primary : colors.textTertiary }]}>{fmt.currency(item.price)}</Text>
                </View>
                <View style={[s.itemThumb, { backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="fast-food-outline" size={24} color={colors.textTertiary} />
                </View>
                {item.is_available && (
                  <View style={[s.addDot, { backgroundColor: colors.primary }]}>
                    <Ionicons name="add" size={18} color="#fff" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>

      {selItem && rest && <ItemSheet item={selItem} restaurant={rest} onClose={() => setSelItem(null)} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  cover:     { height: 180, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  backBtn:   { position: 'absolute', top: spacing[4], left: spacing[4], width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  infoCard:  { padding: spacing[4], gap: 5 },
  restName:  { fontSize: typography.sizes['2xl'], fontWeight: '700' },
  restDesc:  { fontSize: typography.sizes.base, lineHeight: 22 },
  metaRow:   { flexDirection: 'row', gap: spacing[4], marginTop: 4, flexWrap: 'wrap' },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:   { fontSize: typography.sizes.sm, fontWeight: '500' },
  catHeader: { fontSize: typography.sizes.md, fontWeight: '700', paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  menuItem:  { flexDirection: 'row', alignItems: 'center', padding: spacing[4], borderBottomWidth: 1, gap: spacing[3] },
  itemName:  { fontSize: typography.sizes.base, fontWeight: '600' },
  itemDesc:  { fontSize: typography.sizes.sm, marginTop: 2, lineHeight: 18 },
  itemPrice: { fontSize: typography.sizes.base, fontWeight: '700', marginTop: 4 },
  itemThumb: { width: 80, height: 80, borderRadius: radius.md },
  addDot:    { position: 'absolute', bottom: spacing[3], right: spacing[3], width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  // sheet
  sheetCover: { height: 160, alignItems: 'center', justifyContent: 'center' },
  sheetName:  { fontSize: typography.sizes.xl, fontWeight: '700', marginTop: spacing[2] },
  sheetDesc:  { fontSize: typography.sizes.base, lineHeight: 22, marginTop: 4 },
  sheetPrice: { fontSize: typography.sizes.xl, fontWeight: '700', marginTop: 4 },
  varLabel:   { fontSize: typography.sizes.base, fontWeight: '600', marginBottom: spacing[2] },
  optRow:     { flexDirection: 'row', alignItems: 'center', padding: spacing[3], borderWidth: 1.5, borderRadius: radius.md, marginBottom: spacing[2] },
  optName:    { flex: 1, fontSize: typography.sizes.base },
  check:      { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  noteInput:  { borderWidth: 1.5, borderRadius: radius.md, padding: spacing[3], minHeight: 72, fontSize: typography.sizes.base },
  qtyRow:     { flexDirection: 'row', gap: spacing[3], marginTop: spacing[5], alignItems: 'center' },
  stepper:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: radius.full, overflow: 'hidden' },
  stepBtn:    { padding: spacing[3] },
  qtyTxt:     { paddingHorizontal: spacing[4], fontSize: typography.sizes.md, fontWeight: '700', minWidth: 28, textAlign: 'center' },
});
