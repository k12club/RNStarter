import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';

import { Button, type ButtonVariant } from './Button';
import { Icon, type IconName } from './Icon';
import { Text, type TextColor } from './Text';

export type EmptyStateProps = {
  /** ค่าเริ่มต้น inbox */
  icon?: IconName;
  /** ค่าเริ่มต้น t('common:noData') */
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: IconName;
  actionVariant?: ButtonVariant;
  actionLoading?: boolean;
  /** danger = ใช้สีของ error (ใช้โดย ErrorState) */
  tone?: 'neutral' | 'danger';
  /** ประกาศหัวข้อ + คำอธิบายให้ screen reader ทันทีที่แสดง / เมื่อข้อความเปลี่ยน (ใช้กับ error) */
  announce?: boolean;
  /** ขยายเต็มพื้นที่และจัดกึ่งกลางแนวตั้ง */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

// สีของข้อความ / icon บนปุ่มแต่ละแบบ (ตรงกับ Button)
const BUTTON_CONTENT_COLOR: Record<ButtonVariant, TextColor> = {
  primary: 'onPrimary',
  secondary: 'onPrimarySoft',
  outline: 'text',
  ghost: 'primary',
  danger: 'onDanger',
};

/** หน้าว่าง (ไม่มีข้อมูล / ไม่พบผลค้นหา) จัดกึ่งกลาง กว้างไม่เกิน contentMaxWidth */
export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  actionVariant = 'primary',
  actionLoading = false,
  tone = 'neutral',
  announce = false,
  fill = false,
  style,
  testID,
}: EmptyStateProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const isDanger = tone === 'danger';
  const circle = theme.sizes.avatar.lg;
  const resolvedTitle = title ?? t('noData');

  // role alert / liveRegion ไม่ประกาศตอนแสดงครั้งแรกบน iOS จึงสั่งประกาศเอง
  // queue: true = ไม่ตัดเสียงอ่านที่กำลังพูด (เช่น ชื่อหน้าจอใหม่)
  useEffect(() => {
    if (!announce) {
      return;
    }
    AccessibilityInfo.announceForAccessibilityWithOptions(
      description ? `${resolvedTitle}, ${description}` : resolvedTitle,
      { queue: true },
    );
  }, [announce, resolvedTitle, description]);

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          maxWidth: theme.sizes.contentMaxWidth,
          paddingHorizontal: theme.spacing.xxl,
          paddingVertical: theme.spacing.xxxl,
        },
        fill && styles.fill,
        style,
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            width: circle,
            height: circle,
            borderRadius: theme.radius.full,
            backgroundColor: isDanger
              ? theme.colors.dangerSoft
              : theme.colors.surfaceAlt,
            marginBottom: theme.spacing.lg,
          },
        ]}
      >
        <Icon
          name={icon}
          size="xl"
          color={isDanger ? 'onDangerSoft' : 'textSecondary'}
        />
      </View>
      <View
        accessible={announce}
        accessibilityRole={announce ? 'alert' : undefined}
        style={[styles.textBlock, { gap: theme.spacing.xs }]}
      >
        <Text variant="h3" align="center" accessibilityRole="header">
          {resolvedTitle}
        </Text>
        {description ? (
          <Text variant="body" color="textSecondary" align="center">
            {description}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          variant={actionVariant}
          loading={actionLoading}
          onPress={onAction}
          left={
            actionIcon ? (
              <Icon
                name={actionIcon}
                size="sm"
                color={BUTTON_CONTENT_COLOR[actionVariant]}
              />
            ) : undefined
          }
          style={[styles.action, { marginTop: theme.spacing.xl }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  fill: {
    flex: 1,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  action: {
    alignSelf: 'center',
    maxWidth: '100%',
  },
});
