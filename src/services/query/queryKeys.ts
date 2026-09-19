/**
 * Query key factory: รวม key ทั้งหมดไว้ที่เดียว เพื่อ invalidate ได้ถูกต้องและพิมพ์ผิดไม่ได้
 *
 * @example
 * useQuery({ queryKey: queryKeys.products.detail(id), ... })
 * queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  products: {
    all: ['products'] as const,
    list: (params: { search?: string; category?: string }) =>
      [...queryKeys.products.all, 'list', params] as const,
    detail: (id: number) => [...queryKeys.products.all, 'detail', id] as const,
    categories: () => [...queryKeys.products.all, 'categories'] as const,
  },
};
