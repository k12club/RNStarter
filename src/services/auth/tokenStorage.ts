import * as Keychain from 'react-native-keychain';

import { logger } from '@/utils/logger';

/**
 * เก็บ access / refresh token ใน Keychain (iOS) / Keystore (Android)
 * ไม่เก็บใน MMKV / redux-persist เพราะไฟล์พวกนั้นไม่เข้ารหัส
 *
 * มี cache ในหน่วยความจำ เพื่อให้ interceptor อ่าน token แบบ sync ได้
 * ต้องเรียก load() หนึ่งครั้งตอนเปิดแอป (restoreSession() ใน App.tsx ทำให้แล้ว)
 */
export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const SERVICE = 'app.auth.tokens';
const USERNAME = 'tokens';

let cache: AuthTokens | null = null;

function isAuthTokens(value: unknown): value is AuthTokens {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as AuthTokens).accessToken === 'string' &&
    typeof (value as AuthTokens).refreshToken === 'string'
  );
}

export const tokenStorage = {
  /** อ่าน token จาก Keychain เข้า cache คืนค่า null ถ้ายังไม่เคย login */
  async load(): Promise<AuthTokens | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: SERVICE,
      });
      if (!credentials) {
        cache = null;
        return null;
      }
      const parsed: unknown = JSON.parse(credentials.password);
      cache = isAuthTokens(parsed) ? parsed : null;
      return cache;
    } catch (error) {
      // Keychain อ่านไม่ได้ (เช่น ย้ายเครื่อง / restore backup) ให้ถือว่ายังไม่ได้ login
      logger.warn('tokenStorage.load failed', error);
      cache = null;
      return null;
    }
  },

  /** อ่านแบบ sync จาก cache (ใช้ใน axios interceptor) */
  get(): AuthTokens | null {
    return cache;
  },

  async save(tokens: AuthTokens): Promise<void> {
    cache = tokens;
    // ห้ามใส่ option cloudSync (แม้เป็น false): v10 บน iOS เปิด iCloud sync ทันทีที่มี key นี้ (#800)
    const write = () =>
      Keychain.setGenericPassword(USERNAME, JSON.stringify(tokens), {
        service: SERVICE,
        accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });
    try {
      await write();
    } catch (error) {
      // iOS บางครั้ง reject ด้วย errSecDuplicateItem (#813): ลบของเดิมแล้วเขียนใหม่ครั้งเดียว
      logger.warn('tokenStorage.save failed, retrying after reset', error);
      await Keychain.resetGenericPassword({ service: SERVICE });
      await write();
    }
  },

  async clear(): Promise<void> {
    cache = null;
    try {
      await Keychain.resetGenericPassword({ service: SERVICE });
    } catch (error) {
      logger.warn('tokenStorage.clear failed', error);
    }
  },
};
