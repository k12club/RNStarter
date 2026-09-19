import type { TextStyle } from 'react-native';

/**
 * Font families
 *
 * - Sarabun ใช้กับเนื้อหา (body) อ่านง่าย ดูเป็นทางการ
 * - Kanit ใช้กับหัวข้อ (heading)
 *
 * ชื่อ fontFamily = ชื่อไฟล์ = PostScript name เพื่อให้ใช้ชื่อเดียวกันได้ทั้ง iOS และ Android
 * ไฟล์ฟอนต์อยู่ที่ src/assets/fonts เพิ่ม/ลบไฟล์แล้วรัน `npm run link-assets` และ build native ใหม่
 *
 * ห้ามตั้ง fontWeight / fontStyle ร่วมกับ custom font: Android จะหาไฟล์ "<family>_bold.ttf"
 * ไม่เจอแล้วกลับไปใช้ฟอนต์ระบบแบบเงียบ ๆ (iOS ดูปกติ จึงเป็นบั๊กที่เห็นแค่บน Android)
 * ให้เลือกน้ำหนักผ่าน family แทน เช่น fonts.body.bold หรือ <Text weight="bold">
 * (ESLint บังคับกฎนี้ใน src/: no-restricted-syntax ใน .eslintrc.js)
 */
export const fonts = {
  body: {
    light: 'Sarabun-Light',
    regular: 'Sarabun-Regular',
    medium: 'Sarabun-Medium',
    semibold: 'Sarabun-SemiBold',
    bold: 'Sarabun-Bold',
  },
  heading: {
    light: 'Kanit-Light',
    regular: 'Kanit-Regular',
    medium: 'Kanit-Medium',
    semibold: 'Kanit-SemiBold',
    bold: 'Kanit-Bold',
  },
} as const;

export type FontWeightName = keyof typeof fonts.body;

/**
 * Type scale
 *
 * - ข้อความไทยทุกระดับต้อง >= 14 (palm-ui-rubric) รวม label, caption, badge
 *   ถ้าต้องการลดลำดับความสำคัญ ให้ลดด้วยสี (textSecondary / textTertiary) หรือน้ำหนัก ไม่ใช่ลดขนาด
 * - lineHeight ของภาษาไทยต้องสูงกว่าละติน (สระบน/ล่าง + วรรณยุกต์) ใช้ ~1.5x สำหรับเนื้อหา
 *   ถ้าต่ำกว่านี้สระบนจะถูกตัดบน Android
 */
export const typeScale = {
  display: {
    fontSize: 34,
    lineHeight: 48,
    family: 'heading',
    weight: 'semibold',
  },
  h1: { fontSize: 28, lineHeight: 40, family: 'heading', weight: 'semibold' },
  h2: { fontSize: 24, lineHeight: 34, family: 'heading', weight: 'semibold' },
  h3: { fontSize: 20, lineHeight: 30, family: 'heading', weight: 'medium' },
  title: { fontSize: 18, lineHeight: 28, family: 'body', weight: 'semibold' },
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    family: 'body',
    weight: 'regular',
  },
  body: { fontSize: 16, lineHeight: 24, family: 'body', weight: 'regular' },
  bodySmall: {
    fontSize: 14,
    lineHeight: 22,
    family: 'body',
    weight: 'regular',
  },
  label: { fontSize: 14, lineHeight: 22, family: 'body', weight: 'medium' },
  button: { fontSize: 16, lineHeight: 24, family: 'body', weight: 'semibold' },
  caption: { fontSize: 14, lineHeight: 20, family: 'body', weight: 'regular' },
} as const satisfies Record<
  string,
  {
    fontSize: number;
    lineHeight: number;
    family: keyof typeof fonts;
    weight: FontWeightName;
  }
>;

export type TextVariant = keyof typeof typeScale;

/** ขนาดตัวอักษรต่ำสุดที่อนุญาตสำหรับข้อความไทย */
export const MIN_THAI_FONT_SIZE = 14;

/** จำกัดการขยายตัวอักษรตามการตั้งค่าของระบบ เพื่อไม่ให้ layout แตก แต่ยังรองรับผู้ใช้สายตาไม่ดี */
export const MAX_FONT_SIZE_MULTIPLIER = 1.4;

export function getTextStyle(
  variant: TextVariant,
  weight?: FontWeightName,
): TextStyle {
  const spec = typeScale[variant];
  return {
    fontFamily: fonts[spec.family][weight ?? spec.weight],
    fontSize: spec.fontSize,
    lineHeight: spec.lineHeight,
  };
}
