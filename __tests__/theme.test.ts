import { darkColors, lightColors, type ColorTokens } from '@/theme/colors';
import { MIN_THAI_FONT_SIZE, typeScale } from '@/theme/typography';

function luminance(hex: string) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4]
    .map(i => parseInt(c.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const themes: Array<[string, ColorTokens]> = [
  ['light', lightColors],
  ['dark', darkColors],
];

const backgrounds = ['background', 'surface', 'surfaceAlt'] as const;

describe.each(themes)('%s colors (palm-ui-rubric)', (_name, colors) => {
  const readableText = [
    'text',
    'textSecondary',
    'textTertiary',
    'primary',
    'success',
    'warning',
    'danger',
    'info',
  ] as const;

  it.each(readableText)('%s อ่านได้ (>= 4.5:1) บนพื้นทุกแบบ', token => {
    for (const bg of backgrounds) {
      expect(contrast(colors[token], colors[bg])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each([
    ['onPrimary', 'primary'],
    ['onSuccess', 'success'],
    ['onWarning', 'warning'],
    ['onDanger', 'danger'],
    ['onInfo', 'info'],
    ['onPrimarySoft', 'primarySoft'],
    ['onSuccessSoft', 'successSoft'],
    ['onWarningSoft', 'warningSoft'],
    ['onDangerSoft', 'dangerSoft'],
    ['onInfoSoft', 'infoSoft'],
  ] as const)('%s บน %s >= 4.5:1', (fg, bg) => {
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('textDisabled / borderStrong >= 3:1 (UI component)', () => {
    for (const bg of backgrounds) {
      expect(contrast(colors.textDisabled, colors[bg])).toBeGreaterThanOrEqual(
        3,
      );
    }
    expect(
      contrast(colors.borderStrong, colors.surface),
    ).toBeGreaterThanOrEqual(3);
  });
});

describe('typography', () => {
  it.each(Object.entries(typeScale))(
    '%s ใหญ่พอสำหรับภาษาไทย และ lineHeight ไม่ตัดสระ',
    (_variant, spec) => {
      expect(spec.fontSize).toBeGreaterThanOrEqual(MIN_THAI_FONT_SIZE);
      expect(spec.lineHeight / spec.fontSize).toBeGreaterThanOrEqual(1.35);
    },
  );
});
