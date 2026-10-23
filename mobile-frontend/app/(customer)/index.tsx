import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }      from '../../src/hooks/useTheme';
import { useAppStore }   from '../../src/store/appStore';
import { restaurantService } from '../../src/services';
import { CardSkeleton, Empty } from '../../src/components/ui';
import { spacing, typography, radius, shadows } from '../../src/theme';
import { fmt } from '../../src/utils';
import type { Restaurant } from '../../src/types';

const CUISINES = ['All', 'Burgers', 'Kenyan', 'African', 'Japanese', 'Asian', 'Fast Food'];
const SORTS    = [{ label: 'Relevance', v: '' }, { label: 'Rating', v: 'rating' }, { label: 'Fastest', v: 'delivery_time' }];

function RestCard({ r }: { r: Restaurant }) {
  const { colors } = useTheme();
  const { isFavorite, toggleFavorite } = useAppStore();
  const fav = isFavorite(r.id);
  return (
    <Pressable onPress={() => router.push(`/(customer)/restaurant/${r.id}`)} style={[st.card, { backgroundColor: colors.surface }, shadows.md]}>
      <View style={[st.cover, { backgroundColor: colors.borderLight }]}>
        <Ionicons name="restaurant-outline" size={40} color={colors.textTertiary} />
        {!r.is_active && (
          <View style={[st.closedBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Closed</Text>
          </View>
        )}
        <Pressable onPress={() => toggleFavorite(r.id)} style={[st.heart, { backgroundColor: colors.surface }]}>
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={18} color={fav ? colors.error : colors.textSecondary} />
        </Pressable>
      </View>
      <View style={st.info}>
        <Text style={[st.name, { color: colors.textPrimary }]} numberOfLines={1}>{r.name}</Text>
        <Text style={[st.cuisine, { color: colors.textSecondary }]} numberOfLines={1}>{r.cuisine_types.join(' · ')}</Text>
        <View style={st.meta}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={[st.metaTxt, { color: colors.textPrimary }]}>{r.rating.toFixed(1)}</Text>
          <Text style={[st.metaTxt, { color: colors.textSecondary }]}>· {r.estimated_delivery_minutes} min · {fmt.currency(r.delivery_fee)} delivery</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function Home() {
  const { colors } = useTheme();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading]   = useState(true);
  const [cuisine, setCuisine]   = useState('All');
  const [sort,    setSort]      = useState('');
  const [search,  setSearch]    = useState('');

  const load = async () => {
    setLoading(true);
    try { setRestaurants(await restaurantService.list({ cuisine: cuisine === 'All' ? undefined : cuisine, sort: sort || undefined })); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [cuisine, sort]);

  const shown = search
    ? restaurants.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.cuisine_types.some((c) => c.toLowerCase().includes(search.toLowerCase())))
    : restaurants;

  return (
    <SafeAreaView style={[st.root, { backgroundColor: colors.background }]}>
      {/* header */}
      <View style={[st.header, { backgroundColor: colors.surface }]}>
        <View style={{ flex: 1 }}>
          <Text style={[st.loc, { color: colors.textPrimary }]}>📍 San Francisco, CA</Text>
        </View>
        <Pressable onPress={() => router.push('/(customer)/order/history')}>
          <Ionicons name="receipt-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <FlatList
        data={shown} keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing[4] }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? (
          <View style={{ gap: 16 }}>{[1, 2, 3].map((n) => <CardSkeleton key={n} />)}</View>
        ) : (
          <Empty icon="restaurant-outline" title="No restaurants found" message="Try a different filter." />
        )}
        ListHeaderComponent={
          <>
            {/* search */}
            <View style={[st.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Search restaurants…"
                placeholderTextColor={colors.textTertiary} style={[st.searchInput, { color: colors.textPrimary }]} />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={colors.textTertiary} /></Pressable>
              )}
            </View>
            {/* cuisine chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing[3] }}>
              {CUISINES.map((c) => (
                <Pressable key={c} onPress={() => setCuisine(c)}
                  style={[st.chip, { backgroundColor: c === cuisine ? colors.primary : colors.surface, borderColor: c === cuisine ? colors.primary : colors.border }]}>
                  <Text style={[st.chipTxt, { color: c === cuisine ? '#fff' : colors.textSecondary }]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {/* sort */}
            <View style={st.sortRow}>
              <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Restaurants Near You</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {SORTS.map((so) => (
                    <Pressable key={so.v} onPress={() => setSort(so.v)}
                      style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, backgroundColor: sort === so.v ? colors.primary + '18' : 'transparent' }}>
                      <Text style={{ fontSize: typography.sizes.sm, fontWeight: '500', color: sort === so.v ? colors.primary : colors.textSecondary }}>{so.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </>
        }
        renderItem={({ item }) => <RestCard r={item} />}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  loc:         { fontSize: typography.sizes.base, fontWeight: '600' },
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[3], marginBottom: spacing[3] },
  searchInput: { flex: 1, fontSize: typography.sizes.base },
  chip:        { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, marginRight: spacing[2], borderWidth: 1 },
  chipTxt:     { fontSize: typography.sizes.sm, fontWeight: '500' },
  sortRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] },
  sectionTitle:{ fontSize: typography.sizes.lg, fontWeight: '700' },
  card:        { borderRadius: radius.lg, marginBottom: spacing[4], overflow: 'hidden' },
  cover:       { height: 150, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  closedBadge: { ...StyleSheet.absoluteFillObject as object, alignItems: 'center', justifyContent: 'center' },
  heart:       { position: 'absolute', top: 8, right: 8, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  info:        { padding: spacing[3], gap: 3 },
  name:        { fontSize: typography.sizes.md, fontWeight: '600' },
  cuisine:     { fontSize: typography.sizes.sm },
  meta:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaTxt:     { fontSize: typography.sizes.sm },
});
