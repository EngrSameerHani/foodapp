import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function Index() {
  const { accessToken, isHydrated, role } = useAuthStore();
  const { hasSeenOnboarding } = useSettingsStore();
  const { colors } = useTheme();

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!hasSeenOnboarding) return <Redirect href="/(auth)/onboarding" />;
  if (!accessToken) return <Redirect href="/(auth)/login" />;

  if (role === 'restaurant_owner') return <Redirect href="/(restaurant)/" />;
  if (role === 'rider') return <Redirect href="/(rider)/" />;
  return <Redirect href="/(customer)/" />;
}
