import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../theme';

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
