/**
 * Global UI state: mock mode flag, favorites, theme preference.
 * Mock mode ON  → all data comes from src/data/ (works offline, no backend needed).
 * Mock mode OFF → all data comes from the real FastAPI backend.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOCK_MODE_ENV = process.env.EXPO_PUBLIC_MOCK_MODE === 'true';

interface AppState {
  isMockMode:   boolean;
  favorites:    string[];   // restaurant IDs
  onboardingDone: boolean;

  setMockMode:      (v: boolean) => void;
  toggleFavorite:   (id: string) => void;
  isFavorite:       (id: string) => boolean;
  setOnboardingDone:(v: boolean) => void;
  hydrate:          () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isMockMode:      MOCK_MODE_ENV,
  favorites:       [],
  onboardingDone:  false,

  setMockMode: (v) => {
    set({ isMockMode: v });
    AsyncStorage.setItem('zf_mock', JSON.stringify(v));
  },

  toggleFavorite: (id) => {
    const cur = get().favorites;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    set({ favorites: next });
    AsyncStorage.setItem('zf_favs', JSON.stringify(next));
  },

  isFavorite: (id) => get().favorites.includes(id),

  setOnboardingDone: (v) => {
    set({ onboardingDone: v });
    AsyncStorage.setItem('zf_onb', JSON.stringify(v));
  },

  hydrate: async () => {
    const [mock, favs, onb] = await Promise.all([
      AsyncStorage.getItem('zf_mock'),
      AsyncStorage.getItem('zf_favs'),
      AsyncStorage.getItem('zf_onb'),
    ]);
    set({
      isMockMode:     mock !== null ? JSON.parse(mock) : MOCK_MODE_ENV,
      favorites:      favs ? JSON.parse(favs) : [],
      onboardingDone: onb  ? JSON.parse(onb)  : false,
    });
  },
}));
