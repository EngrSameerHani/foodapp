import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { restaurantsApi, RestaurantFilters } from '@/services/restaurants';

export function useRestaurants(filters: RestaurantFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['restaurants', filters],
    queryFn: ({ pageParam = 1 }) =>
      restaurantsApi.list({ ...filters, page: pageParam as number }).then((r) => r.data),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.pages ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantsApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useRestaurantMenu(id: string) {
  return useQuery({
    queryKey: ['restaurant-menu', id],
    queryFn: () => restaurantsApi.getMenu(id).then((r) => r.data),
    enabled: !!id,
  });
}
