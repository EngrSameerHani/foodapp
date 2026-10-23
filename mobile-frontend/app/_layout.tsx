import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/authStore';
import { useAppStore }  from '../src/store/appStore';
import { useCartStore } from '../src/store/cartStore';
import { ToastView, Toast } from '../src/components/ui';
import type { ToastRef }   from '../src/components/ui/Toast';
import { useTheme }        from '../src/hooks/useTheme';
import { View } from 'react-native';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } });

function Inner() {
  const { isDark } = useTheme();
  const toastRef = useRef<ToastRef>(null);
  useEffect(() => { Toast.setRef(toastRef.current); }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
      <ToastView ref={toastRef} />
    </View>
  );
}

export default function RootLayout() {
  const hydrateAuth  = useAuthStore((s) => s.hydrate);
  const hydrateApp   = useAppStore((s)  => s.hydrate);
  const hydrateCart  = useCartStore((s) => s.hydrate);

  useEffect(() => {
    hydrateAuth();
    hydrateApp();
    hydrateCart();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={qc}>
        <Inner />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
