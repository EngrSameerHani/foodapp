import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
export default function RiderLayout() {
  const { colors } = useTheme();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: colors.tabBarBg, borderTopColor: colors.border }, tabBarActiveTintColor: colors.tabBarActive, tabBarInactiveTintColor: colors.tabBarInactive }}>
      <Tabs.Screen name="index"   options={{ title: 'Deliver', tabBarIcon: ({ color, size }) => <Ionicons name="bicycle-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color, size }) => <Ionicons name="time-outline"    size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline"  size={size} color={color} /> }} />
    </Tabs>
  );
}
