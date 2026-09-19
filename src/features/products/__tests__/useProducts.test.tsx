import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { ApiError } from '@/services/api/errors';
import { queryKeys } from '@/services/query/queryKeys';

import { makePage, makeProduct } from '../__fixtures__/products';
import { productsApi } from '../api/productsApi';
import {
  getNextSkip,
  normalizeListParams,
  useProduct,
} from '../hooks/useProducts';
import { formatCategoryName, formatUsd, getAvailability } from '../utils';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getNextSkip', () => {
  it('ยังไม่ครบ total: คืน skip ของหน้าถัดไป', () => {
    const page = makePage([makeProduct()], { skip: 0, limit: 20, total: 194 });
    expect(getNextSkip(page)).toBe(20);
  });

  it('หน้าสุดท้าย (skip + limit >= total): ไม่มีหน้าถัดไป', () => {
    // DummyJSON หน้าสุดท้ายส่ง limit = จำนวนที่เหลือจริง
    const page = makePage([makeProduct()], {
      skip: 180,
      limit: 14,
      total: 194,
    });
    expect(getNextSkip(page)).toBeUndefined();
  });

  it('หน้าว่าง: หยุดโหลด แม้ total จะบอกว่ายังมี (กันวนไม่รู้จบ)', () => {
    expect(
      getNextSkip(makePage([], { skip: 20, limit: 20, total: 100 })),
    ).toBeUndefined();
    expect(getNextSkip(makePage([]))).toBeUndefined();
  });
});

describe('normalizeListParams', () => {
  it('มีคำค้นหา: ไม่สนหมวด (DummyJSON ใช้พร้อมกันไม่ได้)', () => {
    expect(
      normalizeListParams({ search: ' phone ', category: 'beauty' }),
    ).toEqual({ search: 'phone' });
  });

  it('คำค้นหาว่าง: ใช้หมวด / ไม่มีอะไรเลยได้ object ว่าง', () => {
    expect(normalizeListParams({ search: '  ', category: 'beauty' })).toEqual({
      category: 'beauty',
    });
    expect(normalizeListParams({})).toEqual({});
  });
});

describe('utils', () => {
  it('ราคาแสดงเป็น USD ไม่ใช่บาท', () => {
    expect(formatUsd(9.99)).toBe('$9.99');
    expect(formatUsd(1899.5)).toBe('$1,899.50');
  });

  it('slug หมวด -> ชื่อที่อ่านได้', () => {
    expect(formatCategoryName('mens-shirts')).toBe('Mens Shirts');
    expect(formatCategoryName('beauty')).toBe('Beauty');
  });

  it('สถานะสินค้า -> สีของ badge / สถานะที่ไม่รู้จักคืน null', () => {
    expect(getAvailability('In Stock')?.status).toBe('success');
    expect(getAvailability('Low Stock')?.status).toBe('warning');
    expect(getAvailability('Out of Stock')?.status).toBe('danger');
    expect(getAvailability('Discontinued')).toBeNull();
    expect(getAvailability('toString')).toBeNull();
  });
});

describe('useProduct', () => {
  it('ใช้ข้อมูลจาก cache ของรายการเป็น placeholder ระหว่างโหลดรายละเอียด', async () => {
    const target = makeProduct({ id: 2, title: 'Eyeshadow Palette' });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(queryKeys.products.list({ category: 'beauty' }), {
      pages: [makePage([makeProduct({ id: 1 }), target])],
      pageParams: [0],
    });
    // ไม่ resolve: ค้างสถานะกำลังโหลด เพื่อดู placeholder
    const getById = jest
      .spyOn(productsApi, 'getById')
      .mockReturnValue(new Promise(() => {}));

    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result, unmount } = await renderHook(() => useProduct(2), {
      wrapper: Wrapper,
    });

    expect(result.current.data).toEqual(target);
    expect(result.current.isPlaceholderData).toBe(true);
    expect(getById).toHaveBeenCalledWith(2, expect.anything());

    await unmount();
    queryClient.clear();
  });

  // placeholderData ของ React Query ใช้แค่ตอน pending: ถ้าไม่กันไว้ หน้าจอจะสลับจากข้อมูลเป็นหน้า error
  it.each([
    ['network', undefined],
    ['server', 503],
  ] as const)(
    'โหลดเบื้องหลังไม่สำเร็จ (%s): ยังใช้ข้อมูลจากรายการต่อ',
    async (kind, status) => {
      const target = makeProduct({ id: 2, title: 'Eyeshadow Palette' });
      const { queryClient, Wrapper } = setupListCache([target]);
      jest
        .spyOn(productsApi, 'getById')
        .mockRejectedValue(new ApiError({ kind, status, message: kind }));

      const { result, unmount } = await renderHook(() => useProduct(2), {
        wrapper: Wrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.data).toEqual(target);

      await unmount();
      queryClient.clear();
    },
  );

  it('404: ไม่ใช้ข้อมูลจากรายการ (สินค้าถูกลบแล้ว) data เป็น undefined', async () => {
    const { queryClient, Wrapper } = setupListCache([makeProduct({ id: 2 })]);
    jest
      .spyOn(productsApi, 'getById')
      .mockRejectedValue(
        new ApiError({ kind: 'not_found', status: 404, message: 'Not found' }),
      );

    const { result, unmount } = await renderHook(() => useProduct(2), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();

    await unmount();
    queryClient.clear();
  });
});

function setupListCache(products: ReturnType<typeof makeProduct>[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(queryKeys.products.list({}), {
    pages: [makePage(products)],
    pageParams: [0],
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { queryClient, Wrapper };
}
