import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { type ColorTokens, makeStyles, type Theme, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text, type TextColor } from './Text';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ToastOptions = {
  /** ค่าเริ่มต้น info */
  type?: ToastType;
  title?: string;
  message: string;
  /** ms ก่อนปิดเอง (ค่าเริ่มต้น 4000) ใส่ 0 = ไม่ปิดเอง ต้องกดปิด */
  duration?: number;
};

type ToastTone = {
  background: keyof ColorTokens;
  text: TextColor;
  icon: IconName;
};

const TONES: Record<ToastType, ToastTone> = {
  success: {
    background: 'successSoft',
    text: 'onSuccessSoft',
    icon: 'circle-check',
  },
  error: { background: 'dangerSoft', text: 'onDangerSoft', icon: 'circle-x' },
  warning: {
    background: 'warningSoft',
    text: 'onWarningSoft',
    icon: 'circle-alert',
  },
  info: { background: 'infoSoft', text: 'onInfoSoft', icon: 'info' },
};

export type ToastProps = {
  type?: ToastType;
  title?: string;
  message: string;
  /** กดปุ่ม X (ไม่ใส่ = ไม่มีปุ่มปิด) */
  onDismiss?: () => void;
  testID?: string;
};

/**
 * หน้าตาของ toast หนึ่งอัน (ใช้ผ่าน ToastProvider / toast.show เป็นหลัก)
 * พื้นใช้สี *Soft ตัวอักษรใช้ on*Soft ของประเภทเดียวกัน จึงผ่าน contrast ทั้ง light / dark
 */
export function Toast({
  type = 'info',
  title,
  message,
  onDismiss,
  testID,
}: ToastProps) {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const styles = useStyles();
  const tone = TONES[type];
  const closeHitSlop = getCloseHitSlop(theme);

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        { backgroundColor: theme.colors[tone.background] },
      ]}
    >
      <View style={styles.icon}>
        <Icon name={tone.icon} size="md" color={tone.text} />
      </View>
      {/* รวมเฉพาะข้อความเป็นก้อนเดียว ถ้ารวมทั้งแถว screen reader จะเข้าถึงปุ่มปิดไม่ได้ */}
      <View accessible accessibilityRole="alert" style={styles.body}>
        {title ? (
          <Text variant="body" weight="semibold" color={tone.text}>
            {title}
          </Text>
        ) : null}
        <Text variant="bodySmall" color={tone.text}>
          {message}
        </Text>
      </View>
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('close')}
          hitSlop={closeHitSlop}
          onPress={onDismiss}
          style={styles.close}
        >
          <Icon name="x" size="sm" color={tone.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ปุ่ม X มองเห็นเล็ก แต่พื้นที่แตะต้องได้ >= touchTarget
function getCloseHitSlop(theme: Theme) {
  return (theme.sizes.touchTarget - theme.sizes.icon.sm) / 2;
}

const useStyles = makeStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
  },
  icon: {
    // จัด icon ให้ตรงบรรทัดแรกของข้อความ (lineHeight 24 - icon 22)
    paddingTop: theme.spacing.xxs / 2,
    marginRight: theme.spacing.sm,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  close: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xxs,
  },
}));
