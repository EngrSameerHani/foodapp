import React, { useEffect, useState } from 'react';
import {
  Alert, Modal, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }         from '../../../src/hooks/useTheme';
import { restaurantService } from '../../../src/services';
import { useCartStore }     from '../../../src/store/cartStore';
import { Toast }            from '../../../src/components/ui';
import { palette, spacing, radius, typography, shadows } from '../../../src/theme';
import { fmt, localId }     from '../../../src/utils';
import type { MenuItem, MenuCategory, ItemVariation, Restaurant } from '../../../src/types';

// ─── Item detail modal ────────────────────────────────────────────────────────
function ItemModal({ item, restaurant, onClose }: { item: MenuItem; restaurant: Restaurant; onClose: () => void }) {
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
    Toast.show(`${item.name} added!`, 'success');
    onClose();
  };

  const handleAdd = () => {
    if (restaurantId && restaurantId !== restaurant.id) {
      Alert.alert('Start new cart?', 'Your cart has items from another restaurant.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear & Add', style: 'destructive', onPress: () => { clear(); doAdd(); } },
      ]);
    } else doAdd();
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Cover */}
          <View style={[m.cover, { backgroundColor: palette.orangeBg }]}>
            <Text style={{ fontSize: 100 }}>🍽️</Text>
            <Pressable onPress={onClose} style={[m.closeBtn, { backgroundColor: colors.surface }]}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
          <View style={{ padding: spacing[5], gap: spacing[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[m.name, { color: colors.textPrimary }]}>{item.name}</Text>
                {item.description && <Text style={[m.desc, { color: colors.textSecondary }]}>{item.description}</Text>}
              </View>
              <Text style={[m.price, { color: palette.orange }]}>{fmt.currency(unitPrice)}</Text>
            </View>

            {item.variations.map((v) => (
              <View key={v.id}>
                <Text style={[m.varTitle, { color: colors.textPrimary }]}>
                  {v.label}{v.is_required && <Text style={{ color: palette.error }}> *</Text>}
                </Text>
                {v.options.map((opt) => {
                  const on = (sel[v.id] ?? []).includes(opt.name);
                  return (
                    <Pressable key={opt.name} onPress={() => toggle(v, opt.name)}
                      style={[m.optRow, { borderColor: on ? palette.orange : colors.border, backgroundColor: on ? palette.orangeBg : colors.surface }]}>
                      <Text style={[m.optName, { color: colors.textPrimary }]}>{opt.name}</Text>
                      {opt.price_delta !== 0 && <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>+{fmt.currency(opt.price_delta)}</Text>}
                      <View style={[m.check, { backgroundColor: on ? palette.orange : 'transparent', borderColor: on ? palette.orange : colors.border }]}>
                        {on && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <View>
              <Text style={[m.varTitle, { color: colors.textPrimary }]}>Special Instructions</Text>
              <TextInput value={note} onChangeText={setNote}
                placeholder="No onions, extra sauce…"
                placeholderTextColor={colors.textTertiary} multiline
                style={[m.noteInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.inputBg }]} />
            </View>

            {/* Qty + Add */}
            <View style={m.qtyRow}>
              <View style={[m.stepper, { backgroundColor: colors.background }]}>
                <Pressable onPress={() => setQty(Math.max(1, qty - 1))} style={m.stepBtn}>
                  <Ionicons name="remove" size={18} color={palette.orange} />
                </Pressable>
                <Text style={[m.qtyTxt, { color: colors.textPrimary }]}>{qty}</Text>
                <Pressable onPress={() => setQty(qty + 1)} style={m.stepBtn}>
                  <Ionicons name="add" size={18} color={palette.orange} />
                </Pressable>
              </View>
              <Pressable onPress={handleAdd} style={m.addBtn}>
                <Text style={m.addBtnTxt}>Add to Cart  {fmt.currency(unitPrice * qty)}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [rest,    setRest]    = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [selItem, setSelItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<'Menu' | 'Reviews' | 'Info'>('Menu');

  useEffect(() => {
    restaurantService.get(id).then(setRest).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  if (!rest)   return null;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={[s.cover, { backgroundColor: palette.orangeBg }]}>
          <Text style={{ fontSize: 100 }}>🍽️</Text>
          <Pressable onPress={() => router.back()} style={[s.backBtn, { backgroundColor: colors.surface }, shadows.sm]}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={[s.likeBtn, { backgroundColor: colors.surface }, shadows.sm]}>
            <Ionicons name="heart-outline" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Info card */}
        <View style={[s.infoCard, { backgroundColor: colors.surface }, shadows.sm]}>
          <Text style={[s.restName, { color: colors.textPrimary }]}>{rest.name}</Text>
          {rest.description && <Text style={[s.restDesc, { color: colors.textSecondary }]}>{rest.description}</Text>}
          <View style={s.metaRow}>
            <View style={[s.metaPill, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[s.metaPillTxt, { color: '#92400E' }]}>{rest.rating.toFixed(1)} ({rest.review_count})</Text>
            </View>
            <View style={[s.metaPill, { backgroundColor: palette.orangeBg }]}>
              <Ionicons name="time-outline" size={14} color={palette.orange} />
              <Text style={[s.metaPillTxt, { color: palette.orangeDark }]}>{rest.estimated_delivery_minutes} min</Text>
            </View>
            <View style={[s.metaPill, { backgroundColor: colors.background }]}>
              <Ionicons name="bicycle-outline" size={14} color={colors.textSecondary} />
              <Text style={[s.metaPillTxt, { color: colors.textSecondary }]}>{fmt.currency(rest.delivery_fee)}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={[s.tabs, { backgroundColor: colors.surface }]}>
          {(['Menu', 'Reviews', 'Info'] as const).map((tab) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={s.tab}>
              <Text style={[s.tabTxt, { color: activeTab === tab ? palette.orange : colors.textSecondary }]}>{tab}</Text>
              {activeTab === tab && <View style={s.tabLine} />}
            </Pressable>
          ))}
        </View>

        {/* Menu */}
        {activeTab === 'Menu' && (rest.categories ?? []).map((cat: MenuCategory) => (
          <View key={cat.id}>
            <Text style={[s.catHeader, { color: colors.textPrimary, backgroundColor: colors.background }]}>{cat.name}</Text>
            {cat.items.map((item: MenuItem) => (
              <Pressable key={item.id}
                onPress={() => item.is_available && setSelItem(item)}
                disabled={!item.is_available}
                style={[s.menuRow, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
                <View style={[s.itemThumb, { backgroundColor: palette.orangeBg }]}>
                  <Text style={{ fontSize: 36 }}>🍽️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.itemName, { color: item.is_available ? colors.textPrimary : colors.textTertiary }]}>{item.name}</Text>
                  {item.description && (
                    <Text style={[s.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
                  )}
                  <Text style={[s.itemPrice, { color: item.is_available ? palette.orange : colors.textTertiary }]}>
                    {fmt.currency(item.price)}
                  </Text>
                </View>
                {item.is_available && (
                  <View style={s.addDot}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        ))}

        {activeTab === 'Reviews' && (
          <View style={{ padding: spacing[5], alignItems: 'center' }}>
            <Text style={{ fontSize: 48 }}>⭐</Text>
            <Text style={{ color: colors.textSecondary, marginTop: spacing[2] }}>Reviews coming soon</Text>
          </View>
        )}
        {activeTab === 'Info' && (
          <View style={{ padding: spacing[5], gap: spacing[3] }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Address</Text>
            <Text style={{ color: colors.textSecondary }}>{rest.address}</Text>
            <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Min Order</Text>
            <Text style={{ color: colors.textSecondary }}>{fmt.currency(rest.min_order)}</Text>
          </View>
        )}
      </ScrollView>
      {selItem && rest && <ItemModal item={selItem} restaurant={rest} onClose={() => setSelItem(null)} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  cover:    { height: 220, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  backBtn:  { position: 'absolute', top: spacing[4], left: spacing[4], width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  likeBtn:  { position: 'absolute', top: spacing[4], right: spacing[4], width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  infoCard: { margin: spacing[4], borderRadius: radius.xl, padding: spacing[4], gap: spacing[3] },
  restName: { fontSize: typography.sizes.xl, fontWeight: '700' },
  restDesc: { fontSize: typography.sizes.base, lineHeight: 22 },
  metaRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full },
  metaPillTxt: { fontSize: typography.sizes.sm, fontWeight: '500' },
  tabs:     { flexDirection: 'row', marginHorizontal: spacing[4], borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing[2] },
  tab:      { flex: 1, alignItems: 'center', paddingVertical: spacing[3], position: 'relative' },
  tabTxt:   { fontSize: typography.sizes.base, fontWeight: '600' },
  tabLine:  { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 3, backgroundColor: palette.orange, borderRadius: 2 },
  catHeader:{ fontSize: typography.sizes.body, fontWeight: '700', paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  menuRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderBottomWidth: 1 },
  itemThumb:{ width: 80, height: 80, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: typography.sizes.body, fontWeight: '600' },
  itemDesc: { fontSize: typography.sizes.sm, marginTop: 2, lineHeight: 18 },
  itemPrice:{ fontSize: typography.sizes.body, fontWeight: '700', marginTop: 4 },
  addDot:   { width: 32, height: 32, borderRadius: 16, backgroundColor: palette.orange, alignItems: 'center', justifyContent: 'center' },
});
const m = StyleSheet.create({
  cover:    { height: 200, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  closeBtn: { position: 'absolute', top: spacing[4], right: spacing[4], width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  name:     { fontSize: typography.sizes.xl, fontWeight: '700' },
  desc:     { fontSize: typography.sizes.base, lineHeight: 22, marginTop: 4 },
  price:    { fontSize: typography.sizes.xl, fontWeight: '800' },
  varTitle: { fontSize: typography.sizes.body, fontWeight: '600', marginBottom: spacing[2] },
  optRow:   { flexDirection: 'row', alignItems: 'center', padding: spacing[3], borderWidth: 1.5, borderRadius: radius.lg, marginBottom: spacing[2] },
  optName:  { flex: 1, fontSize: typography.sizes.base },
  check:    { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  noteInput:{ borderWidth: 1.5, borderRadius: radius.lg, padding: spacing[3], minHeight: 72, fontSize: typography.sizes.base },
  qtyRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: spacing[2] },
  stepper:  { flexDirection: 'row', alignItems: 'center', borderRadius: radius.full, padding: spacing[1], gap: spacing[1] },
  stepBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.orangeBg, alignItems: 'center', justifyContent: 'center' },
  qtyTxt:   { width: 28, textAlign: 'center', fontSize: typography.sizes.body, fontWeight: '700' },
  addBtn:   { flex: 1, backgroundColor: palette.orange, borderRadius: radius.full, paddingVertical: spacing[4], alignItems: 'center', ...shadows.card },
  addBtnTxt:{ color: '#fff', fontSize: typography.sizes.base, fontWeight: '700' },
});
