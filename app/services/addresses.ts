import { apiClient } from './apiClient';
import type { Address } from '@/types/api';

export const addressesApi = {
  list: () => apiClient.get<Address[]>('/addresses'),
  create: (data: { label: string; full_address: string; lat: number; lng: number; is_default?: boolean }) =>
    apiClient.post<Address>('/addresses', data),
  update: (id: string, data: Partial<Address>) => apiClient.patch<Address>(`/addresses/${id}`, data),
  delete: (id: string) => apiClient.delete(`/addresses/${id}`),
};
