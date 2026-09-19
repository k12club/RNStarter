import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text, type TextColor } from './Text';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** icon ด้านซ้าย (ถ้าเลือกอยู่และไม่ใส่ icon จะแสดงเครื่องหมายถูก) */
  icon?: IconName;
  /** ใส่เมื่อให้ลบ chip ได้ จะแสดงปุ่ม x ด้านขวา */
  onRemove?: () => void;
  /** label ของปุ่ม x สำหรับ screen reader (ค่าเริ่มต้น "ลบ <label>") */
  removeAccessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** อยู่ที่ส่วนที่กดได้ของ chip (ปุ่ม x ได้ `${testID}-remove`) */
  testID?: string;
};

/**
 * chip สำหรับกรอง / เลือก
 * ตัว chip สูง 36 (buttonSm) ขยายพื้นที่แตะเป็น 44 ด้วย hitSlop
 * ปุ่ม x เป็นพี่น้องกับส่วนที่กดได้ ไม่ซ้อนข้างใน: Pressable ที่ accessible
 * จะรวมลูกเป็น element เดียว ทำให้ VoiceOver เข้าถึงปุ่มที่ซ้อนอยู่ไม่ได้
 */
export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  onRemove,
  removeAccessibilityLabel,
  disabled = false,
  style,
  testID,
}: ChipProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  // สถานะกดของส่วนหลัก ใช้ย้อมทั้งเม็ด chip
  const [pressed, setPressed] = useState(false);
  const height = theme.sizes.buttonSm;
  // ส่วนที่กดได้อยู่ในกรอบ (หักเส้นขอบ) จึงคิด hitSlop จากความสูงด้านใน ให้รวมได้ >= 44
  const inner = height - BORDER_WIDTH * 2;
  const slop = Math.max(0, (theme.sizes.touchTarget - inner) / 2);
  // native hit-test ตัดพื้นที่แตะของลูกที่ขอบของ parent (iOS / Android)
  // กรอบนอกจึงต้องมี hitSlop ของตัวเองด้วย: 36 + 4 * 2 = 34 + 5 * 2 = 44
  const outerSlop = Math.max(0, (theme.sizes.touchTarget - height) / 2);

  // disabled ใช้ textDisabled อย่างเดียว ไม่ลด opacity ซ้ำ (textDisabled ต้อง >= 3:1)
  const contentColor: TextColor = disabled
    ? 'textDisabled'
    : selected
    ? 'onPrimarySoft'
    : 'text';
  const leftIcon: IconName | undefined =
    icon ?? (selected ? 'check' : undefined);

  const bodyStyle: StyleProp<ViewStyle> = [
    styles.body,
    {
      paddingStart: leftIcon ? theme.spacing.sm : theme.spacing.md,
      paddingEnd: onRemove ? theme.spacing.none : theme.spacing.md,
    },
  ];

  const body = (
    <>
      {leftIcon ? (
        <View style={{ marginEnd: theme.spacing.xs }}>
          <Icon name={leftIcon} size="sm" color={contentColor} />
        </View>
      ) : null}
      <Text
        variant="label"
        color={contentColor}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Text>
    </>
  );

  return (
    <View
      testID={onPress ? undefined : testID}
      hitSlop={outerSlop}
      style={[
        styles.base,
        {
          height,
          borderRadius: theme.radius.full,
          backgroundColor: selected
            ? theme.colors.primarySoft
            : theme.colors.surface,
          borderColor: selected
            ? theme.colors.primary
            : theme.colors.borderStrong,
        },
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {onPress ? (
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ selected, disabled }}
          disabled={disabled}
          hitSlop={slop}
          onPress={onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={bodyStyle}
        >
          {body}
        </Pressable>
      ) : (
        <View style={bodyStyle}>{body}</View>
      )}
      {onRemove ? (
        <Pressable
          cssInterop={false}
          testID={testID ? `${testID}-remove` : undefined}
          accessibilityRole="button"
          accessibilityLabel={
            removeAccessibilityLabel ?? `${t('delete')} ${label}`
          }
          accessibilityState={{ disabled }}
          disabled={disabled}
          hitSlop={slop}
          onPress={onRemove}
          style={({ pressed: removePressed }) => [
            styles.remove,
            {
              width: inner,
              height: inner,
              borderRadius: theme.radius.full,
            },
            removePressed &&
              !disabled && { backgroundColor: theme.colors.surfaceAlt },
          ]}
        >
          <Icon name="x" size="sm" color={contentColor} />
        </Pressable>
      ) : null}
    </View>
  );
}

const BORDER_WIDTH = 1;

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: BORDER_WIDTH,
    maxWidth: '100%',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    flexShrink: 1,
  },
  label: {
    flexShrink: 1,
  },
  remove: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
