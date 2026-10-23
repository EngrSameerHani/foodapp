import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
  ids: string[];
  toggle: (restaurantId: string) => void;
  isFavorite: (restaurantId: string) => boolean;
  restore: () => Promise<void>;
}

const FAV_KEY = 'zawadi_favorites';

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: [],

  toggle: (id) => {
    const current = get().ids;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    set({ ids: next });
    AsyncStorage.setItem(FAV_KEY, JSON.stringify(next));
  },

  isFavorite: (id) => get().ids.includes(id),

  restore: async () => {
    const raw = await AsyncStorage.getItem(FAV_KEY);
    if (raw) set({ ids: JSON.parse(raw) });
  },
}));
