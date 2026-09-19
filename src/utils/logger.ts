/**
 * logger กลางของแอป
 * - debug / info แสดงเฉพาะตอน __DEV__
 * - warn / error แสดงเสมอ (และเป็นจุดเดียวที่ต้องแก้ถ้าจะต่อ crash reporter ภายหลัง)
 * - production build ลบ console.* ออกด้วย babel-plugin-transform-remove-console
 *   ยกเว้น error / warn
 */
type LogArgs = unknown[];

export const logger = {
  debug: (...args: LogArgs) => {
    if (__DEV__) {
      console.log('[debug]', ...args);
    }
  },
  info: (...args: LogArgs) => {
    if (__DEV__) {
      console.info('[info]', ...args);
    }
  },
  warn: (...args: LogArgs) => {
    console.warn('[warn]', ...args);
  },
  error: (...args: LogArgs) => {
    console.error('[error]', ...args);
  },
};
