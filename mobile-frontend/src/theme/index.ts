export { lightColors, darkColors, palette } from './colors';
export type { AppColors } from './colors';

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl':24,
  full: 9999,
} as const;

// Poppins font weights — from design spec
export const typography = {
  family: 'Poppins',  // loaded via @expo-google-fonts/poppins
  sizes: {
    xs:     11,
    sm:     13,
    base:   14,   // Caption: 14px Medium
    body:   16,   // Body: 16px Regular
    md:     16,
    lg:     18,
    xl:     20,   // H2: 20px SemiBold
    '2xl':  24,   // H1: 24px Bold
    '3xl':  28,
    '4xl':  32,
    '5xl':  40,
  },
  weights: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    extrabold:'800' as const,
  },
};

export const shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#FF6800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};
