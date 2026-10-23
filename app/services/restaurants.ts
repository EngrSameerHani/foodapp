import { apiClient } from './apiClient';
import type {
  Restaurant,
  MenuCategory,
  PaginatedResponse,
  Address,
} from '@/types/api';

export interface RestaurantFilters {
  lat?: number;
  lng?: number;
  cuisine?: string;
  min_rating?: number;
  max_delivery_minutes?: number;
  sort?: 'relevance' | 'rating' | 'delivery_time' | 'distance';
  page?: number;
  limit?: number;
}

export const restaurantsApi = {
  list: (filters: RestaurantFilters = {}) =>
    apiClient.get<PaginatedResponse<Restaurant>>('/restaurants', { params: filters }),

  getMyRestaurant: () => apiClient.get<Restaurant>('/restaurants/mine'),

  get: (id: string) => apiClient.get<Restaurant>(`/restaurants/${id}`),

  create: (data: Partial<Restaurant>) => apiClient.post<Restaurant>('/restaurants', data),

  update: (id: string, data: Partial<Restaurant>) =>
    apiClient.patch<Restaurant>(`/restaurants/${id}`, data),

  getMenu: (id: string) => apiClient.get<MenuCategory[]>(`/restaurants/${id}/menu`),

  createCategory: (data: { restaurant_id: string; name: string; sort_order?: number }) =>
    apiClient.post<MenuCategory>('/menu/categories', data),

  updateCategory: (id: string, data: { name?: string; sort_order?: number }) =>
    apiClient.patch<MenuCategory>(`/menu/categories/${id}`, data),

  deleteCategory: (id: string) => apiClient.delete(`/menu/categories/${id}`),

  createItem: (data: object) => apiClient.post('/menu/items', data),
  updateItem: (id: string, data: object) => apiClient.patch(`/menu/items/${id}`, data),
  deleteItem: (id: string) => apiClient.delete(`/menu/items/${id}`),
};
