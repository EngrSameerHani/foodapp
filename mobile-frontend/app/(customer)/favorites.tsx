import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }          from '../../src/hooks/useTheme';
import { useAppStore }       from '../../src/store/appStore';
import { restaurantService } from '../../src/services';
import { Empty }             from '../../src/components/ui';
import { spacing, typography, radius, shadows } from '../../src/theme';
import { fmt } from '../../src/utils';
import type { Restaurant } from '../../src/types';

export default function Favorites() {
  const { colors } = useTheme();
  const { favorites, toggleFavorite } = useAppStore();
  const [all, setAll] = useState<Restaurant[]>([]);
  useEffect(() => { restaurantService.list().then(setAll); }, []);
  const favs = all.filter((r) => favorites.includes(r.id));

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Favorites</Text>
      </View>
      <FlatList data={favs} keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
        ListEmptyComponent={<Empty icon="heart-outline" title="No favorites yet" message="Tap the heart on any restaurant to save it here." actionLabel="Browse" onAction={() => router.push('/(customer)/')} />}
        renderItem={({ item: r }) => (
          <Pressable onPress={() => router.push(`/(customer)/restaurant/${r.id}`)}
            style={[s.card, { backgroundColor: colors.surface }, shadows.sm]}>
            <View style={[s.thumb, { backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="restaurant-outline" size={32} color={colors.textTertiary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.name, { color: colors.textPrimary }]}>{r.name}</Text>
              <Text style={[s.cuisine, { color: colors.textSecondary }]}>{r.cuisine_types.join(' · ')}</Text>
              <View style={s.meta}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={[s.metaTxt, { color: colors.textPrimary }]}>{r.rating.toFixed(1)}</Text>
                <Text style={[s.metaTxt, { color: colors.textSecondary }]}>· {r.estimated_delivery_minutes} min</Text>
              </View>
            </View>
            <Pressable onPress={() => toggleFavorite(r.id)} style={{ padding: spacing[3] }}>
              <Ionicons name="heart" size={22} color={colors.error} />
            </Pressable>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { padding: spacing[4] },
  title:  { fontSize: typography.sizes.xl, fontWeight: '700' },
  card:   { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, overflow: 'hidden' },
  thumb:  { width: 88, height: 88 },
  name:   { fontSize: typography.sizes.base, fontWeight: '600', padding: spacing[3], paddingBottom: 0 },
  cuisine:{ fontSize: typography.sizes.sm, paddingHorizontal: spacing[3] },
  meta:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[3], paddingTop: 4 },
  metaTxt:{ fontSize: typography.sizes.sm },
});
