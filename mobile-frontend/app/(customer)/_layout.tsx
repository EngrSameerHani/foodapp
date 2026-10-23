import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }    from '../../src/hooks/useTheme';
import { useCartStore } from '../../src/store/cartStore';

function CartIcon({ color, size }: { color: string; size: number }) {
  const count = useCartStore((s) => s.itemCount());
  return (
    <View>
      <Ionicons name="bag-outline" size={size} color={color} />
      {count > 0 && (
        <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: '#E8003D', borderRadius: 9, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function CustomerLayout() {
  const { colors } = useTheme();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: colors.tabBarBg, borderTopColor: colors.border }, tabBarActiveTintColor: colors.tabBarActive, tabBarInactiveTintColor: colors.tabBarInactive }}>
      <Tabs.Screen name="index"     options={{ title: 'Home',      tabBarIcon: ({ color, size }) => <Ionicons name="home-outline"    size={size} color={color} /> }} />
      <Tabs.Screen name="search"    options={{ title: 'Search',    tabBarIcon: ({ color, size }) => <Ionicons name="search-outline"  size={size} color={color} /> }} />
      <Tabs.Screen name="cart"      options={{ title: 'Cart',      tabBarIcon: ({ color, size }) => <CartIcon color={color} size={size} /> }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favorites', tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline"   size={size} color={color} /> }} />
      <Tabs.Screen name="profile"   options={{ title: 'Profile',   tabBarIcon: ({ color, size }) => <Ionicons name="person-outline"  size={size} color={color} /> }} />
      <Tabs.Screen name="restaurant/[id]"   options={{ href: null }} />
      <Tabs.Screen name="checkout"           options={{ href: null }} />
      <Tabs.Screen name="order/[id]"        options={{ href: null }} />
      <Tabs.Screen name="order/history"     options={{ href: null }} />
    </Tabs>
  );
}
