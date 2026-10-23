import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useTheme } from '@/hooks/useTheme';
import { EmptyState } from '@/components/ui';
import { spacing, typography, borderRadius, shadows } from '@/theme';
import { formatCurrency } from '@/utils/format';

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const { ids, toggle } = useFavoritesStore();
  const { data } = useRestaurants({});
  const all = data?.pages.flatMap((p) => p.data) ?? [];
  const favorites = all.filter((r) => ids.includes(r.id));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Favorites</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="No favorites yet"
            message="Tap the heart icon on any restaurant to save it here."
            actionLabel="Browse Restaurants"
            onAction={() => router.push('/(customer)/')}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
            style={[styles.card, { backgroundColor: colors.surface }, shadows.sm]}
          >
            {item.cover_url ? (
              <Image source={{ uri: item.cover_url }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="restaurant-outline" size={36} color={colors.textTertiary} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.cuisine, { color: colors.textSecondary }]}>{item.cuisine_types.join(' · ')}</Text>
              <View style={styles.meta}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={[styles.metaText, { color: colors.textPrimary }]}>{item.rating.toFixed(1)}</Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>· {item.estimated_delivery_minutes} min</Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>· {formatCurrency(item.delivery_fee)}</Text>
              </View>
            </View>
            <Pressable onPress={() => toggle(item.id)} style={styles.heartBtn}>
              <Ionicons name="heart" size={22} color={colors.error} />
            </Pressable>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing[4] },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, overflow: 'hidden' },
  cover: { width: 90, height: 90 },
  info: { flex: 1, padding: spacing[3], gap: 2 },
  name: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold },
  cuisine: { fontSize: typography.sizes.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { fontSize: typography.sizes.sm },
  heartBtn: { padding: spacing[3] },
});
