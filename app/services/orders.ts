import { apiClient } from './apiClient';
import type { Order, Cart, PaginatedResponse, VoucherValidation } from '@/types/api';

export const ordersApi = {
  getCart: () => apiClient.get<Cart>('/cart'),

  updateCart: (data: { restaurant_id: string; items: object[] }) =>
    apiClient.put<Cart>('/cart', data),

  clearCart: () => apiClient.delete('/cart'),

  placeOrder: (data: {
    address_id: string;
    payment_method: string;
    delivery_note?: string;
    voucher_code?: string;
  }) => apiClient.post<Order>('/orders', data),

  list: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Order>>('/orders', { params }),

  get: (id: string) => apiClient.get<Order>(`/orders/${id}`),

  updateStatus: (id: string, status: string, rejection_reason?: string) =>
    apiClient.patch<Order>(`/orders/${id}/status`, { status, rejection_reason }),

  validateVoucher: (code: string, subtotal: number) =>
    apiClient.post<VoucherValidation>('/vouchers/validate', { code, subtotal }),

  createReview: (data: {
    order_id: string;
    restaurant_rating: number;
    rider_rating?: number;
    comment?: string;
  }) => apiClient.post('/reviews', data),
};
