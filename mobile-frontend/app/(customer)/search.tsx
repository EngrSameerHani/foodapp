import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }          from '../../src/hooks/useTheme';
import { restaurantService } from '../../src/services';
import { Empty }             from '../../src/components/ui';
import { spacing, typography, radius } from '../../src/theme';
import type { Restaurant } from '../../src/types';

export default function Search() {
  const { colors } = useTheme();
  const [all,    setAll]    = useState<Restaurant[]>([]);
  const [query,  setQuery]  = useState('');

  useEffect(() => { restaurantService.list().then(setAll); }, []);

  const results = query.length > 1
    ? all.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.cuisine_types.some((c) => c.toLowerCase().includes(query.toLowerCase())))
    : [];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={[s.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search restaurants or dishes…"
            placeholderTextColor={colors.textTertiary} style={[s.input, { color: colors.textPrimary }]} autoFocus />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}><Ionicons name="close-circle" size={18} color={colors.textTertiary} /></Pressable>
          )}
        </View>
      </View>

      {query.length <= 1
        ? <Text style={[s.hint, { color: colors.textTertiary }]}>Start typing to search…</Text>
        : (
          <FlatList data={results} keyExtractor={(r) => r.id}
            contentContainerStyle={{ padding: spacing[4] }}
            ListEmptyComponent={<Empty icon="search-outline" title="No results" message={`Nothing found for "${query}"`} />}
            renderItem={({ item: r }) => (
              <Pressable onPress={() => router.push(`/(customer)/restaurant/${r.id}`)}
                style={[s.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.name, { color: colors.textPrimary }]}>{r.name}</Text>
                  <Text style={[s.sub, { color: colors.textSecondary }]}>{r.cuisine_types.join(' · ')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </Pressable>
            )}
          />
        )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1 },
  header:{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  bar:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: radius.lg, paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  input: { flex: 1, fontSize: typography.sizes.base },
  hint:  { textAlign: 'center', marginTop: spacing[8], fontSize: typography.sizes.base },
  row:   { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: radius.md, borderWidth: 1, marginBottom: spacing[2] },
  name:  { fontSize: typography.sizes.base, fontWeight: '500' },
  sub:   { fontSize: typography.sizes.sm, marginTop: 2 },
});
