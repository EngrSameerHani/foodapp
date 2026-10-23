import { useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import type { OrderStatus } from '@/types/api';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws';

interface TrackingState {
  status: OrderStatus | null;
  riderLat: number | null;
  riderLng: number | null;
  connected: boolean;
}

export function useOrderTracking(orderId: string | null) {
  const ws = useRef<WebSocket | null>(null);
  const qc = useQueryClient();
  const [state, setState] = useState<TrackingState>({
    status: null,
    riderLat: null,
    riderLng: null,
    connected: false,
  });

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    const connect = async () => {
      const token = await SecureStore.getItemAsync('zawadi_access_token');
      if (cancelled || !token) return;

      const socket = new WebSocket(`${WS_URL}/orders/${orderId}?token=${token}`);
      ws.current = socket;

      socket.onopen = () => {
        if (!cancelled) setState((s) => ({ ...s, connected: true }));
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'status_update') {
            setState((s) => ({ ...s, status: msg.status }));
            qc.invalidateQueries({ queryKey: ['order', orderId] });
          } else if (msg.type === 'rider_location') {
            setState((s) => ({ ...s, riderLat: msg.lat, riderLng: msg.lng }));
          }
        } catch {
          // ignore parse errors
        }
      };

      socket.onclose = () => {
        if (!cancelled) setState((s) => ({ ...s, connected: false }));
      };

      // Ping every 25s to keep alive
      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25_000);

      return () => clearInterval(pingInterval);
    };

    const cleanup = connect();
    return () => {
      cancelled = true;
      cleanup.then((fn) => fn?.());
      ws.current?.close();
    };
  }, [orderId]);

  return state;
}
