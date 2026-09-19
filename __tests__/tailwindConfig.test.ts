import { lightColors } from '@/theme/colors';
import { radius } from '@/theme/spacing';
import { TAILWIND_COLOR_TOKENS } from '@/theme/tailwindColors';
import { fonts, MIN_THAI_FONT_SIZE, typeScale } from '@/theme/typography';

/**
 * tailwind.config.js เป็น CommonJS จึง import ค่าจาก src/theme (TypeScript) ตรง ๆ ไม่ได้
 * test นี้กันไม่ให้ค่าที่ซ้ำกันสองที่ (ขนาดตัวอักษร / ฟอนต์ / radius / ชื่อสี) คลาดกัน
 */
const tailwindConfig = require('../tailwind.config.js');

const theme = tailwindConfig.theme;

const FONT_SIZE_KEYS: Record<string, keyof typeof typeScale> = {
  display: 'display',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  title: 'title',
  'body-lg': 'bodyLarge',
  body: 'body',
  'body-sm': 'bodySmall',
  label: 'label',
  button: 'button',
  caption: 'caption',
};

describe('tailwind.config.js ตรงกับ theme tokens', () => {
  it('fontSize ทุกตัวตรงกับ typeScale และไม่ต่ำกว่า 14', () => {
    expect(Object.keys(theme.fontSize).sort()).toEqual(
      Object.keys(FONT_SIZE_KEYS).sort(),
    );
    for (const [twKey, variant] of Object.entries(FONT_SIZE_KEYS)) {
      const [size, { lineHeight }] = theme.fontSize[twKey];
      expect(size).toBe(`${typeScale[variant].fontSize}px`);
      expect(lineHeight).toBe(`${typeScale[variant].lineHeight}px`);
      expect(parseFloat(size)).toBeGreaterThanOrEqual(MIN_THAI_FONT_SIZE);
    }
  });

  it('fontFamily ใช้ชื่อฟอนต์เดียวกับ fonts', () => {
    for (const [weight, family] of Object.entries(fonts.body)) {
      const key = weight === 'regular' ? 'body' : `body-${weight}`;
      expect(theme.fontFamily[key]).toEqual([family]);
    }
    for (const [weight, family] of Object.entries(fonts.heading)) {
      const key = weight === 'regular' ? 'heading' : `heading-${weight}`;
      expect(theme.fontFamily[key]).toEqual([family]);
    }
  });

  it('ปิด fontWeight (font-bold) ทั้งหมด', () => {
    expect(theme.fontWeight).toEqual({});
  });

  it('borderRadius ตรงกับ radius tokens', () => {
    for (const [key, value] of Object.entries(radius)) {
      expect(theme.borderRadius[key]).toBe(`${value}px`);
    }
  });

  it('ทุกสีใน tailwind ชี้ไปที่ token ที่มีอยู่จริงและเป็น hex', () => {
    for (const [name, token] of Object.entries(TAILWIND_COLOR_TOKENS)) {
      expect(theme.colors[name]).toBe(
        `rgb(var(--color-${name}) / <alpha-value>)`,
      );
      expect(lightColors[token as keyof typeof lightColors]).toMatch(
        /^#[0-9A-F]{6}$/i,
      );
    }
  });
});
