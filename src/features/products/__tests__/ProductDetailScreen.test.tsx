import { screen, userEvent } from '@testing-library/react-native';

import { ApiError } from '@/services/api/errors';
import { renderScreen } from '@/test-utils/renderScreen';

import { makeProduct } from '../__fixtures__/products';
import { productsApi } from '../api/productsApi';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';

const PRODUCT = makeProduct({
  id: 1,
  title: 'Essence Mascara Lash Princess',
  description: 'A popular mascara known for its volumizing effects.',
  price: 9.99,
  discountPercentage: 10.48,
  rating: 2.56,
  stock: 99,
  brand: 'Essence',
  category: 'beauty',
  availabilityStatus: 'In Stock',
  sku: 'BEA-ESS-ESS-001',
  warrantyInformation: '1 week warranty',
  shippingInformation: 'Ships in 3-5 business days',
  returnPolicy: 'No return policy',
});

function renderDetail(id = 1) {
  return renderScreen(ProductDetailScreen, {
    routeName: 'ProductDetail',
    params: { id, title: PRODUCT.title },
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ProductDetailScreen', () => {
  it('ระหว่างโหลดแสดง skeleton', async () => {
    jest.spyOn(productsApi, 'getById').mockReturnValue(new Promise(() => {}));
    const view = await renderDetail();

    expect(screen.getByTestId('product-detail-loading')).toBeOnTheScreen();
    await view.unmount();
  });

  it('แสดงข้อมูลสินค้าครบ และกดเพิ่มลงตะกร้าแล้วมี toast', async () => {
    const user = userEvent.setup();
    const getById = jest
      .spyOn(productsApi, 'getById')
      .mockResolvedValue(PRODUCT);
    const view = await renderDetail();

    expect(await screen.findByText(PRODUCT.title)).toBeOnTheScreen();
    expect(getById).toHaveBeenCalledWith(1, {
      signal: expect.any(AbortSignal),
    });
    expect(screen.getByTestId('product-detail-image')).toHaveAccessibleName(
      PRODUCT.title,
    );
    expect(screen.getByText('Essence')).toBeOnTheScreen();
    expect(screen.getByTestId('product-detail-price')).toHaveTextContent(
      '$9.99',
    );
    expect(screen.getByText('ลด 10%')).toBeOnTheScreen();
    expect(screen.getByLabelText('คะแนน 2.6 จาก 5')).toBeOnTheScreen();
    expect(screen.getByText('มีสินค้า')).toBeOnTheScreen();
    expect(screen.getByText('คงเหลือ 99 ชิ้น')).toBeOnTheScreen();
    expect(screen.getByText(PRODUCT.description)).toBeOnTheScreen();
    // ข้อมูลสินค้า
    expect(screen.getByText('Beauty')).toBeOnTheScreen();
    expect(screen.getByText('BEA-ESS-ESS-001')).toBeOnTheScreen();
    expect(screen.getByText('1 week warranty')).toBeOnTheScreen();
    expect(screen.getByText('Ships in 3-5 business days')).toBeOnTheScreen();
    expect(screen.getByText('No return policy')).toBeOnTheScreen();

    await user.press(screen.getByTestId('product-add-to-cart'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'เพิ่ม Essence Mascara Lash Princess ลงตะกร้าแล้ว',
    );
    await view.unmount();
  });

  it('สินค้าหมด: ปุ่มเพิ่มลงตะกร้ากดไม่ได้', async () => {
    jest.spyOn(productsApi, 'getById').mockResolvedValue({
      ...PRODUCT,
      stock: 0,
      availabilityStatus: 'Out of Stock',
    });
    const view = await renderDetail();

    const button = await screen.findByTestId('product-add-to-cart');
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleName('สินค้าหมด');
    await view.unmount();
  });

  it('โหลดไม่สำเร็จ: แสดง error แล้วกดลองอีกครั้งได้', async () => {
    const user = userEvent.setup();
    const getById = jest
      .spyOn(productsApi, 'getById')
      .mockRejectedValueOnce(
        new ApiError({ kind: 'not_found', status: 404, message: 'Not found' }),
      )
      .mockResolvedValueOnce(PRODUCT);
    const view = await renderDetail();

    expect(await screen.findByText('ไม่พบข้อมูลที่ต้องการ')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'ลองอีกครั้ง' }));

    expect(await screen.findByText(PRODUCT.title)).toBeOnTheScreen();
    expect(getById).toHaveBeenCalledTimes(2);
    await view.unmount();
  });
});
