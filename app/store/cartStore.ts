import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SelectedOption } from '@/types/api';

export interface LocalCartItem {
  id: string; // local uuid
  item_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  selected_options: SelectedOption[];
  special_note: string | null;
}

interface CartState {
  restaurantId: string | null;
  restaurantName: string;
  items: LocalCartItem[];

  addItem: (restaurantId: string, restaurantName: string, item: LocalCartItem) => void;
  updateQuantity: (localId: string, qty: number) => void;
  removeItem: (localId: string) => void;
  clear: () => void;
  persist: () => Promise<void>;
  restore: () => Promise<void>;

  // Derived
  totalItems: () => number;
  subtotal: () => number;
}

const CART_STORAGE_KEY = 'zawadi_cart';

export const useCartStore = create<CartState>((set, get) => ({
  restaurantId: null,
  restaurantName: '',
  items: [],

  addItem: (restaurantId, restaurantName, item) => {
    const existing = get().items.find(
      (i) => i.item_id === item.item_id && JSON.stringify(i.selected_options) === JSON.stringify(item.selected_options),
    );
    if (existing) {
      set((s) => ({
        items: s.items.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i,
        ),
      }));
    } else {
      set((s) => ({
        restaurantId,
        restaurantName,
        items: [...s.items, item],
      }));
    }
    get().persist();
  },

  updateQuantity: (localId, qty) => {
    if (qty <= 0) {
      get().removeItem(localId);
      return;
    }
    set((s) => ({
      items: s.items.map((i) => (i.id === localId ? { ...i, quantity: qty } : i)),
    }));
    get().persist();
  },

  removeItem: (localId) => {
    set((s) => {
      const newItems = s.items.filter((i) => i.id !== localId);
      return { items: newItems, restaurantId: newItems.length === 0 ? null : s.restaurantId };
    });
    get().persist();
  },

  clear: () => {
    set({ restaurantId: null, restaurantName: '', items: [] });
    AsyncStorage.removeItem(CART_STORAGE_KEY);
  },

  persist: async () => {
    const { restaurantId, restaurantName, items } = get();
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ restaurantId, restaurantName, items }));
  },

  restore: async () => {
    const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      set(parsed);
    }
  },

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  subtotal: () =>
    get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
}));
