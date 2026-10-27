import React, { useEffect, useState } from 'react';
import {
  FlatList, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }         from '../../src/hooks/useTheme';
import { useAuthStore }     from '../../src/store/authStore';
import { useAppStore }      from '../../src/store/appStore';
import { restaurantService } from '../../src/services';
import { CardSkeleton }     from '../../src/components/ui';
import { palette, spacing, radius, typography, shadows } from '../../src/theme';
import { fmt } from '../../src/utils';
import type { Restaurant } from '../../src/types';

// ─── Category data ────────────────────────────────────────────────────────────
const CATS = [
  { id: 'all',     label: 'All',      emoji: '🍽️' },
  { id: 'burgers', label: 'Burgers',  emoji: '🍔' },
  { id: 'pizza',   label: 'Pizza',    emoji: '🍕' },
  { id: 'chinese', label: 'Chinese',  emoji: '🥡' },
  { id: 'desi',    label: 'Desi',     emoji: '🍛' },
  { id: 'healthy', label: 'Healthy',  emoji: '🥗' },
  { id: 'desserts',label: 'Desserts', emoji: '🍰' },
  { id: 'drinks',  label: 'Drinks',   emoji: '🧃' },
];

// ─── Restaurant card ──────────────────────────────────────────────────────────
function RestCard({ r }: { r: Restaurant }) {
  const { colors } = useTheme();
  const { isFavorite, toggleFavorite } = useAppStore();
  const fav = isFavorite(r.id);

  return (
    <Pressable onPress={() => router.push(`/(customer)/restaurant/${r.id}`)}
      style={[st.card, { backgroundColor: colors.surface }, shadows.md]}>
      {/* Cover */}
      <View style={[st.cover, { backgroundColor: palette.orangeBg }]}>
        <Text style={st.coverEmoji}>🍽️</Text>
        {!r.is_active && (
          <View style={st.closedBadge}><Text style={st.closedTxt}>Closed</Text></View>
        )}
        <Pressable onPress={() => toggleFavorite(r.id)} style={[st.heartBtn, { backgroundColor: colors.surface }]}>
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={18}
            color={fav ? palette.error : colors.textSecondary} />
        </Pressable>
      </View>
      {/* Info */}
      <View style={st.cardInfo}>
        <Text style={[st.cardName, { color: colors.textPrimary }]} numberOfLines={1}>{r.name}</Text>
        <Text style={[st.cardCuisine, { color: colors.textSecondary }]} numberOfLines={1}>
          {r.cuisine_types.join(' • ')}
        </Text>
        <View style={st.cardMeta}>
          <View style={st.metaChip}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={[st.metaTxt, { color: colors.textPrimary }]}>{r.rating.toFixed(1)}</Text>
          </View>
          <View style={[st.metaDot, { backgroundColor: colors.border }]} />
          <View style={st.metaChip}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={[st.metaTxt, { color: colors.textSecondary }]}>{r.estimated_delivery_minutes} min</Text>
          </View>
          <View style={[st.metaDot, { backgroundColor: colors.border }]} />
          <Text style={[st.metaTxt, { color: colors.textSecondary }]}>{fmt.currency(r.delivery_fee)} delivery</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function Home() {
  const { colors } = useTheme();
  const { user }   = useAuthStore();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const cuisine = activeCat === 'all' ? undefined : activeCat;
      setRestaurants(await restaurantService.list({ cuisine }));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [activeCat]);

  const shown = search
    ? restaurants.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine_types.some((c) => c.toLowerCase().includes(search.toLowerCase())))
    : restaurants;

  return (
    <SafeAreaView style={[st.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={shown}
        keyExtractor={(r) => r.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing[10] }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={palette.orange} />}
        ListEmptyComponent={loading
          ? <View style={{ padding: spacing[4], gap: 16 }}>{[1,2,3].map((n)=><CardSkeleton key={n}/>)}</View>
          : <View style={st.empty}><Text style={{ fontSize: 48 }}>🔍</Text><Text style={{ color: colors.textSecondary, marginTop: 8 }}>No restaurants found</Text></View>}

        ListHeaderComponent={
          <View>
            {/* ── Header ── */}
            <View style={[st.header, { backgroundColor: colors.surface }]}>
              <View style={st.locRow}>
                <Ionicons name="location" size={18} color={palette.orange} />
                <Text style={[st.locCity, { color: colors.textPrimary }]}>Islamabad</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
              </View>
              <Pressable onPress={() => {}}>
                <View style={[st.bellWrap, { backgroundColor: colors.background }]}>
                  <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
                  <View style={st.bellDot} />
                </View>
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: spacing[4] }}>
              {/* ── Search ── */}
              <View style={[st.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.sm]}>
                <Ionicons name="search" size={18} color={palette.orange} />
                <TextInput
                  value={search} onChangeText={setSearch}
                  placeholder="Search restaurants, food..."
                  placeholderTextColor={colors.textTertiary}
                  style={[st.searchInput, { color: colors.textPrimary }]}
                  onFocus={() => router.push('/(customer)/search')}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>

              {/* ── Hot Deals Banner ── */}
              <View style={st.banner}>
                <View style={{ flex: 1 }}>
                  <Text style={st.bannerEyebrow}>Hot Deals</Text>
                  <Text style={st.bannerTitle}>Up to 50% OFF</Text>
                  <Text style={st.bannerSub}>On your favourite meals</Text>
                  <Pressable style={st.bannerBtn}>
                    <Text style={st.bannerBtnTxt}>Order Now</Text>
                  </Pressable>
                </View>
                <Text style={st.bannerEmoji}>🍔</Text>
              </View>

              {/* ── Category chips ── */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                style={st.catsScroll} contentContainerStyle={{ gap: spacing[2] }}>
                {CATS.map((c) => {
                  const active = activeCat === c.id;
                  return (
                    <Pressable key={c.id} onPress={() => setActiveCat(c.id)}
                      style={[st.catChip, {
                        backgroundColor: active ? palette.orange : colors.surface,
                        borderColor: active ? palette.orange : colors.border,
                      }, active && shadows.sm]}>
                      <Text style={st.catEmoji}>{c.emoji}</Text>
                      <Text style={[st.catLabel, { color: active ? '#fff' : colors.textSecondary }]}>
                        {c.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* ── Section header ── */}
              <View style={st.sectionRow}>
                <Text style={[st.sectionTitle, { color: colors.textPrimary }]}>Popular Restaurants</Text>
                <Pressable><Text style={[st.seeAll, { color: palette.orange }]}>See All →</Text></Pressable>
              </View>
            </View>
          </View>
        }

        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing[4] }}>
            <RestCard r={item} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root:        { flex: 1 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  locRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  locCity:     { fontSize: typography.sizes.body, fontWeight: '600' },
  bellWrap:    { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bellDot:     { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: palette.orange },

  // Search
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2], borderWidth: 1.5, borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[3], marginVertical: spacing[3] },
  searchInput: { flex: 1, fontSize: typography.sizes.body },

  // Banner
  banner:      { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.textPrimary, borderRadius: radius.xl, padding: spacing[5], marginBottom: spacing[4], overflow: 'hidden' },
  bannerEyebrow:{ color: palette.orange, fontSize: typography.sizes.base, fontWeight: '600', marginBottom: 2 },
  bannerTitle: { color: '#fff', fontSize: typography.sizes.xl, fontWeight: '800', lineHeight: 26 },
  bannerSub:   { color: 'rgba(255,255,255,0.65)', fontSize: typography.sizes.sm, marginTop: 2 },
  bannerBtn:   { marginTop: spacing[3], backgroundColor: palette.orange, borderRadius: radius.full, paddingHorizontal: spacing[4], paddingVertical: spacing[2], alignSelf: 'flex-start' },
  bannerBtnTxt:{ color: '#fff', fontSize: typography.sizes.sm, fontWeight: '700' },
  bannerEmoji: { fontSize: 80, marginRight: -spacing[2] },

  // Categories
  catsScroll:  { marginBottom: spacing[4] },
  catChip:     { flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1.5 },
  catEmoji:    { fontSize: 16 },
  catLabel:    { fontSize: typography.sizes.sm, fontWeight: '500' },

  // Section
  sectionRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] },
  sectionTitle:{ fontSize: typography.sizes.lg, fontWeight: '700' },
  seeAll:      { fontSize: typography.sizes.base, fontWeight: '600' },

  // Restaurant card
  card:        { borderRadius: radius.xl, marginBottom: spacing[4], overflow: 'hidden' },
  cover:       { height: 160, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  coverEmoji:  { fontSize: 72 },
  closedBadge: { ...StyleSheet.absoluteFillObject as object, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  closedTxt:   { color: '#fff', fontWeight: '700', fontSize: typography.sizes.body },
  heartBtn:    { position: 'absolute', top: spacing[2], right: spacing[2], width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardInfo:    { padding: spacing[3], gap: spacing[1] },
  cardName:    { fontSize: typography.sizes.body, fontWeight: '700' },
  cardCuisine: { fontSize: typography.sizes.sm },
  cardMeta:    { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginTop: spacing[1] },
  metaChip:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaTxt:     { fontSize: typography.sizes.sm },
  metaDot:     { width: 3, height: 3, borderRadius: 2 },

  empty:       { alignItems: 'center', padding: spacing[12] },
});
