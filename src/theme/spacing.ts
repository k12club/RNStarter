/**
 * Spacing / radius / size tokens (หน่วย dp)
 * ใช้ scale 4 เป็นฐาน ห้ามใส่ตัวเลขลอย ๆ ในหน้าจอ ให้ดึงจากที่นี่
 */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export type SpacingToken = keyof typeof spacing;

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;

/** ขนาดมาตรฐานของ control */
export const sizes = {
  /** พื้นที่แตะขั้นต่ำ (Apple HIG 44pt, Material 48dp) */
  touchTarget: 44,
  buttonSm: 36,
  buttonMd: 48,
  buttonLg: 56,
  input: 52,
  icon: { xs: 14, sm: 18, md: 22, lg: 26, xl: 32 },
  avatar: { xs: 24, sm: 32, md: 44, lg: 64, xl: 96 },
  /** ความกว้างสูงสุดของเนื้อหาบนแท็บเล็ต */
  contentMaxWidth: 640,
  /** ระยะขอบซ้ายขวาของหน้าจอ */
  screenGutter: 16,
} as const;

export const durations = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
