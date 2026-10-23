import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/appStore';
import { useTheme }    from '../../src/hooks/useTheme';
import { Button }      from '../../src/components/ui';
import { spacing, typography, radius } from '../../src/theme';

const { width } = Dimensions.get('window');
const SLIDES = [
  { id: '1', icon: 'restaurant-outline' as const, title: 'Discover Restaurants', body: 'Browse hundreds of local restaurants and cuisines near you.' },
  { id: '2', icon: 'bicycle-outline'    as const, title: 'Fast Delivery',         body: 'Track your rider in real time as your food heads your way.' },
  { id: '3', icon: 'heart-outline'      as const, title: 'Made for You',          body: 'Save favourites, reorder in a tap, and enjoy exclusive deals.' },
];

export default function Onboarding() {
  const { colors } = useTheme();
  const [cur, setCur] = useState(0);
  const listRef = useRef<FlatList>(null);
  const setDone = useAppStore((s) => s.setOnboardingDone);

  const go = async () => {
    if (cur < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: cur + 1 });
      setCur(cur + 1);
    } else {
      await setDone(true);
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <Pressable onPress={async () => { await setDone(true); router.replace('/(auth)/login'); }} style={s.skip}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.base }}>Skip</Text>
      </Pressable>

      <FlatList
        ref={listRef} data={SLIDES} keyExtractor={(x) => x.id}
        horizontal pagingEnabled scrollEnabled={false} showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={[s.slide, { width }]}>
            <View style={[s.circle, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name={item.icon} size={72} color={colors.primary} />
            </View>
            <Text style={[s.title, { color: colors.textPrimary }]}>{item.title}</Text>
            <Text style={[s.body,  { color: colors.textSecondary }]}>{item.body}</Text>
          </View>
        )}
      />

      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[s.dot, { backgroundColor: i === cur ? colors.primary : colors.border }, i === cur && { width: 24 }]} />
        ))}
      </View>

      <Button title={cur < SLIDES.length - 1 ? 'Next' : 'Get Started'} onPress={go} fullWidth size="lg" style={s.btn} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  skip:   { alignSelf: 'flex-end', padding: spacing[4] },
  slide:  { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[8], gap: spacing[4] },
  circle: { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[4] },
  title:  { fontSize: typography.sizes['3xl'], fontWeight: '700', textAlign: 'center' },
  body:   { fontSize: typography.sizes.md,     textAlign: 'center', lineHeight: 24 },
  dots:   { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: spacing[6] },
  dot:    { width: 8, height: 8, borderRadius: 4 },
  btn:    { marginHorizontal: spacing[6], marginBottom: spacing[8] },
});
