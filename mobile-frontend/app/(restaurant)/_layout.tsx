import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
export default function RestaurantLayout() {
  const { colors } = useTheme();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: colors.tabBarBg, borderTopColor: colors.border }, tabBarActiveTintColor: colors.tabBarActive, tabBarInactiveTintColor: colors.tabBarInactive }}>
      <Tabs.Screen name="index"   options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline"    size={size} color={color} /> }} />
      <Tabs.Screen name="menu"    options={{ title: 'Menu',   tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline"  size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Store',  tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline"  size={size} color={color} /> }} />
    </Tabs>
  );
}
