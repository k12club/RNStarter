import type { ViewStyle } from 'react-native';

import type { ColorScheme } from './types';

/**
 * Elevation tokens
 *
 * ใช้ `boxShadow` (รองรับทั้ง iOS และ Android บน New Architecture ตั้งแต่ RN 0.76)
 * ได้เงาหน้าตาเหมือนกันสองแพลตฟอร์ม ไม่ต้องแยก shadowOffset / elevation
 * dark mode ใช้เงาเข้มขึ้นเพราะพื้นหลังมืด เงาอ่อนจะมองไม่เห็น
 */
export type ElevationToken = 'none' | 'sm' | 'md' | 'lg';

const light: Record<ElevationToken, ViewStyle> = {
  none: {},
  sm: { boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.08)' },
  md: { boxShadow: '0px 4px 12px rgba(15, 23, 42, 0.10)' },
  lg: { boxShadow: '0px 12px 32px rgba(15, 23, 42, 0.16)' },
};

const dark: Record<ElevationToken, ViewStyle> = {
  none: {},
  sm: { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.40)' },
  md: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.45)' },
  lg: { boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.55)' },
};

export function getShadows(scheme: ColorScheme) {
  return scheme === 'dark' ? dark : light;
}
