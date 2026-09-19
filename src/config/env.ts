import { API_TIMEOUT_MS, API_URL, APP_ENV, ENABLE_API_LOG } from '@env';

export type AppEnv = 'development' | 'staging' | 'production';

function parseAppEnv(value: string | undefined): AppEnv {
  if (value === 'staging' || value === 'production') {
    return value;
  }
  return 'development';
}

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === '') {
    return fallback;
  }
  return value === 'true' || value === '1';
}

const appEnv = parseAppEnv(APP_ENV);

/**
 * ค่า config ของแอปที่ผ่านการตรวจแล้ว ใช้ตัวนี้แทนการ import '@env' ตรง ๆ
 * ถ้าไม่มีไฟล์ .env แอปยังรันได้ด้วยค่า default ด้านล่าง
 */
export const env = {
  appEnv,
  isDev: appEnv === 'development',
  isProduction: appEnv === 'production',
  apiUrl: (API_URL || 'https://dummyjson.com').replace(/\/+$/, ''),
  apiTimeoutMs: parseNumber(API_TIMEOUT_MS, 15000),
  enableApiLog: parseBoolean(ENABLE_API_LOG, __DEV__),
} as const;
