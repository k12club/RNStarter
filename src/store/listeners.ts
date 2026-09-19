import { createListenerMiddleware } from '@reduxjs/toolkit';

import { i18n, resolveInitialLanguage } from '@/i18n';

import { resetSettings, setLanguage } from './slices/settingsSlice';

/**
 * Side effect ที่ผูกกับ action ของ Redux (แทน thunk / saga สำหรับงานง่าย ๆ)
 * เพิ่ม listener ใหม่: listenerMiddleware.startListening({ actionCreator, effect })
 */
export const listenerMiddleware = createListenerMiddleware();

// เปลี่ยนภาษาใน store -> เปลี่ยนภาษาของ i18n (dayjs / zod / API เปลี่ยนตามผ่าน languageChanged)
listenerMiddleware.startListening({
  actionCreator: setLanguage,
  effect: async action => {
    if (i18n.language !== action.payload) {
      await i18n.changeLanguage(action.payload);
    }
  },
});

// ล้างค่าตั้งค่า (language = null): กลับไปใช้ภาษาเริ่มต้นทันที
// ไม่งั้นข้อความค้างภาษาเดิมจนเปิดแอปใหม่ แล้วค่อยเปลี่ยนภาษาเอง
listenerMiddleware.startListening({
  actionCreator: resetSettings,
  effect: async () => {
    const language = resolveInitialLanguage(null);
    if (i18n.language !== language) {
      await i18n.changeLanguage(language);
    }
  },
});
