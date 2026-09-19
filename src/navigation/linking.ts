import type { LinkingOptions, PathConfigMap } from '@react-navigation/native';
import { Linking } from 'react-native';

import type { RootStackParamList } from './types';

/**
 * Deep link config
 *
 * ทดสอบ:
 *   iOS     xcrun simctl openurl booted "rnstarter://products/1"
 *   Android adb shell am start -W -a android.intent.action.VIEW -d "rnstarter://products/1" com.rnstarter
 *
 * หน้าที่ต้อง login ถ้าเปิดตอนยังไม่ login จะไม่พบ route (React Navigation จะแสดงหน้าแรกแทน)
 *
 * ไม่ผูก WebView กับ deep link โดยตั้งใจ: ถ้าเปิดให้ลิงก์ภายนอกส่ง url เข้ามาได้
 * ใครก็ส่งลิงก์ที่เปิดเว็บปลอมในแอปเราได้ (phishing)
 */

// ค่าเริ่มต้นของ React Navigation ตัด getInitialURL ทิ้งถ้าเกิน 150ms
// ตอน cold start (โหลด bundle + อ่าน Keychain) เกินบ่อย ลิงก์ที่ใช้เปิดแอปจึงหายไปเฉย ๆ
// ขยายเป็น 3 วินาที (splash ยังค้างจนกว่า navigation พร้อม จึงไม่เห็นจอว่าง)
const INITIAL_URL_TIMEOUT_MS = 3000;

const screens: PathConfigMap<RootStackParamList> = {
  Login: 'login',
  MainTabs: {
    screens: {
      Home: 'home',
      Products: 'products',
      Profile: 'profile',
    },
  },
  ProductDetail: {
    path: 'products/:id',
    parse: {
      id: (id: string) => Number(id),
      // query ?title=... จากลิงก์ภายนอกจะกลายเป็นชื่อ header (ปลอมข้อความในแอปได้): ทิ้งเสมอ
      title: () => undefined,
    },
  },
  Settings: 'settings',
  ComponentGallery: 'gallery',
};

/**
 * initialRouteName: หน้าที่อยู่ใต้หน้าที่เปิดจากลิงก์ (ตามสถานะ login)
 * ไม่งั้นหน้าที่เปิดจากลิงก์จะเป็นหน้าเดียวใน stack และไม่มีปุ่มย้อนกลับ
 */
export function createLinking(
  initialRouteName: 'Login' | 'MainTabs',
): LinkingOptions<RootStackParamList> {
  return {
    prefixes: ['rnstarter://'],
    getInitialURL: () =>
      Promise.race([
        Linking.getInitialURL(),
        new Promise<null>(resolve =>
          setTimeout(() => resolve(null), INITIAL_URL_TIMEOUT_MS),
        ),
      ]),
    config: { initialRouteName, screens },
  };
}
