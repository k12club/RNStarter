import React from 'react';
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

export type ListItemProps = {
  title: string;
  subtitle?: string;
  /** ชื่อ icon หรือ element เช่น <Avatar /> */
  left?: IconName | React.ReactElement;
  /** ข้อความค่าด้านขวา เช่น ภาษาที่เลือก */
  value?: string;
  /**
   * element ด้านขวา เช่น <Badge /> หรือ control อย่าง <Switch />
   * ถ้าเป็น control ที่กดได้ ห้ามใส่ onPress ให้แถวด้วย: แถวที่กดได้รวมลูกเป็น element เดียว
   * VoiceOver จะเข้าถึง control ข้างในไม่ได้ (แถว toggle ทั้งแถวใช้ <Switch label="..." /> แทน)
   */
  right?: React.ReactNode;
  /** ลูกศรขวา (หน้าที่กดแล้วไปต่อ) */
  chevron?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  /** รายการที่ทำลายข้อมูล เช่น ลบบัญชี / ออกจากระบบ */
  destructive?: boolean;
  /** ค่าเริ่มต้นไม่ตัดบรรทัด (ข้อความไทยยาวจะขึ้นบรรทัดใหม่) */
  numberOfLines?: number;
  subtitleNumberOfLines?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * แถวรายการ (settings / เมนู / รายการข้อมูล)
 * สูงอย่างน้อย 56 (buttonLg) ข้อความยาวขึ้นบรรทัดใหม่ ไม่ตัดทิ้ง
 */
export function ListItem({
  title,
  subtitle,
  left,
  value,
  right,
  chevron = false,
  onPress,
  onLongPress,
  disabled = false,
  destructive = false,
  numberOfLines,
  subtitleNumberOfLines,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ListItemProps) {
  const theme = useTheme();
  const isPressable = !!onPress || !!onLongPress;

  const titleColor: TextColor = disabled
    ? 'textDisabled'
    : destructive
    ? 'danger'
    : 'text';
  const iconColor: TextColor = disabled
    ? 'textDisabled'
    : destructive
    ? 'danger'
    : 'textSecondary';
  const secondaryColor: TextColor = disabled ? 'textDisabled' : 'textSecondary';

  const rowStyle: StyleProp<ViewStyle> = [
    styles.row,
    {
      minHeight: theme.sizes.buttonLg,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.md,
    },
  ];

  const content = (
    <>
      {left ? (
        <View style={styles.left}>
          {typeof left === 'string' ? (
            <Icon name={left} size="md" color={iconColor} />
          ) : (
            left
          )}
        </View>
      ) : null}
      <View style={styles.body}>
        <Text variant="body" color={titleColor} numberOfLines={numberOfLines}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant="bodySmall"
            color={secondaryColor}
            numberOfLines={subtitleNumberOfLines}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text
          variant="bodySmall"
          color={secondaryColor}
          align="right"
          style={styles.value}
        >
          {value}
        </Text>
      ) : null}
      {right ? <View style={styles.right}>{right}</View> : null}
      {chevron ? (
        <Icon name="chevron-right" size="sm" color={secondaryColor} />
      ) : null}
    </>
  );

  if (!isPressable) {
    return (
      <View testID={testID} style={[rowStyle, style]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      cssInterop={false}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ??
        [title, subtitle, value].filter(Boolean).join(', ')
      }
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        rowStyle,
        pressed && !disabled && { backgroundColor: theme.colors.surfaceAlt },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    flexShrink: 1,
  },
  value: {
    flexShrink: 1,
    maxWidth: '45%',
  },
  right: {
    flexShrink: 0,
  },
});
