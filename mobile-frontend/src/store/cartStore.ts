import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocalCartItem } from '../types';
import { localId } from '../utils';

const KEY = 'zf_cart';
const SERVICE_FEE = 1.99;
const TAX_RATE   = 0.08;
const DEF_DELIVERY = 2.99;

interface CartState {
  restaurantId:   string | null;
  restaurantName: string;
  deliveryFee:    number;
  items:          LocalCartItem[];
  voucherCode:    string | null;
  discount:       number;

  addItem:        (restId: string, restName: string, fee: number, item: Omit<LocalCartItem, 'id'>) => void;
  updateQty:      (id: string, qty: number) => void;
  remove:         (id: string) => void;
  clear:          () => void;
  setVoucher:     (code: string, amount: number) => void;
  clearVoucher:   () => void;
  hydrate:        () => Promise<void>;

  // computed
  subtotal:  () => number;
  total:     () => number;
  itemCount: () => number;
}

async function save(state: Pick<CartState, 'restaurantId' | 'restaurantName' | 'deliveryFee' | 'items'>) {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export const useCartStore = create<CartState>((set, get) => ({
  restaurantId:   null,
  restaurantName: '',
  deliveryFee:    DEF_DELIVERY,
  items:          [],
  voucherCode:    null,
  discount:       0,

  addItem: (restId, restName, fee, item) => {
    const existing = get().items.find(
      (i) => i.item_id === item.item_id &&
        JSON.stringify(i.selected_options) === JSON.stringify(item.selected_options),
    );
    let newItems: LocalCartItem[];
    if (existing) {
      newItems = get().items.map((i) =>
        i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i,
      );
    } else {
      newItems = [...get().items, { ...item, id: localId() }];
    }
    set({ restaurantId: restId, restaurantName: restName, deliveryFee: fee, items: newItems });
    save({ restaurantId: restId, restaurantName: restName, deliveryFee: fee, items: newItems });
  },

  updateQty: (id, qty) => {
    if (qty <= 0) { get().remove(id); return; }
    const newItems = get().items.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
    set({ items: newItems });
    save({ ...get(), items: newItems });
  },

  remove: (id) => {
    const newItems = get().items.filter((i) => i.id !== id);
    const restId = newItems.length ? get().restaurantId : null;
    set({ items: newItems, restaurantId: restId });
    save({ ...get(), items: newItems, restaurantId: restId });
  },

  clear: () => {
    set({ restaurantId: null, restaurantName: '', deliveryFee: DEF_DELIVERY, items: [], discount: 0, voucherCode: null });
    AsyncStorage.removeItem(KEY);
  },

  setVoucher: (code, amount) => set({ voucherCode: code, discount: amount }),
  clearVoucher: () => set({ voucherCode: null, discount: 0 }),

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); set(d); }
  },

  subtotal:  () => get().items.reduce((s, i) => s + i.unit_price * i.quantity, 0),
  total:     () => {
    const sub = get().subtotal();
    return sub + get().deliveryFee + SERVICE_FEE + sub * TAX_RATE - get().discount;
  },
  itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
}));
