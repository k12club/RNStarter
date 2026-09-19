/**
 * ชื่อสีของ NativeWind (className) -> ชื่อ token ใน src/theme/colors.ts
 *
 * ไฟล์นี้เป็น CommonJS เพราะ tailwind.config.js (Node) ต้อง require ได้
 * ใช้สองที่: tailwind.config.js สร้าง class และ cssVars.ts ส่งค่าสีจริงตาม theme ปัจจุบัน
 * สีจึงมีแหล่งเดียวคือ colors.ts (สลับ light / dark ตาม Settings ของแอปอัตโนมัติ)
 *
 * ตัวอย่าง: bg-surface, text-fg, text-fg-secondary, border-border-strong, bg-primary-soft
 */
const TAILWIND_COLOR_TOKENS = {
  background: 'background',
  surface: 'surface',
  'surface-alt': 'surfaceAlt',
  fg: 'text',
  'fg-secondary': 'textSecondary',
  'fg-tertiary': 'textTertiary',
  'fg-disabled': 'textDisabled',
  border: 'border',
  'border-strong': 'borderStrong',

  primary: 'primary',
  'on-primary': 'onPrimary',
  'primary-soft': 'primarySoft',
  'on-primary-soft': 'onPrimarySoft',

  success: 'success',
  'on-success': 'onSuccess',
  'success-soft': 'successSoft',
  'on-success-soft': 'onSuccessSoft',

  warning: 'warning',
  'on-warning': 'onWarning',
  'warning-soft': 'warningSoft',
  'on-warning-soft': 'onWarningSoft',

  danger: 'danger',
  'on-danger': 'onDanger',
  'danger-soft': 'dangerSoft',
  'on-danger-soft': 'onDangerSoft',

  info: 'info',
  'on-info': 'onInfo',
  'info-soft': 'infoSoft',
  'on-info-soft': 'onInfoSoft',

  skeleton: 'skeleton',
};

module.exports = { TAILWIND_COLOR_TOKENS };
