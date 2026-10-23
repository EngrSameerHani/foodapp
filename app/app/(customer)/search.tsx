import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useTheme } from '@/hooks/useTheme';
import { EmptyState, RestaurantCardSkeleton } from '@/components/ui';
import { spacing, typography, borderRadius } from '@/theme';

export default function SearchScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const { data, isLoading } = useRestaurants({});
  const restaurants = data?.pages.flatMap((p) => p.data) ?? [];
  const filtered = query
    ? restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.cuisine_types.some((c) => c.toLowerCase().includes(query.toLowerCase())),
      )
    : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search restaurants or dishes…"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.textPrimary }]}
            autoFocus
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading && query.length > 0 && (
        <View style={{ padding: spacing[4], gap: 16 }}>
          {[1, 2].map((n) => <RestaurantCardSkeleton key={n} />)}
        </View>
      )}

      {query.length === 0 && (
        <View style={{ padding: spacing[4] }}>
          <Text style={[styles.hint, { color: colors.textTertiary }]}>Start typing to search…</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing[4] }}
        ListEmptyComponent={
          query.length > 0 && !isLoading ? (
            <EmptyState icon="search-outline" title="No results" message={`Nothing found for "${query}"`} />
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(customer)/restaurant/${item.id}`)}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>{item.cuisine_types.join(' · ')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: borderRadius.lg, paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  input: { flex: 1, fontSize: typography.sizes.base },
  hint: { fontSize: typography.sizes.base, textAlign: 'center', marginTop: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: borderRadius.md, borderWidth: 1, marginBottom: spacing[2] },
  name: { fontSize: typography.sizes.base, fontWeight: typography.weights.medium },
  sub: { fontSize: typography.sizes.sm, marginTop: 2 },
});
