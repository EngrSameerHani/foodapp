import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurant } from '@/hooks/useRestaurants';
import { useCartStore } from '@/store/cartStore';
import { useTheme } from '@/hooks/useTheme';
import { MenuItemSkeleton, Button, EmptyState } from '@/components/ui';
import { spacing, typography, borderRadius, shadows } from '@/theme';
import { formatCurrency } from '@/utils/format';
import type { MenuItem, MenuCategory, ItemVariation } from '@/types/api';
// Simple collision-resistant local ID — no native module required
function localUuid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function ItemDetailSheet({
  item,
  restaurantId,
  restaurantName,
  onClose,
}: {
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { addItem, restaurantId: cartRestaurantId, clear } = useCartStore();
  const [qty, setQty] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState('');

  const optionsDelta = Object.values(selectedOptions)
    .flat()
    .reduce((sum, optName) => {
      for (const v of item.variations) {
        const opt = v.options.find((o) => o.name === optName);
        if (opt) return sum + opt.price_delta;
      }
      return sum;
    }, 0);

  const unitPrice = item.price + optionsDelta;

  const handleAdd = () => {
    if (cartRestaurantId && cartRestaurantId !== restaurantId) {
      Alert.alert(
        'Start a new cart?',
        'Your cart contains items from a different restaurant. Starting a new cart will clear your current cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear & Add',
            style: 'destructive',
            onPress: () => {
              clear();
              _doAdd();
              onClose();
            },
          },
        ],
      );
      return;
    }
    _doAdd();
    onClose();
  };

  const _doAdd = () => {
    const opts = Object.entries(selectedOptions).flatMap(([varId, names]) =>
      names.map((name) => {
        const v = item.variations.find((v) => v.id === varId);
        const opt = v?.options.find((o) => o.name === name);
        return { variation_id: varId, option_name: name, price_delta: opt?.price_delta ?? 0 };
      }),
    );
    addItem(restaurantId, restaurantName, {
      id: localUuid(),
      item_id: item.id,
      item_name: item.name,
      unit_price: unitPrice,
      quantity: qty,
      selected_options: opts,
      special_note: note || null,
    });
  };

  const toggleOption = (variation: ItemVariation, optName: string) => {
    setSelectedOptions((prev) => {
      const current = prev[variation.id] ?? [];
      if (variation.is_multi_select) {
        return {
          ...prev,
          [variation.id]: current.includes(optName)
            ? current.filter((n) => n !== optName)
            : [...current, optName],
        };
      }
      return { ...prev, [variation.id]: [optName] };
    });
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView>
          {item.photo_url && <Image source={{ uri: item.photo_url }} style={styles.sheetPhoto} />}
          <View style={{ padding: spacing[4] }}>
            <Pressable onPress={onClose} style={styles.sheetClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.sheetName, { color: colors.textPrimary }]}>{item.name}</Text>
            {item.description && (
              <Text style={[styles.sheetDesc, { color: colors.textSecondary }]}>{item.description}</Text>
            )}
            <Text style={[styles.sheetPrice, { color: colors.primary }]}>{formatCurrency(unitPrice)}</Text>

            {item.variations.map((v) => (
              <View key={v.id} style={styles.variationSection}>
                <Text style={[styles.variationLabel, { color: colors.textPrimary }]}>
                  {v.label} {v.is_required && <Text style={{ color: colors.error }}>*</Text>}
                </Text>
                {v.options.map((opt) => {
                  const selected = (selectedOptions[v.id] ?? []).includes(opt.name);
                  return (
                    <Pressable
                      key={opt.name}
                      onPress={() => toggleOption(v, opt.name)}
                      style={[styles.optionRow, { borderColor: selected ? colors.primary : colors.border }]}
                    >
                      <Text style={[styles.optionName, { color: colors.textPrimary }]}>{opt.name}</Text>
                      {opt.price_delta !== 0 && (
                        <Text style={[styles.optionDelta, { color: colors.textSecondary }]}>
                          +{formatCurrency(opt.price_delta)}
                        </Text>
                      )}
                      <View style={[styles.check, { borderColor: colors.primary, backgroundColor: selected ? colors.primary : 'transparent' }]}>
                        {selected && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <View style={{ marginTop: spacing[4] }}>
              <Text style={[styles.variationLabel, { color: colors.textPrimary }]}>Special instructions</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="No onions, extra sauce…"
                placeholderTextColor={colors.textTertiary}
                multiline
                style={[styles.noteInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
              />
            </View>

            {/* Quantity + Add */}
            <View style={styles.qtyRow}>
              <View style={[styles.stepper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Pressable onPress={() => setQty(Math.max(1, qty - 1))} style={styles.stepBtn}>
                  <Ionicons name="remove" size={18} color={colors.textPrimary} />
                </Pressable>
                <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{qty}</Text>
                <Pressable onPress={() => setQty(qty + 1)} style={styles.stepBtn}>
                  <Ionicons name="add" size={18} color={colors.textPrimary} />
                </Pressable>
              </View>
              <Button
                title={`Add  ${formatCurrency(unitPrice * qty)}`}
                onPress={handleAdd}
                style={{ flex: 1 }}
              />
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
  const { data: restaurant, isLoading } = useRestaurant(id);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: spacing[4], gap: 16 }}>
          {[1, 2, 3].map((n) => <MenuItemSkeleton key={n} />)}
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return <EmptyState icon="alert-circle-outline" title="Restaurant not found" />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView>
        {/* Cover */}
        <View style={styles.coverWrapper}>
          {restaurant.cover_url ? (
            <Image source={{ uri: restaurant.cover_url }} style={styles.restaurantCover} />
          ) : (
            <View style={[styles.restaurantCover, { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="restaurant" size={64} color={colors.textTertiary} />
            </View>
          )}
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.restName, { color: colors.textPrimary }]}>{restaurant.name}</Text>
          {restaurant.description && (
            <Text style={[styles.restDesc, { color: colors.textSecondary }]}>{restaurant.description}</Text>
          )}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                {restaurant.rating.toFixed(1)} ({restaurant.review_count})
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                {restaurant.estimated_delivery_minutes} min
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="bicycle-outline" size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                {formatCurrency(restaurant.delivery_fee)} delivery
              </Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        {(restaurant.categories ?? []).map((cat: MenuCategory) => (
          <View key={cat.id} style={{ marginTop: spacing[2] }}>
            <Text style={[styles.catHeader, { color: colors.textPrimary, backgroundColor: colors.background }]}>
              {cat.name}
            </Text>
            {cat.items.map((item: MenuItem) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedItem(item)}
                style={[styles.menuItem, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight ?? colors.border }]}
                disabled={!item.is_available}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: item.is_available ? colors.textPrimary : colors.textTertiary }]}>
                    {item.name}
                  </Text>
                  {item.description && (
                    <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <Text style={[styles.itemPrice, { color: item.is_available ? colors.primary : colors.textTertiary }]}>
                    {formatCurrency(item.price)}
                  </Text>
                </View>
                {item.photo_url ? (
                  <Image source={{ uri: item.photo_url }} style={styles.itemPhoto} />
                ) : (
                  <View style={[styles.itemPhoto, { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="fast-food-outline" size={28} color={colors.textTertiary} />
                  </View>
                )}
                {item.is_available && (
                  <View style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>

      {selectedItem && (
        <ItemDetailSheet
          item={selectedItem}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  coverWrapper: { position: 'relative' },
  restaurantCover: { width: '100%', height: 200 },
  backBtn: { position: 'absolute', top: spacing[4], left: spacing[4], width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  infoCard: { padding: spacing[4], gap: 6 },
  restName: { fontSize: typography.sizes['2xl'], fontWeight: typography.weights.bold },
  restDesc: { fontSize: typography.sizes.base, lineHeight: 22 },
  infoRow: { flexDirection: 'row', gap: spacing[4], marginTop: 4 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  catHeader: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing[4], borderBottomWidth: 1, gap: spacing[3] },
  itemName: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold },
  itemDesc: { fontSize: typography.sizes.sm, marginTop: 2, lineHeight: 18 },
  itemPrice: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold, marginTop: 4 },
  itemPhoto: { width: 88, height: 88, borderRadius: borderRadius.md },
  addBtn: { position: 'absolute', bottom: spacing[3], right: spacing[3], width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  // Sheet styles
  sheetPhoto: { width: '100%', height: 220 },
  sheetClose: { position: 'absolute', top: -220 + spacing[3], right: spacing[3], zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  sheetName: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginTop: spacing[2] },
  sheetDesc: { fontSize: typography.sizes.base, lineHeight: 22, marginTop: 4 },
  sheetPrice: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginTop: 4 },
  variationSection: { marginTop: spacing[4] },
  variationLabel: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, marginBottom: spacing[2] },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: spacing[3], borderWidth: 1.5, borderRadius: borderRadius.md, marginBottom: spacing[2] },
  optionName: { flex: 1, fontSize: typography.sizes.base },
  optionDelta: { fontSize: typography.sizes.sm, marginRight: spacing[2] },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  noteInput: { borderWidth: 1.5, borderRadius: borderRadius.md, padding: spacing[3], minHeight: 80, fontSize: typography.sizes.base },
  qtyRow: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[5], alignItems: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: borderRadius.full, overflow: 'hidden' },
  stepBtn: { padding: spacing[3] },
  qtyText: { paddingHorizontal: spacing[4], fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
});
