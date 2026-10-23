import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useTheme } from '@/hooks/useTheme';
import { useFavoritesStore } from '@/store/favoritesStore';
import { RestaurantCardSkeleton, Badge, statusBadgeVariant } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { spacing, typography, borderRadius, shadows } from '@/theme';
import { formatCurrency } from '@/utils/format';
import type { Restaurant } from '@/types/api';

const CUISINES = ['All', 'Burgers', 'Pizza', 'Asian', 'African', 'Kenyan', 'Ramen', 'Fast Food'];
const SORTS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Rating', value: 'rating' },
  { label: 'Delivery Time', value: 'delivery_time' },
] as const;

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const { colors } = useTheme();
  const { isFavorite, toggle } = useFavoritesStore();
  const fav = isFavorite(restaurant.id);

  return (
    <Pressable
      onPress={() => router.push(`/(customer)/restaurant/${restaurant.id}`)}
      style={[styles.card, { backgroundColor: colors.surface }, shadows.md]}
    >
      <View style={styles.coverContainer}>
        {restaurant.cover_url ? (
          <Image source={{ uri: restaurant.cover_url }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, { backgroundColor: colors.borderLight ?? colors.border, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textTertiary} />
          </View>
        )}
        <Pressable onPress={() => toggle(restaurant.id)} style={[styles.heartBtn, { backgroundColor: colors.surface }]}>
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? colors.error : colors.textSecondary} />
        </Pressable>
        {!restaurant.is_active && (
          <View style={[styles.closedOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <Text style={styles.closedText}>Closed</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.restaurantName, { color: colors.textPrimary }]} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <Text style={[styles.cuisine, { color: colors.textSecondary }]} numberOfLines={1}>
          {restaurant.cuisine_types.join(' • ')}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={[styles.metaText, { color: colors.textPrimary }]}>{restaurant.rating.toFixed(1)}</Text>
          </View>
          <Text style={[styles.metaDot, { color: colors.textTertiary }]}>·</Text>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{restaurant.estimated_delivery_minutes} min</Text>
          </View>
          <Text style={[styles.metaDot, { color: colors.textTertiary }]}>·</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {formatCurrency(restaurant.delivery_fee)} delivery
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const [cuisine, setCuisine] = useState<string>('All');
  const [sort, setSort] = useState<'relevance' | 'rating' | 'delivery_time'>('relevance');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useRestaurants({
    cuisine: cuisine === 'All' ? undefined : cuisine,
    sort,
  });

  const restaurants = data?.pages.flatMap((p) => p.data) ?? [];
  const filtered = search
    ? restaurants.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine_types.some((c) => c.toLowerCase().includes(search.toLowerCase())),
      )
    : restaurants;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.textPrimary }]} numberOfLines={1}>
            San Francisco, CA
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </View>
        <Pressable onPress={() => {}}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <>
            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search restaurants or dishes…"
                placeholderTextColor={colors.textTertiary}
                style={[styles.searchInput, { color: colors.textPrimary }]}
                onFocus={() => router.push('/(customer)/search')}
              />
            </View>

            {/* Cuisine chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {CUISINES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCuisine(c)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: c === cuisine ? colors.primary : colors.surface,
                      borderColor: c === cuisine ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: c === cuisine ? '#fff' : colors.textSecondary }]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Sort */}
            <View style={styles.sortRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Restaurants Near You</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {SORTS.map((s) => (
                    <Pressable
                      key={s.value}
                      onPress={() => setSort(s.value)}
                      style={[styles.sortBtn, { backgroundColor: sort === s.value ? colors.primary + '15' : 'transparent' }]}
                    >
                      <Text style={[styles.sortText, { color: sort === s.value ? colors.primary : colors.textSecondary }]}>
                        {s.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {isLoading && (
              <View style={{ gap: 16 }}>
                {[1, 2, 3].map((n) => <RestaurantCardSkeleton key={n} />)}
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="restaurant-outline"
              title="No restaurants found"
              message="Try changing your filters or search term."
            />
          ) : null
        }
        renderItem={({ item }) => <RestaurantCard restaurant={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  locationText: { fontSize: typography.sizes.base, fontWeight: typography.weights.medium, flex: 1 },
  list: { padding: spacing[4], gap: 0 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: borderRadius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[3], marginBottom: spacing[3] },
  searchInput: { flex: 1, fontSize: typography.sizes.base },
  chips: { marginBottom: spacing[4] },
  chip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full, marginRight: spacing[2], borderWidth: 1 },
  chipText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] },
  sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  sortBtn: { paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: borderRadius.full },
  sortText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  card: { borderRadius: borderRadius.lg, marginBottom: spacing[4], overflow: 'hidden' },
  coverContainer: { position: 'relative' },
  cover: { width: '100%', height: 160 },
  heartBtn: { position: 'absolute', top: spacing[2], right: spacing[2], width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  closedOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  closedText: { color: '#fff', fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  cardBody: { padding: spacing[3], gap: 4 },
  restaurantName: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  cuisine: { fontSize: typography.sizes.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaText: { fontSize: typography.sizes.sm },
  metaDot: { fontSize: typography.sizes.sm },
});
