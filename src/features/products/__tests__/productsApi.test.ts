import type { AxiosResponse } from 'axios';

import { apiClient } from '@/services/api/client';

import { makePage, makeProduct } from '../__fixtures__/products';
import { productsApi } from '../api/productsApi';

function mockGet(data: unknown) {
  return jest
    .spyOn(apiClient, 'get')
    .mockResolvedValue({ data } as AxiosResponse);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('productsApi สร้าง URL / params ถูกต้อง', () => {
  it('list: GET /products?limit=&skip=', async () => {
    const page = makePage([makeProduct()]);
    const get = mockGet(page);

    await expect(productsApi.list({ limit: 20, skip: 40 })).resolves.toEqual(
      page,
    );
    expect(get).toHaveBeenCalledWith('/products', {
      params: { limit: 20, skip: 40 },
    });
  });

  it('list: select หลายฟิลด์ต่อกันด้วย comma', async () => {
    const get = mockGet(makePage([]));

    await productsApi.list({ limit: 10, skip: 0, select: ['title', 'price'] });
    expect(get).toHaveBeenCalledWith('/products', {
      params: { limit: 10, skip: 0, select: 'title,price' },
    });
  });

  it('search: GET /products/search?q=', async () => {
    const get = mockGet(makePage([]));

    await productsApi.search({ q: 'phone', limit: 20, skip: 0 });
    expect(get).toHaveBeenCalledWith('/products/search', {
      params: { q: 'phone', limit: 20, skip: 0 },
    });
  });

  it('listByCategory: slug อยู่ใน path และถูก encode', async () => {
    const get = mockGet(makePage([]));

    await productsApi.listByCategory({
      category: 'home-decoration',
      limit: 20,
      skip: 20,
    });
    expect(get).toHaveBeenCalledWith('/products/category/home-decoration', {
      params: { limit: 20, skip: 20 },
    });

    await productsApi.listByCategory({ category: 'a/b c', limit: 20, skip: 0 });
    expect(get).toHaveBeenLastCalledWith('/products/category/a%2Fb%20c', {
      params: { limit: 20, skip: 0 },
    });
  });

  it('getById: GET /products/{id}', async () => {
    const product = makeProduct({ id: 7 });
    const get = mockGet(product);

    await expect(productsApi.getById(7)).resolves.toEqual(product);
    expect(get).toHaveBeenCalledWith('/products/7', {});
  });

  it('categories: ตัด url ทิ้ง เหลือ slug / name', async () => {
    const get = mockGet([
      {
        slug: 'beauty',
        name: 'Beauty',
        url: 'https://dummyjson.com/products/category/beauty',
      },
    ]);

    await expect(productsApi.categories()).resolves.toEqual([
      { slug: 'beauty', name: 'Beauty' },
    ]);
    expect(get).toHaveBeenCalledWith('/products/categories', {});
  });

  it('ส่ง signal ต่อให้ axios เพื่อยกเลิก request ได้', async () => {
    const get = mockGet(makePage([]));
    const controller = new AbortController();

    await productsApi.search(
      { q: 'x', limit: 20, skip: 0 },
      { signal: controller.signal },
    );
    expect(get).toHaveBeenCalledWith('/products/search', {
      params: { q: 'x', limit: 20, skip: 0 },
      signal: controller.signal,
    });
  });
});
