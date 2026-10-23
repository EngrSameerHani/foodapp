import { apiClient } from './apiClient';
import type { TokenResponse, User, UserRole } from '@/types/api';

export const authApi = {
  requestOtp: (phone: string) =>
    apiClient.post<{ expires_in: number }>('/auth/request-otp', { phone }),

  verifyOtp: (phone: string, code: string, role: UserRole) =>
    apiClient.post<TokenResponse>('/auth/verify-otp', { phone, code, role }),

  refresh: (refresh_token: string) =>
    apiClient.post<TokenResponse>('/auth/refresh', { refresh_token }),

  logout: (refresh_token: string) =>
    apiClient.post('/auth/logout', { refresh_token }),

  getMe: () => apiClient.get<User>('/users/me'),

  updateMe: (data: { name?: string; expo_push_token?: string; avatar_url?: string }) =>
    apiClient.patch<User>('/users/me', data),
};
