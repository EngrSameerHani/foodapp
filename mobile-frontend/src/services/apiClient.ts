import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://zawadi-food-api.fly.dev/api/v1';

export const http = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,  // 30s — Fly.io free tier can take ~5s to wake
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use(async (cfg) => {
  const token = await AsyncStorage.getItem('zf_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

http.interceptors.response.use(
  (r) => r,
  async (err) => {
    // Clear stale token on 401
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('zf_token');
      await AsyncStorage.removeItem('zf_user');
    }

    // Improve network error messages
    if (!err.response) {
      const msg = err.code === 'ECONNABORTED'
        ? 'Request timed out. Check your internet connection.'
        : 'Network error. Make sure you are connected to the internet.';
      return Promise.reject(new Error(msg));
    }

    return Promise.reject(err);
  },
);
