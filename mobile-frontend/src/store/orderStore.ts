/**
 * In-memory order store used in mock mode.
 * Simulates place/accept/reject/advance status transitions locally.
 */
import { create } from 'zustand';
import type { Order, OrderStatus } from '@/types';
import { MOCK_ORDERS, MOCK_RESTAURANT_ORDERS } from '@/data';
import { localId } from '@/utils';

interface OrderState {
  customerOrders:   Order[];
  restaurantOrders: Order[];
  riderOrders:      Order[];

  addOrder:        (o: Order) => void;
  transitionOrder: (id: string, status: OrderStatus, reason?: string) => void;
  getOrder:        (id: string) => Order | undefined;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  customerOrders:   [...MOCK_ORDERS],
  restaurantOrders: [...MOCK_RESTAURANT_ORDERS],
  riderOrders:      [],

  addOrder: (o) => {
    set((s) => ({
      customerOrders:   [o, ...s.customerOrders],
      restaurantOrders: [o, ...s.restaurantOrders],
    }));
  },

  transitionOrder: (id, status, reason) => {
    const patch = (list: Order[]) =>
      list.map((o) =>
        o.id === id
          ? { ...o, status, rejection_reason: reason ?? o.rejection_reason, updated_at: new Date().toISOString() }
          : o,
      );
    set((s) => ({
      customerOrders:   patch(s.customerOrders),
      restaurantOrders: patch(s.restaurantOrders),
      riderOrders:      patch(s.riderOrders),
    }));
  },

  getOrder: (id) => {
    const all = [...get().customerOrders, ...get().restaurantOrders, ...get().riderOrders];
    return all.find((o) => o.id === id);
  },
}));
