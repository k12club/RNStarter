import { LogBox } from 'react-native';

import { authApi } from '@/features/auth/api/authApi';
import { endSession } from '@/features/auth/session';
import { i18n, initI18n, resolveInitialLanguage } from '@/i18n';
import { configureApiAuth, setApiLanguage } from '@/services/api/client';
import { setupQueryManagers } from '@/services/query/managers';
import { store } from '@/store';

/**
 * งานที่ต้องทำครั้งเดียวก่อน render แรก (sync ทั้งหมด)
 * - i18n ต้องพร้อมก่อน render เพื่อไม่ให้ข้อความกระพริบ
 * - ภาษาที่เลือกไว้อ่านได้ทันทีเพราะ store โหลด state จาก MMKV แบบ sync
 *
 * งาน async (อ่าน token จาก Keychain) คือ restoreSession() ใน useEffect ของ App.tsx
 */
let bootstrapped = false;

export function bootstrap() {
  if (bootstrapped) {
    return;
  }
  bootstrapped = true;

  if (__DEV__) {
    // workaround: @gorhom/bottom-sheet 5.2.14 ส่ง dependency array ให้ hook ของ Reanimated 4.6
    // ทำให้เตือนทุกครั้งที่เปิด sheet (ทำงานถูกต้อง แค่เตือน) ซ่อนเฉพาะใน LogBox ส่วน console ยังแสดง
    // เอาออกเมื่อ bottom-sheet แก้ (github.com/gorhom/react-native-bottom-sheet/issues/2758)
    // หรืออัปเกรดเป็น Reanimated 4.7+ (เตือนครั้งเดียว)
    LogBox.ignoreLogs(['[Reanimated] dependencies should only be used in web']);
  }

  initI18n(resolveInitialLanguage(store.getState().settings.language));
  setApiLanguage(i18n.language);
  i18n.on('languageChanged', setApiLanguage);

  configureApiAuth({
    refresh: authApi.refresh,
    onSessionExpired: () => {
      endSession({ expired: true });
    },
  });

  setupQueryManagers();
}
