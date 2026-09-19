import { createMMKV } from 'react-native-mmkv';

/**
 * Key-value storage หลักของแอป (MMKV: sync, เร็ว)
 *
 * ใช้เก็บค่าตั้งค่า / cache เล็ก ๆ ที่ไม่ใช่ความลับ
 * ห้ามเก็บ token / password ที่นี่ (ไม่เข้ารหัส) ให้ใช้ services/auth/tokenStorage.ts
 *
 * ใน Jest ตัว library สร้าง mock ในหน่วยความจำให้อัตโนมัติ
 */
export const storage = createMMKV({ id: 'app-storage' });

/** helper สำหรับเก็บ object เป็น JSON */
export const jsonStorage = {
  get<T>(key: string): T | null {
    const raw = storage.getString(key);
    if (raw === undefined) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown) {
    storage.set(key, JSON.stringify(value));
  },
  remove(key: string) {
    storage.remove(key);
  },
};
