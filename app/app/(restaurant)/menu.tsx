import React from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantsApi } from '@/services/restaurants';
import { useTheme } from '@/hooks/useTheme';
import { EmptyState, Skeleton } from '@/components/ui';
import { spacing, typography, borderRadius, shadows } from '@/theme';
import { formatCurrency } from '@/utils/format';
import type { MenuCategory, MenuItem } from '@/types/api';

export default function MenuManagementScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();

  // Fetch owner's own restaurant directly via /restaurants/mine
  const { data: myRestaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: () => restaurantsApi.getMyRestaurant().then((r) => r.data),
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['restaurant-menu', myRestaurant?.id],
    queryFn: () => restaurantsApi.getMenu(myRestaurant!.id).then((r) => r.data),
    enabled: !!myRestaurant,
  });

  const toggleItem = useMutation({
    mutationFn: ({ id, is_available }: { id: string; is_available: boolean }) =>
      restaurantsApi.updateItem(id, { is_available }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restaurant-menu'] }),
  });

  if (isLoading || restaurantLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: spacing[4], gap: 12 }}>
          {[1, 2, 3].map((n) => <Skeleton key={n} height={60} borderRadius={8} />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Menu</Text>
        <Pressable onPress={() => Toast.show({ type: 'info', text1: 'Category creation — coming soon' })}>
          <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
        </Pressable>
      </View>

      {categories.length === 0 ? (
        <EmptyState icon="restaurant-outline" title="No menu yet" message="Add categories and items to get started." />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}
          renderItem={({ item: cat }: { item: MenuCategory }) => (
            <View style={[styles.section, { backgroundColor: colors.surface }, shadows.sm]}>
              <View style={styles.catHeader}>
                <Text style={[styles.catName, { color: colors.textPrimary }]}>{cat.name}</Text>
                <Pressable onPress={() => Toast.show({ type: 'info', text1: 'Edit category' })}>
                  <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
              {cat.items.map((item: MenuItem) => (
                <View key={item.id} style={[styles.itemRow, { borderTopColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: item.is_available ? colors.textPrimary : colors.textTertiary }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemPrice, { color: colors.primary }]}>{formatCurrency(item.price)}</Text>
                  </View>
                  <Switch
                    value={item.is_available}
                    onValueChange={(v) => toggleItem.mutate({ id: item.id, is_available: v })}
                    trackColor={{ false: colors.border, true: colors.primary + '60' }}
                    thumbColor={item.is_available ? colors.primary : colors.textTertiary}
                  />
                </View>
              ))}
              <Pressable
                onPress={() => Toast.show({ type: 'info', text1: 'Add item — coming soon' })}
                style={[styles.addItemBtn, { borderColor: colors.border }]}
              >
                <Ionicons name="add" size={16} color={colors.textSecondary} />
                <Text style={[styles.addItemText, { color: colors.textSecondary }]}>Add item</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  section: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  catHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  catName: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: spacing[3], borderTopWidth: 1 },
  itemName: { fontSize: typography.sizes.base, fontWeight: typography.weights.medium },
  itemPrice: { fontSize: typography.sizes.sm, marginTop: 2 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[3], borderTopWidth: 1 },
  addItemText: { fontSize: typography.sizes.sm },
});
