import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, UserRole } from '@/types';

const KEY_USER = 'zf_user';
const KEY_TOKEN = 'zf_token';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,

  setAuth: async (user, token) => {
    await AsyncStorage.setItem(KEY_USER, JSON.stringify(user));
    await AsyncStorage.setItem(KEY_TOKEN, token);
    set({ user, accessToken: token });
  },

  logout: async () => {
    await AsyncStorage.removeItem(KEY_USER);
    await AsyncStorage.removeItem(KEY_TOKEN);
    set({ user: null, accessToken: null });
  },

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(KEY_USER);
    const token = await AsyncStorage.getItem(KEY_TOKEN);
    set({
      user: raw ? (JSON.parse(raw) as User) : null,
      accessToken: token,
      isHydrated: true,
    });
  },
}));
