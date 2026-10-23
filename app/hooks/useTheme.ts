import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '@/theme';
import { useSettingsStore } from '@/store/settingsStore';

export function useTheme() {
  const systemScheme = useColorScheme();
  const { theme: preferredTheme } = useSettingsStore();

  const scheme = preferredTheme === 'system' ? systemScheme : preferredTheme;
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const isDark = scheme === 'dark';

  return { colors, isDark, scheme };
}
