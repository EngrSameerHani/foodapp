/**
 * Unified service layer.
 * Every exported function checks isMockMode → returns mock data or calls the real API.
 */
import { useAppStore } from '../store/appStore';
import { http } from './apiClient';
import {
  MOCK_RESTAURANTS, getMockRestaurant,
  MOCK_USERS, findMockUser,
  MOCK_VOUCHERS,
} from '../data';
import type {
  Restaurant, User, Order, Address,
  VoucherValidation, RiderProfile,
} from '../types';

// ─── helpers ─────────────────────────────────────────────────────────────────
const isMock = () => useAppStore.getState().isMockMode;
const delay  = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  requestOtp: async (phone: string): Promise<void> => {
    if (isMock()) { await delay(); return; }
    await http.post('/auth/request-otp', { phone });
  },

  verifyOtp: async (phone: string, code: string, role: string): Promise<{ user: User; token: string }> => {
    if (isMock()) {
      await delay();
      if (code !== '123456') throw new Error('Invalid OTP. Use 123456 in demo mode.');
      const user = findMockUser(phone);
      if (!user) throw new Error('Phone not in demo accounts. See README for valid numbers.');
      return { user, token: `mock-token-${user.id}` };
    }
    const { data } = await http.post('/auth/verify-otp', { phone, code, role });
    const meRes = await http.get('/users/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    return { user: meRes.data as User, token: data.access_token };
  },

  updateProfile: async (id: string, payload: Partial<User>): Promise<User> => {
    if (isMock()) { await delay(); const u = findMockUser(id) ?? ({} as User); return { ...u, ...payload }; }
    const { data } = await http.patch('/users/me', payload);
    return data as User;
  },
};

// ─── Restaurants ──────────────────────────────────────────────────────────────
export const restaurantService = {
  list: async (filters?: { cuisine?: string; sort?: string }): Promise<Restaurant[]> => {
    if (isMock()) {
      await delay();
      let list = [...MOCK_RESTAURANTS];
      if (filters?.cuisine && filters.cuisine !== 'All')
        list = list.filter((r) => r.cuisine_types.some((c) => c.toLowerCase() === filters.cuisine!.toLowerCase()));
      if (filters?.sort === 'rating')        list.sort((a, b) => b.rating - a.rating);
      if (filters?.sort === 'delivery_time') list.sort((a, b) => a.estimated_delivery_minutes - b.estimated_delivery_minutes);
      return list;
    }
    const { data } = await http.get('/restaurants', { params: filters });
    return data.data as Restaurant[];
  },

  get: async (id: string): Promise<Restaurant> => {
    if (isMock()) { await delay(); const r = getMockRestaurant(id); if (!r) throw new Error('Not found'); return r; }
    const { data } = await http.get(`/restaurants/${id}`);
    return data as Restaurant;
  },

  getMine: async (): Promise<Restaurant | null> => {
    if (isMock()) { await delay(); return MOCK_RESTAURANTS[0]; }
    try { const { data } = await http.get('/restaurants/mine'); return data as Restaurant; }
    catch { return null; }
  },

  updateMine: async (id: string, payload: Partial<Restaurant>): Promise<Restaurant> => {
    if (isMock()) { await delay(); return { ...MOCK_RESTAURANTS[0], ...payload }; }
    const { data } = await http.patch(`/restaurants/${id}`, payload);
    return data as Restaurant;
  },

  toggleItem: async (itemId: string, is_available: boolean): Promise<void> => {
    if (isMock()) { await delay(); return; }
    await http.patch(`/menu/items/${itemId}`, { is_available });
  },
};

// ─── Addresses ────────────────────────────────────────────────────────────────
const DEMO_ADDRESSES: Address[] = [
  { id: 'addr-001', user_id: 'user-cust-001', label: 'Home', full_address: '123 Main Street, San Francisco, CA', lat: 37.7749, lng: -122.4194, is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'addr-002', user_id: 'user-cust-001', label: 'Work', full_address: '456 Market Street, San Francisco, CA', lat: 37.7900, lng: -122.4000, is_default: false, created_at: '2026-01-01T00:00:00Z' },
];

export const addressService = {
  list: async (): Promise<Address[]> => {
    if (isMock()) { await delay(); return DEMO_ADDRESSES; }
    const { data } = await http.get('/addresses');
    return data as Address[];
  },

  create: async (payload: Omit<Address, 'id' | 'created_at'>): Promise<Address> => {
    if (isMock()) { await delay(); return { ...payload, id: `addr-${Date.now()}`, created_at: new Date().toISOString() }; }
    const { data } = await http.post('/addresses', payload);
    return data as Address;
  },
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderService = {
  place: async (payload: {
    address_id: string; payment_method: string;
    delivery_note?: string; voucher_code?: string;
  }): Promise<Order> => {
    if (isMock()) throw new Error('USE_MOCK_STORE'); // handled in screen
    const { data } = await http.post('/orders', payload);
    return data as Order;
  },

  list: async (): Promise<Order[]> => {
    if (isMock()) throw new Error('USE_MOCK_STORE');
    const { data } = await http.get('/orders');
    return data.data as Order[];
  },

  get: async (id: string): Promise<Order> => {
    if (isMock()) throw new Error('USE_MOCK_STORE');
    const { data } = await http.get(`/orders/${id}`);
    return data as Order;
  },

  updateStatus: async (id: string, status: string, reason?: string): Promise<Order> => {
    if (isMock()) throw new Error('USE_MOCK_STORE');
    const { data } = await http.patch(`/orders/${id}/status`, { status, rejection_reason: reason });
    return data as Order;
  },
};

// ─── Vouchers ─────────────────────────────────────────────────────────────────
export const voucherService = {
  validate: async (code: string, subtotal: number): Promise<VoucherValidation> => {
    if (isMock()) {
      await delay();
      const v = MOCK_VOUCHERS.find((x) => x.code === code.toUpperCase());
      if (!v) throw new Error('Invalid voucher code.');
      if (subtotal < v.min_order) throw new Error(`Minimum order $${v.min_order.toFixed(2)} required.`);
      const amt = v.discount_type === 'percent' ? subtotal * v.value / 100 : Math.min(v.value, subtotal);
      return { code: v.code, discount_type: v.discount_type, value: v.value, discount_amount: parseFloat(amt.toFixed(2)) };
    }
    const { data } = await http.post('/vouchers/validate', { code, subtotal });
    return data as VoucherValidation;
  },
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviewService = {
  create: async (payload: { order_id: string; restaurant_rating: number; rider_rating?: number; comment?: string }): Promise<void> => {
    if (isMock()) { await delay(); return; }
    await http.post('/reviews', payload);
  },
};

// ─── Rider ────────────────────────────────────────────────────────────────────
export const riderService = {
  getProfile: async (): Promise<RiderProfile> => {
    if (isMock()) {
      await delay();
      return { id: 'rp-001', user_id: 'user-rider-001', vehicle_type: 'motorcycle', is_online: false, is_available: true, total_deliveries: 47, total_earnings: 312.50, rating: 4.8 };
    }
    const { data } = await http.get('/rider/profile');
    return data as RiderProfile;
  },

  setStatus: async (is_online: boolean): Promise<void> => {
    if (isMock()) { await delay(); return; }
    await http.patch('/rider/status', { is_online });
  },

  updateLocation: async (lat: number, lng: number): Promise<void> => {
    if (isMock()) return;
    await http.put('/rider/location', { lat, lng });
  },
};
