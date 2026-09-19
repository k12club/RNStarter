import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { type Theme, useTheme } from '@/theme';

import { Icon, type IconName, type IconSize } from './Icon';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export type IconButtonProps = Omit<
  PressableProps,
  'children' | 'style' | 'accessibilityLabel'
> & {
  icon: IconName;
  /** จำเป็น: ปุ่มไม่มีข้อความ screen reader ต้องรู้ว่าปุ่มทำอะไร */
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: 'circle' | 'rounded';
  /** แสดง spinner แทน icon และกดไม่ได้ (เหมือน Button) */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SIZE_MAP: Record<
  IconButtonSize,
  { box: (theme: Theme) => number; icon: IconSize }
> = {
  sm: { box: theme => theme.sizes.buttonSm, icon: 'sm' },
  md: { box: theme => theme.sizes.touchTarget, icon: 'md' },
  lg: { box: theme => theme.sizes.buttonMd, icon: 'lg' },
};

function getColors(theme: Theme, variant: IconButtonVariant) {
  const { colors } = theme;
  switch (variant) {
    case 'primary':
      return {
        background: colors.primary,
        pressedBackground: colors.primary,
        icon: colors.onPrimary,
      };
    case 'secondary':
      return {
        background: colors.primarySoft,
        pressedBackground: colors.surfaceAlt,
        icon: colors.onPrimarySoft,
      };
    case 'ghost':
    default:
      return {
        background: colors.transparent,
        pressedBackground: colors.surfaceAlt,
        icon: colors.text,
      };
  }
}

/**
 * ปุ่มไอคอนอย่างเดียว
 * พื้นที่แตะ >= 44 เสมอ (sm = 36 ขยายด้วย hitSlop)
 */
export function IconButton({
  icon,
  accessibilityLabel,
  variant = 'ghost',
  size = 'md',
  shape = 'circle',
  loading = false,
  disabled = false,
  accessibilityState,
  style,
  hitSlop,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();
  const colors = getColors(theme, variant);
  const box = SIZE_MAP[size].box(theme);
  const isDisabled = !!disabled || loading;
  const slop =
    hitSlop ??
    (box < theme.sizes.touchTarget
      ? (theme.sizes.touchTarget - box) / 2
      : undefined);

  return (
    <Pressable
      cssInterop={false}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      // รวมกับ state ที่ส่งมา (เช่น selected ของปุ่ม toggle) โดย disabled / busy มาจาก prop เสมอ
      accessibilityState={{
        ...accessibilityState,
        disabled: isDisabled,
        busy: loading,
      }}
      disabled={isDisabled}
      hitSlop={slop}
      style={({ pressed }) => [
        styles.base,
        {
          width: box,
          height: box,
          borderRadius:
            shape === 'circle' ? theme.radius.full : theme.radius.md,
          backgroundColor:
            pressed && !isDisabled
              ? colors.pressedBackground
              : colors.background,
        },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.icon} />
      ) : (
        <Icon name={icon} size={SIZE_MAP[size].icon} color={colors.icon} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
