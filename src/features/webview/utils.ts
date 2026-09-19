import { ApiError, type ApiErrorKind } from '@/services/api/errors';

/**
 * หน้า WebView เปิดได้เฉพาะ https
 * ตรวจด้วย regex แทน new URL(): URL ของ React Native ยังไม่รองรับ getter บางตัว (เช่น protocol)
 * ตรวจ string ตัวเดียวกับที่ส่งให้ WebView (ไม่ trim) มีช่องว่างนำหน้า = ไม่ผ่าน
 */
export function isHttpsUrl(url: unknown): url is string {
  return typeof url === 'string' && /^https:\/\/[^\s/?#]+/i.test(url);
}

/** หน้าว่าง / iframe ที่ฝังเนื้อหาเอง (srcdoc): ไม่ได้โหลดอะไรจากภายนอก */
const INERT_URL = /^about:(blank|srcdoc)(?:[?#]|$)/i;

export type NavigationDecision = 'load' | 'external' | 'block';

/**
 * url ที่ WebView กำลังจะเปิด (onShouldStartLoadWithRequest)
 * - https / about:blank: โหลดในแอป
 * - iframe (iOS ส่ง isTopFrame = false) ที่ไม่ใช่ https: ไม่โหลดและไม่ส่งต่อ
 *   กันโฆษณา / iframe ในหน้าเว็บสั่งเปิด Safari หรือแอปอื่นเองโดยผู้ใช้ไม่ได้กด
 * - frame หลัก (http, tel:, mailto: ...): ส่งให้ระบบเปิด
 * Android ไม่ส่ง isTopFrame มา (undefined) จึงถือเป็น frame หลัก
 */
export function getNavigationDecision(
  url: string,
  isTopFrame?: boolean,
): NavigationDecision {
  if (isHttpsUrl(url) || INERT_URL.test(url)) {
    return 'load';
  }
  return isTopFrame === false ? 'block' : 'external';
}

// เว็บภายนอก: 401 / 403 ไม่ได้แปลว่า session ของแอปหมดอายุ จึงไม่แปลงเป็น unauthorized / forbidden
function kindFromHttpStatus(status: number): ApiErrorKind {
  if (status === 404) {
    return 'not_found';
  }
  if (status >= 500) {
    return 'server';
  }
  return 'unknown';
}

/** error จากการโหลดหน้าเว็บ แปลงเป็น ApiError เพื่อให้ ErrorState แสดงข้อความที่แปลแล้ว */
export function toWebViewError(event: {
  statusCode?: number;
  description?: string;
}): ApiError {
  if (event.statusCode === undefined) {
    return new ApiError({
      kind: 'network',
      message: event.description || 'Failed to load page',
    });
  }
  return new ApiError({
    kind: kindFromHttpStatus(event.statusCode),
    status: event.statusCode,
    message: event.description || `HTTP ${event.statusCode}`,
  });
}
