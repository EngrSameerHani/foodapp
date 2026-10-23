import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riderApi } from '@/services/rider';
import { ordersApi } from '@/services/orders';
import { useTheme } from '@/hooks/useTheme';
import { Button, Badge, statusBadgeVariant } from '@/components/ui';
import { spacing, typography, borderRadius, shadows } from '@/theme';
import { formatCurrency } from '@/utils/format';
import type { Order } from '@/types/api';
import * as Location from 'expo-location';

export default function RiderDeliverScreen() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['rider-profile'],
    queryFn: () => riderApi.getProfile().then((r) => r.data),
  });

  const { data: activeOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list().then((r) => r.data.data),
    refetchInterval: 15_000,
  });

  const activeDelivery = activeOrders?.find((o: Order) =>
    ['ACCEPTED', 'PICKED_UP', 'ON_THE_WAY'].includes(o.status),
  );

  const toggleOnline = useMutation({
    mutationFn: (is_online: boolean) => riderApi.setStatus(is_online),
    onSuccess: (_, is_online) => {
      qc.invalidateQueries({ queryKey: ['rider-profile'] });
      if (is_online) startLocationPing();
      else stopLocationPing();
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });

  const startLocationPing = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    locationInterval.current = setInterval(async () => {
      const loc = await Location.getCurrentPositionAsync({});
      await riderApi.updateLocation(loc.coords.latitude, loc.coords.longitude);
    }, 10_000);
  };

  const stopLocationPing = () => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
  };

  useEffect(() => {
    if (profile?.is_online) startLocationPing();
    return () => stopLocationPing();
  }, [profile?.is_online]);

  const navigateTo = (lat: number, lng: number) => {
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    Linking.openURL(url);
  };

  const isOnline = profile?.is_online ?? false;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Online toggle */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {isOnline ? 'You are online' : 'You are offline'}
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            {isOnline ? 'Waiting for orders…' : 'Go online to start receiving orders'}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={(v) => toggleOnline.mutate(v)}
          trackColor={{ false: colors.border, true: colors.primary + '60' }}
          thumbColor={isOnline ? colors.primary : colors.textTertiary}
        />
      </View>

      {/* Active delivery */}
      {activeDelivery ? (
        <View style={[styles.deliveryCard, { backgroundColor: colors.surface }, shadows.md]}>
          <View style={styles.deliveryHeader}>
            <Text style={[styles.orderNum, { color: colors.textPrimary }]}>{activeDelivery.order_number}</Text>
            <Badge label={activeDelivery.status} variant={statusBadgeVariant(activeDelivery.status)} />
          </View>

          {/* Phase 1: heading to restaurant */}
          {activeDelivery.status === 'ACCEPTED' && (
            <>
              <Text style={[styles.phase, { color: colors.textSecondary }]}>📍 Head to restaurant</Text>
              <Button
                title="Open Navigation"
                onPress={() => navigateTo(37.7749, -122.4194)} // restaurant coords from order in real impl
                variant="outline"
                size="sm"
              />
              <Button
                title="Mark as Picked Up"
                onPress={() => updateStatus.mutate({ id: activeDelivery.id, status: 'PICKED_UP' })}
                loading={updateStatus.isPending}
              />
            </>
          )}

          {/* Phase 2: on the way */}
          {activeDelivery.status === 'PICKED_UP' && (
            <>
              <Text style={[styles.phase, { color: colors.textSecondary }]}>🏠 Head to customer</Text>
              <Button
                title="Navigate to Customer"
                onPress={() => {
                  const snap = activeDelivery.delivery_address_snapshot;
                  if (snap) navigateTo(snap.lat, snap.lng);
                }}
                variant="outline"
                size="sm"
              />
              <Button
                title="On the Way"
                onPress={() => updateStatus.mutate({ id: activeDelivery.id, status: 'ON_THE_WAY' })}
                loading={updateStatus.isPending}
              />
            </>
          )}

          {activeDelivery.status === 'ON_THE_WAY' && (
            <Button
              title="Mark Delivered ✓"
              onPress={() => updateStatus.mutate({ id: activeDelivery.id, status: 'DELIVERED' })}
              loading={updateStatus.isPending}
            />
          )}

          <Text style={[styles.earning, { color: colors.textPrimary }]}>
            Earning: {formatCurrency(activeDelivery.delivery_fee)}
          </Text>
        </View>
      ) : (
        <View style={styles.waiting}>
          {isOnline ? (
            <>
              <Ionicons name="radio-outline" size={64} color={colors.primary} />
              <Text style={[styles.waitText, { color: colors.textPrimary }]}>Waiting for an order…</Text>
              <Text style={[styles.waitSub, { color: colors.textSecondary }]}>
                You'll get notified when a delivery is assigned to you.
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="moon-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.waitText, { color: colors.textTertiary }]}>Go online to start earning</Text>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4], marginBottom: spacing[4] },
  title: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  sub: { fontSize: typography.sizes.sm, marginTop: 2 },
  deliveryCard: { margin: spacing[4], borderRadius: borderRadius.lg, padding: spacing[4], gap: spacing[3] },
  deliveryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderNum: { fontSize: typography.sizes.base, fontWeight: typography.weights.bold },
  phase: { fontSize: typography.sizes.base },
  earning: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, textAlign: 'center', marginTop: spacing[2] },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[8] },
  waitText: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, textAlign: 'center' },
  waitSub: { fontSize: typography.sizes.base, textAlign: 'center', lineHeight: 22 },
});
