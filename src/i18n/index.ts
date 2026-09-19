import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { findBestLanguageTag } from 'react-native-localize';
import { z } from 'zod';

import dayjs from '@/utils/date';

import {
  type AppLanguage,
  DEFAULT_LANGUAGE,
  FOLLOW_DEVICE_LANGUAGE,
  isAppLanguage,
  SUPPORTED_LANGUAGES,
} from './languages';
import { defaultNS, namespaces, resources } from './resources';

/**
 * i18n ของแอป
 *
 * ข้อกำหนด:
 * - index.js ต้อง import 'intl-pluralrules' ก่อนไฟล์นี้ (Hermes ไม่มี Intl.PluralRules
 *   ถ้าไม่มี polyfill ข้อความที่มี count จะ fallback เป็นภาษาอื่นแบบเงียบ ๆ)
 * - ภาษาไทยมี plural แค่ _other ส่วนอังกฤษมี _one / _other
 * - ห้ามใช้ formatter relativetime / list ของ i18next (Hermes ไม่มี Intl.RelativeTimeFormat / ListFormat)
 *   ใช้ formatRelative() ใน utils/format.ts แทน
 */

/**
 * ภาษาที่ผู้ใช้เลือกไว้ > (ถ้า followDevice) ภาษาของเครื่องที่รองรับ > ไทย
 * ค่าเริ่มต้นของ followDevice อยู่ที่ FOLLOW_DEVICE_LANGUAGE ใน languages.ts
 */
export function resolveInitialLanguage(
  saved: AppLanguage | null | undefined,
  { followDevice = FOLLOW_DEVICE_LANGUAGE }: { followDevice?: boolean } = {},
): AppLanguage {
  if (saved && isAppLanguage(saved)) {
    return saved;
  }
  if (!followDevice) {
    return DEFAULT_LANGUAGE;
  }
  const best = findBestLanguageTag(SUPPORTED_LANGUAGES);
  const tag = best?.languageTag.split('-')[0];
  return isAppLanguage(tag) ? tag : DEFAULT_LANGUAGE;
}

/** สิ่งที่ต้องเปลี่ยนตามภาษา นอกเหนือจากข้อความ */
function applyLanguage(language: string) {
  dayjs.locale(language === 'th' ? 'th' : 'en');
  z.config(language === 'th' ? z.locales.th() : z.locales.en());
}

/** เรียกครั้งเดียวตอนเปิดแอป (ใน bootstrap) ก่อน render */
export function initI18n(language: AppLanguage) {
  if (i18n.isInitialized) {
    return i18n;
  }

  i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: namespaces,
    defaultNS,
    interpolation: {
      // React escape ให้อยู่แล้ว
      escapeValue: false,
    },
    react: {
      // resource ถูก bundle มาในแอป โหลดเสร็จทันที ไม่ต้องใช้ Suspense
      useSuspense: false,
    },
  });

  applyLanguage(language);
  i18n.on('languageChanged', applyLanguage);

  return i18n;
}

export { i18n };
export * from './languages';
