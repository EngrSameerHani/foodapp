import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User, UserRole } from '@/types/api';

const ACCESS_TOKEN_KEY = 'zawadi_access_token';
const REFRESH_TOKEN_KEY = 'zawadi_refresh_token';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  role: UserRole | null;
  isHydrated: boolean;

  setTokens: (access: string, refresh: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  role: null,
  isHydrated: false,

  setTokens: async (access, refresh) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
    set({ accessToken: access, refreshToken: refresh });
  },

  setUser: (user) => set({ user, role: user.role }),

  logout: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    set({ accessToken: null, refreshToken: null, user: null, role: null });
  },

  hydrate: async () => {
    const access = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    set({ accessToken: access, refreshToken: refresh, isHydrated: true });
  },
}));
