import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemePreference = 'light' | 'dark' | 'system';

interface SettingsState {
  theme: ThemePreference;
  hasSeenOnboarding: boolean;
  setTheme: (t: ThemePreference) => Promise<void>;
  setHasSeenOnboarding: (v: boolean) => Promise<void>;
  restore: () => Promise<void>;
}

const SETTINGS_KEY = 'zawadi_settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'system',
  hasSeenOnboarding: false,

  setTheme: async (t) => {
    set({ theme: t });
    await _persist(get());
  },

  setHasSeenOnboarding: async (v) => {
    set({ hasSeenOnboarding: v });
    await _persist(get());
  },

  restore: async () => {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      set(parsed);
    }
  },
}));

async function _persist(state: SettingsState) {
  const { theme, hasSeenOnboarding } = state;
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme, hasSeenOnboarding }));
}
