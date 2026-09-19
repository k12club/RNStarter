import { apiClient } from '@/services/api/client';

import type { Product, ProductCategory, ProductListResponse } from '../types';

/**
 * Products API (ตัวอย่างใช้ DummyJSON: https://dummyjson.com/docs/products)
 * เปลี่ยนเป็น API จริง: แก้ path / params / รูปแบบ response ในไฟล์นี้ไฟล์เดียว
 * ทุกฟังก์ชันรับ signal ของ React Query เพื่อยกเลิก request ที่ไม่ใช้แล้ว (เช่น พิมพ์ค้นหาต่อ)
 */

export type PageArgs = {
  limit: number;
  skip: number;
  /** เลือกเฉพาะบางฟิลด์ (DummyJSON ส่ง id มาเสมอ) */
  select?: readonly string[];
};

export type RequestOptions = {
  signal?: AbortSignal;
};

type CategoryResponse = Array<{ slug: string; name: string; url?: string }>;

function pageParams({ limit, skip, select }: PageArgs) {
  return select && select.length > 0
    ? { limit, skip, select: select.join(',') }
    : { limit, skip };
}

export const productsApi = {
  /** GET /products?limit=&skip=&select= */
  async list(
    args: PageArgs,
    options: RequestOptions = {},
  ): Promise<ProductListResponse> {
    const { data } = await apiClient.get<ProductListResponse>('/products', {
      params: pageParams(args),
      signal: options.signal,
    });
    return data;
  },

  /** GET /products/search?q=&limit=&skip= */
  async search(
    { q, ...page }: PageArgs & { q: string },
    options: RequestOptions = {},
  ): Promise<ProductListResponse> {
    const { data } = await apiClient.get<ProductListResponse>(
      '/products/search',
      { params: { q, ...pageParams(page) }, signal: options.signal },
    );
    return data;
  },

  /** GET /products/category/{slug}?limit=&skip= */
  async listByCategory(
    { category, ...page }: PageArgs & { category: string },
    options: RequestOptions = {},
  ): Promise<ProductListResponse> {
    const { data } = await apiClient.get<ProductListResponse>(
      `/products/category/${encodeURIComponent(category)}`,
      { params: pageParams(page), signal: options.signal },
    );
    return data;
  },

  /** GET /products/{id} */
  async getById(id: number, options: RequestOptions = {}): Promise<Product> {
    const { data } = await apiClient.get<Product>(`/products/${id}`, {
      signal: options.signal,
    });
    return data;
  },

  /** GET /products/categories -> [{ slug, name }] (ตัด url ที่ไม่ได้ใช้ทิ้ง) */
  async categories(options: RequestOptions = {}): Promise<ProductCategory[]> {
    const { data } = await apiClient.get<CategoryResponse>(
      '/products/categories',
      { signal: options.signal },
    );
    return data.map(({ slug, name }) => ({ slug, name }));
  },
};
