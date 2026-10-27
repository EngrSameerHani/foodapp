// FoodZap Design System — exact colors from the design spec
export const palette = {
  // Primary
  orange:      '#FF6800',
  orangeLight: '#FF8534',
  orangeDark:  '#E55A00',
  orangeBg:    '#FFF3EB',

  // Text
  textPrimary:   '#1F2937',
  textSecondary: '#687280',
  textLight:     '#9CA3AF',

  // Backgrounds
  white:      '#FFFFFF',
  bgLight:    '#E5E7EB',  // secondary bg from spec
  bgPage:     '#F5F5F5',
  bgCard:     '#FFFFFF',

  // Status
  success:     '#22C55E',
  successBg:   '#DCFCE7',
  error:       '#EF4444',
  errorBg:     '#FEE2E2',
  warning:     '#F59E0B',
  warningBg:   '#FEF3C7',
  info:        '#3B82F6',

  // Dark (splash screen)
  darkBg:      '#1C1C1E',
  darkCard:    '#2C2C2E',

  // Grays
  gray50:  '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  black: '#000000',
  white_: '#FFFFFF',
};

export const lightColors = {
  primary:        palette.orange,
  primaryLight:   palette.orangeLight,
  primaryDark:    palette.orangeDark,
  primaryBg:      palette.orangeBg,

  background:     palette.bgPage,
  surface:        palette.white,
  surfaceElevated:palette.white,
  border:         palette.gray200,
  borderLight:    palette.gray100,
  divider:        palette.gray100,

  textPrimary:    palette.textPrimary,
  textSecondary:  palette.textSecondary,
  textTertiary:   palette.textLight,
  textInverse:    palette.white,
  textOnPrimary:  palette.white,

  success:        palette.success,
  successBg:      palette.successBg,
  error:          palette.error,
  errorBg:        palette.errorBg,
  warning:        palette.warning,
  info:           palette.info,

  tabBarBg:       palette.white,
  tabBarActive:   palette.orange,
  tabBarInactive: palette.gray400,

  skeleton:       palette.gray200,
  skeletonShimmer:palette.gray100,

  // Input
  inputBg:        palette.white,
  inputBorder:    palette.gray200,
  inputFocus:     palette.orange,

  // Card shadow color
  shadowColor:    '#000000',
};

export const darkColors: typeof lightColors = {
  primary:        palette.orangeLight,
  primaryLight:   palette.orange,
  primaryDark:    palette.orangeDark,
  primaryBg:      '#2A1500',

  background:     palette.gray900,
  surface:        palette.gray800,
  surfaceElevated:palette.gray700,
  border:         palette.gray700,
  borderLight:    palette.gray800,
  divider:        palette.gray800,

  textPrimary:    palette.white,
  textSecondary:  palette.gray400,
  textTertiary:   palette.gray500,
  textInverse:    palette.gray900,
  textOnPrimary:  palette.white,

  success:        palette.success,
  successBg:      '#052e16',
  error:          palette.error,
  errorBg:        '#450a0a',
  warning:        palette.warning,
  info:           palette.info,

  tabBarBg:       palette.gray900,
  tabBarActive:   palette.orangeLight,
  tabBarInactive: palette.gray600,

  skeleton:       palette.gray700,
  skeletonShimmer:palette.gray600,

  inputBg:        palette.gray800,
  inputBorder:    palette.gray700,
  inputFocus:     palette.orangeLight,

  shadowColor:    '#000000',
};

export type AppColors = typeof lightColors;
