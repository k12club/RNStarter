import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { type Theme, useTheme } from '@/theme';

import { Text, type TextColor } from './Text';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** ยืดเต็มความกว้างของ parent */
  fullWidth?: boolean;
  /** element ด้านซ้าย / ขวาของข้อความ เช่น <Icon name="plus" /> */
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

type VariantColors = {
  background: string;
  pressedBackground: string;
  border: string;
  text: TextColor;
};

function getVariantColors(theme: Theme, variant: ButtonVariant): VariantColors {
  const { colors } = theme;
  switch (variant) {
    case 'secondary':
      return {
        background: colors.primarySoft,
        pressedBackground: colors.surfaceAlt,
        border: colors.primarySoft,
        text: 'onPrimarySoft',
      };
    case 'outline':
      return {
        background: colors.transparent,
        pressedBackground: colors.surfaceAlt,
        border: colors.borderStrong,
        text: 'text',
      };
    case 'ghost':
      return {
        background: colors.transparent,
        pressedBackground: colors.surfaceAlt,
        border: colors.transparent,
        text: 'primary',
      };
    case 'danger':
      return {
        background: colors.danger,
        pressedBackground: colors.danger,
        border: colors.danger,
        text: 'onDanger',
      };
    case 'primary':
    default:
      return {
        background: colors.primary,
        pressedBackground: colors.primary,
        border: colors.primary,
        text: 'onPrimary',
      };
  }
}

/**
 * ปุ่มหลักของแอป
 * - disabled / loading จะกดไม่ได้ และประกาศสถานะให้ screen reader
 * - ความสูงขั้นต่ำ >= 44 (sm ขยายพื้นที่แตะด้วย hitSlop)
 */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  left,
  right,
  style,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const colors = getVariantColors(theme, variant);
  const isDisabled = disabled || loading;
  const height =
    size === 'sm'
      ? theme.sizes.buttonSm
      : size === 'lg'
      ? theme.sizes.buttonLg
      : theme.sizes.buttonMd;
  const hitSlop =
    height < theme.sizes.touchTarget
      ? (theme.sizes.touchTarget - height) / 2
      : undefined;

  return (
    <Pressable
      cssInterop={false}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          paddingHorizontal:
            size === 'sm' ? theme.spacing.md : theme.spacing.xl,
          borderRadius: theme.radius.md,
          backgroundColor:
            pressed && !isDisabled
              ? colors.pressedBackground
              : colors.background,
          borderColor: colors.border,
        },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors[colors.text]} />
      ) : (
        <View style={styles.content}>
          {left ? <View style={styles.left}>{left}</View> : null}
          <Text
            variant={size === 'sm' ? 'label' : 'button'}
            color={colors.text}
            numberOfLines={1}
          >
            {title}
          </Text>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    marginRight: 8,
  },
  right: {
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
