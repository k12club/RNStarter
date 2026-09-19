import { vars } from 'nativewind';

import type { ColorTokens } from './colors';
import { TAILWIND_COLOR_TOKENS } from './tailwindColors';

/** '#2456E0' -> '36 86 224' (รูปแบบที่ rgb(var(--x) / <alpha-value>) ต้องการ) */
function hexToChannels(hex: string): string {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map(char => char + char)
          .join('')
      : value;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * CSS variables ของ NativeWind จาก color tokens ของ theme ปัจจุบัน
 * ใส่ไว้ที่ View ราก (AppProviders) แล้ว className อย่าง bg-surface / text-fg ใช้ค่านี้
 */
export function buildCssVars(colors: ColorTokens) {
  const entries = Object.entries(TAILWIND_COLOR_TOKENS).map(([name, token]) => [
    `--color-${name}`,
    hexToChannels(colors[token as keyof ColorTokens]),
  ]);
  return vars(Object.fromEntries(entries));
}
