import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/services/orders';

export function useOrders() {
  return useInfiniteQuery({
    queryKey: ['orders'],
    queryFn: ({ pageParam = 1 }) =>
      ordersApi.list({ page: pageParam as number }).then((r) => r.data),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.pages ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id).then((r) => r.data),
    enabled: !!id,
    refetchInterval: 30_000,
  });
}

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => ordersApi.getCart().then((r) => r.data),
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.placeOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      ordersApi.updateStatus(id, status, reason).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['order', data.id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
