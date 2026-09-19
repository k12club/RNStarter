/** ลำดับ section ในหน้า gallery (testID = gallery-section-<name>, หัวข้ออยู่ใน gallery.json) */
export const GALLERY_SECTIONS = [
  'typography',
  'colors',
  'icons',
  'buttons',
  'inputs',
  'form',
  'display',
  'feedback',
  'sheets',
  'nativewind',
  'responsive',
] as const;

export type GallerySectionName = (typeof GALLERY_SECTIONS)[number];

/** เวลาที่แสดง LoadingOverlay ตัวอย่าง */
export const LOADING_DEMO_MS = 1500;

/** เวลาจำลองการลองใหม่ของ ErrorState */
export const RETRY_DEMO_MS = 1000;

// รูปตัวอย่างจาก DummyJSON (API เดียวกับแอป) และ URL ที่โหลดไม่ได้แน่นอน (.invalid เป็น TLD สงวน)
export const DEMO_IMAGE_URL =
  'https://dummyjson.com/image/600x338?text=RN+Starter';
export const DEMO_AVATAR_URL = 'https://dummyjson.com/icon/rnstarter/128';
export const BROKEN_IMAGE_URL = 'https://example.invalid/missing.png';

// ข้อมูลตัวอย่าง (ชื่อคน ไม่แปล): ชื่อไทยใช้ตรวจตัวอักษรย่อ สมชาย ใจดี -> สจ
export const THAI_SAMPLE_NAME = 'สมชาย ใจดี';
export const LATIN_SAMPLE_NAME = 'Emily Johnson';
