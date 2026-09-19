/**
 * รูปแบบข้อมูลสินค้าของ DummyJSON (https://dummyjson.com/docs/products)
 * เปลี่ยนเป็น API จริง: แก้ type ที่นี่ + api/productsApi.ts ส่วนอื่นของ feature ใช้ type ชุดนี้
 */

/** ค่าที่ DummyJSON ส่งมา (สถานะอื่นที่ไม่รู้จักจะแสดงเป็น badge สีกลาง) */
export type AvailabilityStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type Product = {
  id: number;
  title: string;
  description: string;
  /** slug ของหมวด เช่น 'mens-shirts' */
  category: string;
  /** ราคาเป็น USD */
  price: number;
  discountPercentage: number;
  /** 0 - 5 */
  rating: number;
  stock: number;
  /** สินค้าบางหมวด (เช่น groceries) ไม่มี brand */
  brand?: string;
  availabilityStatus: AvailabilityStatus | (string & {});
  thumbnail: string;
  images: string[];
  // ฟิลด์ด้านล่างมีใน response ปัจจุบัน แต่ไม่รับประกันว่าจะมีเสมอ
  sku?: string;
  tags?: string[];
  warrantyInformation?: string;
  shippingInformation?: string;
  returnPolicy?: string;
  minimumOrderQuantity?: number;
};

export type ProductCategory = {
  slug: string;
  name: string;
};

/** response แบบแบ่งหน้าของ /products, /products/search, /products/category/:slug */
export type ProductListResponse = {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
};

/** ตัวกรองรายการสินค้า: DummyJSON ค้นหาพร้อมกรองหมวดไม่ได้ ถ้ามี search จะไม่สน category */
export type ProductListParams = {
  search?: string;
  category?: string;
};
