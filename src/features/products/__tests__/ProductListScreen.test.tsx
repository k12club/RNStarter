import { screen, userEvent, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api/errors';
import { renderScreen } from '@/test-utils/renderScreen';

import { makePage, makeProduct } from '../__fixtures__/products';
import { productsApi } from '../api/productsApi';
import { ProductListScreen } from '../screens/ProductListScreen';

const MASCARA = makeProduct({
  id: 1,
  title: 'Essence Mascara Lash Princess',
  price: 9.99,
});
const PALETTE = makeProduct({
  id: 2,
  title: 'Eyeshadow Palette with Mirror',
  price: 19.99,
  brand: undefined,
  category: 'skin-care',
  availabilityStatus: 'Low Stock',
});
const IPHONE = makeProduct({
  id: 121,
  title: 'iPhone 5s',
  price: 199.99,
  category: 'smartphones',
  brand: 'Apple',
});

const CATEGORIES = [
  { slug: 'beauty', name: 'Beauty' },
  { slug: 'smartphones', name: 'Smartphones' },
];

function mockApi() {
  return {
    list: jest
      .spyOn(productsApi, 'list')
      .mockResolvedValue(makePage([MASCARA, PALETTE])),
    search: jest
      .spyOn(productsApi, 'search')
      .mockResolvedValue(makePage([IPHONE])),
    listByCategory: jest
      .spyOn(productsApi, 'listByCategory')
      .mockResolvedValue(makePage([IPHONE])),
    categories: jest
      .spyOn(productsApi, 'categories')
      .mockResolvedValue(CATEGORIES),
  };
}

function renderList() {
  return renderScreen(ProductListScreen, { routeName: 'Products' });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ProductListScreen', () => {
  it('ระหว่างโหลดครั้งแรกแสดง skeleton', async () => {
    mockApi().list.mockReturnValue(new Promise(() => {}));
    const view = await renderList();

    expect(screen.getByTestId('products-loading')).toBeOnTheScreen();
    await view.unmount();
  });

  it('แสดงรายการสินค้าจาก API (ราคาเป็น $, สถานะสินค้า, หมวด)', async () => {
    const api = mockApi();
    const view = await renderList();

    expect(await screen.findByTestId('product-item-1')).toBeOnTheScreen();
    expect(screen.getByTestId('product-item-2')).toBeOnTheScreen();
    expect(screen.getByText('Essence Mascara Lash Princess')).toBeOnTheScreen();
    expect(screen.getByText('$9.99')).toBeOnTheScreen();
    expect(screen.getByText('$19.99')).toBeOnTheScreen();
    expect(screen.getByText('Essence · Beauty')).toBeOnTheScreen();
    // ไม่มี brand: แสดงแค่หมวด
    expect(screen.getByText('Skin Care')).toBeOnTheScreen();
    expect(screen.getByText('มีสินค้า')).toBeOnTheScreen();
    expect(screen.getByText('ใกล้หมด')).toBeOnTheScreen();
    expect(screen.getByText('ทั้งหมด 2 รายการ')).toBeOnTheScreen();
    expect(screen.getByText('แสดงสินค้าครบแล้ว')).toBeOnTheScreen();

    expect(api.list).toHaveBeenCalledWith(
      { limit: 20, skip: 0 },
      { signal: expect.any(AbortSignal) },
    );
    expect(
      await screen.findByTestId('products-category-beauty'),
    ).toBeOnTheScreen();
    await view.unmount();
  });

  it('พิมพ์ค้นหา: รอ debounce แล้วค้นหาด้วยคำสุดท้ายครั้งเดียว', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    const view = await renderList();
    await screen.findByTestId('product-item-1');

    await user.type(screen.getByTestId('products-search'), 'phone');
    // ยังไม่ครบ 400ms: ยังไม่ยิง API
    expect(api.search).not.toHaveBeenCalled();

    expect(await screen.findByTestId('product-item-121')).toBeOnTheScreen();
    expect(screen.queryByTestId('product-item-1')).not.toBeOnTheScreen();
    expect(api.search).toHaveBeenCalledTimes(1);
    expect(api.search).toHaveBeenCalledWith(
      { q: 'phone', limit: 20, skip: 0 },
      { signal: expect.any(AbortSignal) },
    );
    expect(
      screen.getByText('ผลการค้นหาจากทุกหมวดหมู่ 1 รายการ'),
    ).toBeOnTheScreen();
    await view.unmount();
  });

  it('ค้นหาไม่พบ: แสดงข้อความเฉพาะ แล้วกดล้างคำค้นหากลับไปรายการเดิมทันที', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    api.search.mockResolvedValue(makePage([]));
    const view = await renderList();
    await screen.findByTestId('product-item-1');

    await user.type(screen.getByTestId('products-search'), 'zzzz');

    expect(await screen.findByText('ไม่พบสินค้าที่ค้นหา')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'ไม่มีสินค้าที่ตรงกับ "zzzz" ลองใช้คำอื่นหรือตรวจสอบตัวสะกด',
      ),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'ล้างคำค้นหา' }));

    // รายการเดิมอยู่ใน cache และล้างคำค้นหาไม่ต้องรอ debounce
    expect(screen.getByTestId('product-item-1')).toBeOnTheScreen();
    expect(screen.getByTestId('products-search')).toHaveDisplayValue('');
    await view.unmount();
  });

  it('กด chip หมวดหมู่: โหลดสินค้าเฉพาะหมวดนั้น และ chip ถูกเลือก', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    const view = await renderList();
    await screen.findByTestId('product-item-1');

    expect(screen.getByTestId('products-category-all')).toBeSelected();
    await user.press(
      await screen.findByTestId('products-category-smartphones'),
    );

    expect(await screen.findByTestId('product-item-121')).toBeOnTheScreen();
    expect(api.listByCategory).toHaveBeenCalledWith(
      { category: 'smartphones', limit: 20, skip: 0 },
      { signal: expect.any(AbortSignal) },
    );
    expect(screen.getByTestId('products-category-smartphones')).toBeSelected();
    expect(screen.getByTestId('products-category-all')).not.toBeSelected();
    await view.unmount();
  });

  it('ค้นหาขณะเลือกหมวดอยู่: ค้นจากทุกหมวด (ไม่ส่งหมวดไปด้วย)', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    const view = await renderList();
    await user.press(await screen.findByTestId('products-category-beauty'));
    await screen.findByTestId('product-item-121');

    await user.type(screen.getByTestId('products-search'), 'phone');

    await waitFor(() => expect(api.search).toHaveBeenCalledTimes(1));
    expect(api.search).toHaveBeenCalledWith(
      { q: 'phone', limit: 20, skip: 0 },
      expect.anything(),
    );
    expect(
      await screen.findByText('ผลการค้นหาจากทุกหมวดหมู่ 1 รายการ'),
    ).toBeOnTheScreen();
    expect(screen.getByTestId('products-category-beauty')).not.toBeSelected();
    await view.unmount();
  });

  it('กดสินค้าแล้วไปหน้ารายละเอียดพร้อม id และชื่อ', async () => {
    const user = userEvent.setup();
    mockApi();
    const view = await renderList();

    await user.press(await screen.findByTestId('product-item-1'));

    expect(await screen.findByText('route:ProductDetail')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'params:{"id":1,"title":"Essence Mascara Lash Princess"}',
      ),
    ).toBeOnTheScreen();
    await view.unmount();
  });

  it('โหลดไม่สำเร็จ: แสดง error แล้วกดลองอีกครั้งได้', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    api.list
      .mockRejectedValueOnce(
        new ApiError({ kind: 'network', message: 'Network Error' }),
      )
      .mockResolvedValueOnce(makePage([MASCARA]));
    const view = await renderList();

    expect(await screen.findByText('เกิดข้อผิดพลาด')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง',
      ),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'ลองอีกครั้ง' }));

    expect(await screen.findByTestId('product-item-1')).toBeOnTheScreen();
    expect(api.list).toHaveBeenCalledTimes(2);
    await view.unmount();
  });

  it('เลื่อนถึงท้ายรายการ: โหลดหน้าถัดไปด้วย skip ต่อจากหน้าก่อน', async () => {
    const api = mockApi();
    const secondPage = [makeProduct({ id: 3 }), makeProduct({ id: 4 })];
    api.list
      .mockResolvedValueOnce(
        makePage([MASCARA, PALETTE], { skip: 0, limit: 2, total: 4 }),
      )
      .mockResolvedValueOnce(
        makePage(secondPage, { skip: 2, limit: 2, total: 4 }),
      );
    const view = await renderList();

    // รายการสั้นกว่าจอ (Jest วัดจอสูง 900) FlashList จึงเรียก onEndReached เอง
    expect(await screen.findByTestId('product-item-4')).toBeOnTheScreen();
    expect(screen.getByTestId('product-item-1')).toBeOnTheScreen();
    expect(api.list).toHaveBeenNthCalledWith(
      2,
      { limit: 20, skip: 2 },
      expect.anything(),
    );
    expect(await screen.findByText('แสดงสินค้าครบแล้ว')).toBeOnTheScreen();
    expect(api.list).toHaveBeenCalledTimes(2);
    await view.unmount();
  });
});
