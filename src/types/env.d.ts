/**
 * ตัวแปรจากไฟล์ .env (โหลดตอน build ผ่าน react-native-dotenv)
 * เพิ่มตัวแปรใหม่: ใส่ใน .env.example + ประกาศที่นี่ + map ใน src/config/env.ts
 *
 * ค่าเหล่านี้ถูกฝังลงใน JS bundle: ห้ามใส่ secret (API secret key, private key)
 */
declare module '@env' {
  export const APP_ENV: string | undefined;
  export const API_URL: string | undefined;
  export const API_TIMEOUT_MS: string | undefined;
  export const ENABLE_API_LOG: string | undefined;
}
