import type { Product, ProductListResponse } from '../types';

/** สินค้าตัวอย่างสำหรับ test (รูปแบบเดียวกับ DummyJSON /products/1) */
export function makeProduct(overrides: Partial<Product> = {}): Product {
  const id = overrides.id ?? 1;
  return {
    id,
    title: `Product ${id}`,
    description: `Description of product ${id}`,
    category: 'beauty',
    price: 9.99,
    discountPercentage: 10.48,
    rating: 4.56,
    stock: 99,
    brand: 'Essence',
    availabilityStatus: 'In Stock',
    thumbnail: `https://cdn.example.com/products/${id}/thumbnail.webp`,
    images: [`https://cdn.example.com/products/${id}/1.webp`],
    sku: `SKU-${id}`,
    warrantyInformation: '1 week warranty',
    shippingInformation: 'Ships in 3-5 business days',
    returnPolicy: 'No return policy',
    ...overrides,
  };
}

/**
 * หน้าหนึ่งของรายการ ค่าเริ่มต้น total = จำนวนสินค้า (ไม่มีหน้าถัดไป)
 * สำคัญ: FlashList ใน Jest เรียก onEndReached ทันทีเมื่อรายการสั้นกว่าจอ
 * ถ้า total มากกว่านี้จะโหลดหน้าถัดไปเอง
 */
export function makePage(
  products: Product[],
  {
    total = products.length,
    skip = 0,
    limit = products.length,
  }: Partial<Pick<ProductListResponse, 'total' | 'skip' | 'limit'>> = {},
): ProductListResponse {
  return { products, total, skip, limit };
}
