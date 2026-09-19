import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';

import type { Theme } from '@/theme';

/**
 * แปลง theme ของแอปเป็น theme ของ React Navigation (header / tab bar / พื้นหลังระหว่างเปลี่ยนหน้า)
 *
 * fontWeight ต้องต่ำกว่า 700 เสมอ: Android จะหาไฟล์ "<family>_bold.ttf" เมื่อ weight >= 700
 * แล้วใช้ฟอนต์ระบบแทนเมื่อหาไม่เจอ น้ำหนักจริงมาจาก fontFamily (เช่น Kanit-SemiBold)
 */
export function toNavigationTheme(theme: Theme): NavigationTheme {
  const base = theme.isDark ? DarkTheme : DefaultTheme;
  const { colors, fonts } = theme;

  return {
    ...base,
    dark: theme.isDark,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
    /* eslint-disable no-restricted-syntax -- type ของ React Navigation บังคับ fontWeight (ใช้ 400 ปลอดภัย) */
    fonts: {
      regular: { fontFamily: fonts.body.regular, fontWeight: '400' },
      medium: { fontFamily: fonts.body.medium, fontWeight: '400' },
      bold: { fontFamily: fonts.heading.medium, fontWeight: '400' },
      heavy: { fontFamily: fonts.heading.semibold, fontWeight: '400' },
    },
    /* eslint-enable no-restricted-syntax */
  };
}
