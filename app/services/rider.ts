import { apiClient } from './apiClient';
import type { RiderProfile, PaginatedResponse, Order } from '@/types/api';

export const riderApi = {
  getProfile: () => apiClient.get<RiderProfile>('/rider/profile'),
  setStatus: (is_online: boolean) => apiClient.patch<RiderProfile>('/rider/status', { is_online }),
  updateLocation: (lat: number, lng: number) => apiClient.put('/rider/location', { lat, lng }),
  getDeliveries: (page = 1) =>
    apiClient.get<{ data: Order[]; meta: object; total_earnings: number }>('/rider/deliveries', {
      params: { page },
    }),
};
