/**
 * NativeWind (Tailwind v3) config
 *
 * ใช้ className ร่วมกับ StyleSheet ได้ใน component เดียวกัน (style ที่ส่งตรงชนะ className)
 * ค่าทั้งหมดผูกกับ theme ของแอป เพื่อให้ได้หน้าตาเดียวกันไม่ว่าจะเขียนแบบไหน:
 * - colors: อ่านจาก CSS variables ที่ AppProviders ใส่ตาม theme ปัจจุบัน (light / dark สลับเอง)
 *   ไม่มี palette ของ Tailwind (bg-blue-500 ใช้ไม่ได้) ให้ใช้ชื่อ token เช่น bg-primary, text-fg-secondary
 * - fontSize: ตรงกับ typeScale ใน src/theme/typography.ts (ไม่มี text-xs / text-sm ที่เล็กกว่า 14)
 * - fontFamily: เลือกน้ำหนักผ่านชื่อฟอนต์ เช่น font-body-bold, font-heading-semibold
 * - fontWeight: ปิดทั้งหมด (font-bold บน Android จะกลายเป็นฟอนต์ระบบ)
 * - spacing: ใช้ scale ปกติของ Tailwind (p-1 = 4, p-2 = 8, p-3 = 12, p-4 = 16, p-6 = 24 ...)
 *   ตรงกับ spacing token ที่เป็นฐาน 4
 *
 * ค่าที่ซ้ำกับ src/theme มี test ตรวจว่าตรงกัน: __tests__/tailwindConfig.test.ts
 *
 * @type {import('tailwindcss').Config}
 */
const { TAILWIND_COLOR_TOKENS } = require('./src/theme/tailwindColors');

const tokenColors = Object.fromEntries(
  Object.keys(TAILWIND_COLOR_TOKENS).map(name => [
    name,
    `rgb(var(--color-${name}) / <alpha-value>)`,
  ]),
);

module.exports = {
  content: ['./index.js', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      ...tokenColors,
    },
    fontFamily: {
      'body-light': ['Sarabun-Light'],
      body: ['Sarabun-Regular'],
      'body-medium': ['Sarabun-Medium'],
      'body-semibold': ['Sarabun-SemiBold'],
      'body-bold': ['Sarabun-Bold'],
      'heading-light': ['Kanit-Light'],
      heading: ['Kanit-Regular'],
      'heading-medium': ['Kanit-Medium'],
      'heading-semibold': ['Kanit-SemiBold'],
      'heading-bold': ['Kanit-Bold'],
    },
    fontSize: {
      display: ['34px', { lineHeight: '48px' }],
      h1: ['28px', { lineHeight: '40px' }],
      h2: ['24px', { lineHeight: '34px' }],
      h3: ['20px', { lineHeight: '30px' }],
      title: ['18px', { lineHeight: '28px' }],
      'body-lg': ['18px', { lineHeight: '28px' }],
      body: ['16px', { lineHeight: '24px' }],
      'body-sm': ['14px', { lineHeight: '22px' }],
      label: ['14px', { lineHeight: '22px' }],
      button: ['16px', { lineHeight: '24px' }],
      caption: ['14px', { lineHeight: '20px' }],
    },
    fontWeight: {},
    borderRadius: {
      none: '0px',
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      full: '9999px',
    },
    extend: {},
  },
  plugins: [],
};
