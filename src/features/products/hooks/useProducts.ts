import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { toApiError } from '@/services/api/errors';
import { queryKeys } from '@/services/query/queryKeys';

import { productsApi } from '../api/productsApi';
import type { Product, ProductListParams, ProductListResponse } from '../types';

export const PRODUCTS_PAGE_SIZE = 20;

/** หมวดหมู่แทบไม่เปลี่ยน โหลดครั้งเดียวต่อวันพอ */
const CATEGORIES_STALE_TIME = 24 * 60 * 60 * 1000;

/** prefix ของ key รายการสินค้าทุกชุด (ทุก search / category) ใช้หา placeholder ของหน้ารายละเอียด */
const PRODUCT_LISTS_KEY = [...queryKeys.products.all, 'list'] as const;

type ProductPages = InfiniteData<ProductListResponse, number>;

/**
 * ตัดค่าว่างออก และให้ search ชนะ category (DummyJSON ค้นหาพร้อมกรองหมวดไม่ได้)
 * key ของ cache จึงเหมือนกันเสมอสำหรับตัวกรองที่ให้ผลเดียวกัน
 */
export function normalizeListParams({
  search,
  category,
}: ProductListParams): ProductListParams {
  const q = search?.trim();
  if (q) {
    return { search: q };
  }
  if (category) {
    return { category };
  }
  return {};
}

/** skip ของหน้าถัดไป หรือ undefined เมื่อโหลดครบแล้ว */
export function getNextSkip(page: ProductListResponse): number | undefined {
  // หน้าว่าง = จบ กันโหลดวนไม่รู้จบถ้า total ไม่ตรงกับข้อมูลจริง
  if (page.products.length === 0) {
    return undefined;
  }
  const next = page.skip + page.limit;
  return next < page.total ? next : undefined;
}

function fetchProductPage(
  params: ProductListParams,
  skip: number,
  signal: AbortSignal,
): Promise<ProductListResponse> {
  const page = { limit: PRODUCTS_PAGE_SIZE, skip };
  if (params.search) {
    return productsApi.search({ q: params.search, ...page }, { signal });
  }
  if (params.category) {
    return productsApi.listByCategory(
      { category: params.category, ...page },
      { signal },
    );
  }
  return productsApi.list(page, { signal });
}

// ประกาศนอก hook: select ที่อ้างอิงเดิมทุก render ทำให้ React Query จำผลไว้ได้ (ไม่ flatten ใหม่ทุกครั้ง)
function selectProductList(data: ProductPages) {
  return {
    products: data.pages.flatMap(page => page.products),
    total: data.pages[0]?.total ?? 0,
  };
}

/**
 * รายการสินค้าแบบโหลดทีละหน้า (infinite scroll)
 * data = { products (รวมทุกหน้าแล้ว), total }
 */
export function useProductList(params: ProductListParams) {
  const normalized = normalizeListParams(params);

  return useInfiniteQuery({
    queryKey: queryKeys.products.list(normalized),
    queryFn: ({ pageParam, signal }) =>
      fetchProductPage(normalized, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: getNextSkip,
    select: selectProductList,
  });
}

/** หาสินค้าจาก cache ของรายการ (ทุก search / category) เพื่อแสดงทันทีระหว่างโหลดรายละเอียด */
export function findProductInLists(
  queryClient: QueryClient,
  id: number,
): Product | undefined {
  const lists = queryClient.getQueriesData<ProductPages>({
    queryKey: PRODUCT_LISTS_KEY,
  });
  for (const [, data] of lists) {
    for (const page of data?.pages ?? []) {
      const found = page.products.find(product => product.id === id);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * รายละเอียดสินค้า: ถ้าเคยเห็นในรายการแล้วจะแสดงทันที (placeholderData)
 * แล้วค่อยโหลดข้อมูลล่าสุดจาก /products/:id เบื้องหลัง
 * โหลดเบื้องหลังไม่สำเร็จ (network / timeout / 5xx) ยังแสดงข้อมูลจากรายการต่อ ไม่สลับเป็นหน้า error
 */
export function useProduct(id: number) {
  const queryClient = useQueryClient();

  // ระบุ type เอง: placeholderData แบบฟังก์ชันทำให้ TypeScript เดา type ของข้อมูลผิด
  const query = useQuery<Product>({
    queryKey: queryKeys.products.detail(id),
    queryFn: ({ signal }) => productsApi.getById(id, { signal }),
    placeholderData: () => findProductInLists(queryClient, id),
  });

  // React Query ใช้ placeholderData แค่ตอน pending: พอ error แล้ว data หายทั้งที่มีข้อมูลในรายการ
  // 404 ไม่ใช้ข้อมูลเดิม (สินค้าถูกลบแล้ว ต้องแสดง error ตามจริง)
  if (
    query.data === undefined &&
    query.isError &&
    toApiError(query.error).isRetryable
  ) {
    const cached = findProductInLists(queryClient, id);
    if (cached) {
      return { ...query, data: cached };
    }
  }
  return query;
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.products.categories(),
    queryFn: ({ signal }) => productsApi.categories({ signal }),
    staleTime: CATEGORIES_STALE_TIME,
  });
}
