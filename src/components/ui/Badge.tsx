import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { type StatusColor, type Theme, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text, type TextColor } from './Text';

export type BadgeStatus = StatusColor | 'neutral';
export type BadgeVariant = 'solid' | 'soft';
export type BadgeSize = 'sm' | 'md';

export type BadgeProps = {
  /** ข้อความใน badge (ถ้าไม่ใส่และเปิด dot จะแสดงเป็นจุดอย่างเดียว) */
  label?: string;
  status?: BadgeStatus;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: IconName;
  /** แสดงจุดสีสถานะ: มี label = จุดนำหน้าข้อความ, ไม่มี label = จุดเดี่ยว */
  dot?: boolean;
  /** ใส่เมื่อ badge ไม่มีข้อความ หรือข้อความสื่อความหมายไม่พอ */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

type BadgeColors = {
  background: string;
  text: TextColor;
  /** สีของจุด / เส้นขอบ */
  accent: string;
};

export function getBadgeColors(
  theme: Theme,
  status: BadgeStatus,
  variant: BadgeVariant,
): BadgeColors {
  const { colors } = theme;
  if (status === 'neutral') {
    return variant === 'solid'
      ? {
          background: colors.surfaceAlt,
          text: 'text',
          accent: colors.textSecondary,
        }
      : {
          background: colors.surfaceAlt,
          text: 'textSecondary',
          accent: colors.textSecondary,
        };
  }

  const map = {
    primary: {
      solid: { background: colors.primary, text: 'onPrimary' },
      soft: { background: colors.primarySoft, text: 'onPrimarySoft' },
    },
    success: {
      solid: { background: colors.success, text: 'onSuccess' },
      soft: { background: colors.successSoft, text: 'onSuccessSoft' },
    },
    warning: {
      solid: { background: colors.warning, text: 'onWarning' },
      soft: { background: colors.warningSoft, text: 'onWarningSoft' },
    },
    danger: {
      solid: { background: colors.danger, text: 'onDanger' },
      soft: { background: colors.dangerSoft, text: 'onDangerSoft' },
    },
    info: {
      solid: { background: colors.info, text: 'onInfo' },
      soft: { background: colors.infoSoft, text: 'onInfoSoft' },
    },
  } as const satisfies Record<
    StatusColor,
    Record<BadgeVariant, { background: string; text: TextColor }>
  >;

  const entry = map[status][variant];
  return {
    background: entry.background,
    text: entry.text,
    accent: variant === 'solid' ? theme.colors[entry.text] : colors[status],
  };
}

/** 5 -> "5", 120 -> "99+" */
export function formatBadgeCount(count: number, max = 99): string {
  if (!Number.isFinite(count) || count <= 0) {
    return '0';
  }
  const n = Math.floor(count);
  return n > max ? `${max}+` : String(n);
}

/**
 * ป้ายสถานะ / ป้ายกำกับสั้น ๆ
 * ข้อความใช้ variant caption / label (14) ไม่เล็กกว่านี้เพราะเป็นข้อความไทย
 */
export function Badge({
  label,
  status = 'neutral',
  variant = 'soft',
  size = 'md',
  icon,
  dot = false,
  accessibilityLabel,
  style,
  testID,
}: BadgeProps) {
  const theme = useTheme();
  const colors = getBadgeColors(theme, status, variant);

  // จุดเดี่ยว (ไม่มีข้อความ) ใช้สีเข้มของสถานะเพื่อให้มองเห็นบนพื้นทุกแบบ
  if (dot && !label) {
    const dotColor =
      status === 'neutral' ? theme.colors.textTertiary : theme.colors[status];
    return (
      <View
        testID={testID}
        accessible={!!accessibilityLabel}
        accessibilityLabel={accessibilityLabel}
        accessibilityElementsHidden={!accessibilityLabel}
        importantForAccessibility={
          accessibilityLabel ? 'yes' : 'no-hide-descendants'
        }
        style={[
          styles.soloDot,
          {
            width: theme.spacing.sm,
            height: theme.spacing.sm,
            borderRadius: theme.radius.full,
            backgroundColor: dotColor,
          },
          style,
        ]}
      />
    );
  }

  const isSmall = size === 'sm';
  // ไม่มีข้อความให้อ่าน (เช่น icon อย่างเดียว) = ซ่อนจาก screen reader ไม่ให้เป็นช่องว่างที่โฟกัสได้
  const a11yLabel = accessibilityLabel ?? label;

  return (
    <View
      testID={testID}
      accessible={!!a11yLabel}
      accessibilityLabel={a11yLabel}
      accessibilityElementsHidden={!a11yLabel}
      importantForAccessibility={a11yLabel ? 'yes' : 'no-hide-descendants'}
      style={[
        styles.base,
        {
          backgroundColor: colors.background,
          borderRadius: theme.radius.full,
          paddingHorizontal: isSmall ? theme.spacing.sm : theme.spacing.md,
          paddingVertical: isSmall ? theme.spacing.none : theme.spacing.xxs,
          gap: theme.spacing.xs,
        },
        style,
      ]}
    >
      {dot ? (
        <View
          style={{
            width: theme.spacing.sm - theme.spacing.xxs,
            height: theme.spacing.sm - theme.spacing.xxs,
            borderRadius: theme.radius.full,
            backgroundColor: colors.accent,
          }}
        />
      ) : null}
      {icon ? (
        <Icon name={icon} size="xs" color={theme.colors[colors.text]} />
      ) : null}
      {label ? (
        <Text
          variant={isSmall ? 'caption' : 'label'}
          color={colors.text}
          numberOfLines={1}
          style={styles.text}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export type CountBadgeProps = {
  count: number;
  /** เกินค่านี้แสดงเป็น "99+" */
  max?: number;
  status?: BadgeStatus;
  /** แสดงแม้ count = 0 */
  showZero?: boolean;
  /** เช่น "แจ้งเตือน 5 รายการ" (ค่าเริ่มต้นคือตัวเลขที่แสดง) */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** ตัวเลขนับจำนวน เช่น บนไอคอนแจ้งเตือน */
export function CountBadge({
  count,
  max = 99,
  status = 'danger',
  showZero = false,
  accessibilityLabel,
  style,
  testID,
}: CountBadgeProps) {
  const theme = useTheme();
  if (!showZero && !(count > 0)) {
    return null;
  }
  const colors = getBadgeColors(theme, status, 'solid');
  const text = formatBadgeCount(count, max);
  const minSize = theme.spacing.xxl;

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={accessibilityLabel ?? text}
      style={[
        styles.count,
        {
          // minHeight ไม่ใช่ height: ตัวอักษรขยายตามระบบ (x1.4) lineHeight จะสูงกว่า 24
          minWidth: minSize,
          minHeight: minSize,
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.xs,
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      <Text variant="caption" weight="semibold" color={colors.text}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  text: {
    flexShrink: 1,
  },
  soloDot: {
    alignSelf: 'flex-start',
  },
  count: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});
