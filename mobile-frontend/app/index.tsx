import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { useAppStore }  from '../src/store/appStore';

export default function Index() {
  const { user, isHydrated } = useAuthStore();
  const { onboardingDone } = useAppStore();

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8003D' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (!onboardingDone)           return <Redirect href="/(auth)/onboarding" />;
  if (!user)                     return <Redirect href="/(auth)/login" />;
  if (user.role === 'restaurant_owner') return <Redirect href="/(restaurant)/" />;
  if (user.role === 'rider')     return <Redirect href="/(rider)/" />;
  return                                 <Redirect href="/(customer)/" />;
}
