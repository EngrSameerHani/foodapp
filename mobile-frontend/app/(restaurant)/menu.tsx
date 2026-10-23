import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }          from '../../src/hooks/useTheme';
import { restaurantService } from '../../src/services';
import { Empty, Skeleton, Toast } from '../../src/components/ui';
import { spacing, typography, radius, shadows } from '../../src/theme';
import { fmt } from '../../src/utils';
import type { MenuCategory, MenuItem, Restaurant } from '../../src/types';

export default function Menu() {
  const { colors } = useTheme();
  const [rest,    setRest]    = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    restaurantService.getMine().then(setRest).finally(() => setLoading(false));
  }, []);

  const toggleItem = async (item: MenuItem) => {
    if (!rest) return;
    setToggling(item.id);
    try {
      await restaurantService.toggleItem(item.id, !item.is_available);
      // Optimistic update
      setRest((r) => r ? ({
        ...r,
        categories: r.categories?.map((c) => ({
          ...c,
          items: c.items.map((i) => i.id === item.id ? { ...i, is_available: !i.is_available } : i),
        })),
      }) : r);
      Toast.show(`${item.name} ${!item.is_available ? 'enabled' : 'disabled'}`, 'success');
    } finally { setToggling(null); }
  };

  if (loading) return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <View style={{ padding: spacing[4], gap: 12 }}>
        {[1,2,3].map((n) => <Skeleton key={n} height={60} br={8} />)}
      </View>
    </SafeAreaView>
  );

  const cats = rest?.categories ?? [];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Menu</Text>
        <Pressable onPress={() => Toast.show('Category creation — connect backend to enable', 'info')}>
          <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
        </Pressable>
      </View>

      {cats.length === 0
        ? <Empty icon="restaurant-outline" title="No menu yet" />
        : (
          <FlatList data={cats} keyExtractor={(c) => c.id}
            contentContainerStyle={{ padding: spacing[4], gap: spacing[4] }}
            renderItem={({ item: cat }: { item: MenuCategory }) => (
              <View style={[s.section, { backgroundColor: colors.surface }, shadows.sm]}>
                <View style={s.catHeader}>
                  <Text style={[s.catName, { color: colors.textPrimary }]}>{cat.name}</Text>
                  <Text style={[s.catCount, { color: colors.textSecondary }]}>{cat.items.length} items</Text>
                </View>
                {cat.items.map((item: MenuItem) => (
                  <View key={item.id} style={[s.itemRow, { borderTopColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.itemName, { color: item.is_available ? colors.textPrimary : colors.textTertiary }]}>{item.name}</Text>
                      {item.description && <Text style={[s.itemDesc, { color: colors.textSecondary }]} numberOfLines={1}>{item.description}</Text>}
                      <Text style={[s.itemPrice, { color: colors.primary }]}>{fmt.currency(item.price)}</Text>
                    </View>
                    <Switch
                      value={item.is_available}
                      disabled={toggling === item.id}
                      onValueChange={() => toggleItem(item)}
                      trackColor={{ false: colors.border, true: colors.primary + '66' }}
                      thumbColor={item.is_available ? colors.primary : colors.textTertiary}
                    />
                  </View>
                ))}
              </View>
            )}
          />
        )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  title:    { fontSize: typography.sizes.xl, fontWeight: '700' },
  section:  { borderRadius: radius.lg, overflow: 'hidden' },
  catHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  catName:  { fontSize: typography.sizes.base, fontWeight: '700' },
  catCount: { fontSize: typography.sizes.sm },
  itemRow:  { flexDirection: 'row', alignItems: 'center', padding: spacing[3], borderTopWidth: 1 },
  itemName: { fontSize: typography.sizes.base, fontWeight: '500' },
  itemDesc: { fontSize: typography.sizes.sm, marginTop: 2 },
  itemPrice:{ fontSize: typography.sizes.sm, marginTop: 2 },
});
