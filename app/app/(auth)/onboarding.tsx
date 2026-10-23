import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { spacing, typography } from '@/theme';
import { palette } from '@/theme/colors';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'restaurant-outline' as const,
    title: 'Discover Restaurants',
    description: 'Browse hundreds of local restaurants and find your next favourite meal.',
  },
  {
    id: '2',
    icon: 'bicycle-outline' as const,
    title: 'Fast Delivery',
    description: 'Track your rider in real time as your food makes its way to you.',
  },
  {
    id: '3',
    icon: 'heart-outline' as const,
    title: 'Made for You',
    description: 'Save your favourites, reorder in a tap, and enjoy exclusive deals.',
  },
];

export default function Onboarding() {
  const { colors } = useTheme();
  const [current, setCurrent] = useState(0);
  const listRef = useRef<FlatList>(null);
  const { setHasSeenOnboarding } = useSettingsStore();

  const finish = async () => {
    await setHasSeenOnboarding(true);
    router.replace('/(auth)/login');
  };

  const next = () => {
    if (current < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: current + 1 });
      setCurrent(current + 1);
    } else {
      finish();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable onPress={finish} style={styles.skip}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.base }}>Skip</Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name={item.icon} size={72} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === current ? colors.primary : colors.border },
              i === current && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <Button
        title={current < slides.length - 1 ? 'Next' : 'Get Started'}
        onPress={next}
        fullWidth
        size="lg"
        style={styles.btn}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skip: { alignSelf: 'flex-end', padding: spacing[4] },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[8], gap: spacing[4] },
  iconCircle: { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[4] },
  title: { fontSize: typography.sizes['3xl'], fontWeight: typography.weights.bold, textAlign: 'center' },
  desc: { fontSize: typography.sizes.md, textAlign: 'center', lineHeight: 24 },
  dotsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: spacing[6] },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  btn: { marginHorizontal: spacing[6], marginBottom: spacing[8] },
});
