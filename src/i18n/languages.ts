export const SUPPORTED_LANGUAGES = ['th', 'en'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = 'th';

/**
 * false (ค่าเริ่มต้น) = เปิดแอปครั้งแรกเป็นภาษาไทยเสมอ จนกว่าผู้ใช้จะเลือกภาษาเอง
 * (มือถือคนไทยจำนวนมากตั้งภาษาเครื่องเป็นอังกฤษ แต่ยังต้องการแอปภาษาไทย)
 * true = ใช้ภาษาของเครื่องถ้ารองรับ
 */
export const FOLLOW_DEVICE_LANGUAGE = false;

/** ชื่อภาษาแสดงด้วยภาษาของตัวเอง (ไม่แปล) */
export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  th: 'ไทย',
  en: 'English',
};

export function isAppLanguage(value: unknown): value is AppLanguage {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  );
}
