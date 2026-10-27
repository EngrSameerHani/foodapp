import React from 'react';
import {
  Dimensions, ImageBackground, Pressable,
  StyleSheet, Text, View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/appStore';
import { palette, spacing, radius, typography, shadows } from '../../src/theme';

const { width, height } = Dimensions.get('window');

export default function Onboarding() {
  const setDone = useAppStore((s) => s.setOnboardingDone);

  const start = async () => {
    await setDone(true);
    router.replace('/(auth)/login');
  };

  return (
    <View style={s.root}>
      {/* Dark overlay food image background */}
      <View style={s.imageBg}>
        {/* Simulated food image with gradient overlay */}
        <View style={s.darkOverlay} />
        <View style={s.foodPlate}>
          {/* Decorative food emoji as placeholder */}
          <Text style={s.foodEmoji}>🍱</Text>
        </View>
      </View>

      <SafeAreaView style={s.content} edges={['bottom', 'top']}>
        {/* Logo top */}
        <View style={s.logoRow}>
          <View style={s.logoIcon}>
            <Text style={s.logoIconText}>🍴</Text>
          </View>
          <View>
            <Text style={s.logoName}>FoodZap</Text>
            <Text style={s.logoTagline}>Good Food. Faster.</Text>
          </View>
        </View>

        {/* Bottom content */}
        <View style={s.bottom}>
          <Text style={s.headline}>Delicious Food{'\n'}Delivered to{'\n'}Your Door</Text>
          <Text style={s.sub}>Fresh  •  Fast  •  Reliable</Text>

          <Pressable onPress={start} style={s.btn}>
            <Text style={s.btnText}>Get Started</Text>
          </Pressable>

          <Pressable onPress={start} style={s.signInRow}>
            <Text style={s.signInText}>Already have an account? </Text>
            <Text style={[s.signInText, { color: palette.orange, fontWeight: '600' }]}>Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.textPrimary },

  imageBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a0a00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,28,30,0.72)',
  },
  foodPlate: {
    width: width * 0.85,
    height: height * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -height * 0.1,
  },
  foodEmoji: { fontSize: 180, opacity: 0.6 },

  content: { flex: 1, justifyContent: 'space-between' },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[6],
    paddingTop: spacing[8],
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: palette.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText:   { fontSize: 22 },
  logoName:       { fontSize: typography.sizes.xl, fontWeight: '700', color: '#fff' },
  logoTagline:    { fontSize: typography.sizes.base, color: 'rgba(255,255,255,0.65)' },

  bottom: {
    padding: spacing[6],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  headline: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 46,
  },
  sub: {
    fontSize: typography.sizes.body,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.5,
  },

  btn: {
    backgroundColor: palette.orange,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
    ...shadows.md,
  },
  btnText: { color: '#fff', fontSize: typography.sizes.body, fontWeight: '700' },

  signInRow:   { flexDirection: 'row', justifyContent: 'center', marginTop: spacing[1] },
  signInText:  { fontSize: typography.sizes.base, color: 'rgba(255,255,255,0.7)' },
});
