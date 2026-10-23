import { apiClient } from './apiClient';
import type { Notification } from '@/types/api';

export const notificationsApi = {
  list: (page = 1) => apiClient.get<Notification[]>('/notifications', { params: { page } }),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
};
