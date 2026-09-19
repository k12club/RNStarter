import React from 'react';
import {
  Platform,
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import {
  type ColorTokens,
  type FontWeightName,
  getTextStyle,
  MAX_FONT_SIZE_MULTIPLIER,
  type TextVariant,
  useTheme,
} from '@/theme';

export type TextColor = Extract<
  keyof ColorTokens,
  | 'text'
  | 'textSecondary'
  | 'textTertiary'
  | 'textDisabled'
  | 'primary'
  | 'onPrimary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'onPrimarySoft'
  | 'onSuccessSoft'
  | 'onWarningSoft'
  | 'onDangerSoft'
  | 'onInfoSoft'
  | 'onSuccess'
  | 'onWarning'
  | 'onDanger'
  | 'onInfo'
>;

export type TextProps = RNTextProps & {
  /** ระดับตัวอักษรจาก typeScale (ค่าเริ่มต้น body) */
  variant?: TextVariant;
  /** สีจาก theme (ค่าเริ่มต้น text) */
  color?: TextColor;
  /** เปลี่ยนน้ำหนักโดยยังใช้ font family ของ variant */
  weight?: FontWeightName;
  align?: TextStyle['textAlign'];
};

/**
 * ตัวอักษรของแอป ใช้ตัวนี้แทน Text ของ react-native เสมอ
 * - ใช้ฟอนต์ Sarabun / Kanit ตาม variant
 * - lineHeight รองรับสระบน-ล่างของภาษาไทย
 * - จำกัดการขยายตาม Dynamic Type ที่ MAX_FONT_SIZE_MULTIPLIER
 */
export function Text({
  variant = 'body',
  color = 'text',
  weight,
  align,
  style,
  maxFontSizeMultiplier = MAX_FONT_SIZE_MULTIPLIER,
  ...rest
}: TextProps) {
  const theme = useTheme();

  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        getTextStyle(variant, weight),
        { color: theme.colors[color] },
        align ? { textAlign: align } : null,
        // Android เพิ่ม padding บน-ล่างของฟอนต์เอง ทำให้ข้อความไทยดูไม่อยู่กึ่งกลาง
        Platform.OS === 'android' ? androidTextFix : null,
        style,
      ]}
      {...rest}
    />
  );
}

const androidTextFix: TextStyle = {
  includeFontPadding: false,
  textAlignVertical: 'center',
};
