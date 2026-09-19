import React from 'react';
import {
  Platform,
  Pressable,
  Switch as RNSwitch,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';

import { makeStyles, useTheme } from '@/theme';

import { Text } from './Text';

export type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** มี label = แสดงเป็นแถว (label ซ้าย, switch ขวา) กดได้ทั้งแถว */
  label?: string;
  description?: string;
  disabled?: boolean;
  /** ใช้เมื่อไม่มี label ที่มองเห็น */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.sizes.touchTarget,
    paddingVertical: theme.spacing.xs,
  },
  texts: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  // Switch ไม่มี label: ห่อด้วยพื้นที่แตะ 44 (Switch ของ iOS สูงแค่ 31)
  bare: {
    minWidth: theme.sizes.touchTarget,
    minHeight: theme.sizes.touchTarget,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

/**
 * Switch ของระบบ (native) ที่ใช้สีจาก theme
 * - iOS ใช้ thumb สีขาวของระบบ, Android ตั้งสี thumb เองให้เห็นชัดทั้งสองโหมด
 */
export function Switch({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  accessibilityLabel,
  style,
  testID,
}: SwitchProps) {
  const theme = useTheme();
  const styles = useStyles();
  const { colors } = theme;

  const control = (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
      ios_backgroundColor={colors.surfaceAlt}
      thumbColor={
        Platform.OS === 'android'
          ? value
            ? colors.onPrimary
            : colors.borderStrong
          : undefined
      }
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={description}
      testID={testID}
    />
  );

  // ไม่ใช้ hitSlop กับ Switch: iOS ส่ง touch ในส่วนที่ขยายไปที่ view ครอบ ไม่ใช่ UISwitch
  // และ Android ไม่รองรับ hitSlop บน Switch จึงให้ Pressable ครอบรับการแตะรอบ ๆ แทน
  // (แตะโดนตัว Switch เอง Switch จะรับ responder ไว้ ไม่สลับซ้ำ)
  if (!label && !description) {
    return (
      <Pressable
        accessible={false}
        disabled={disabled}
        onPress={() => onValueChange(!value)}
        style={[styles.bare, style]}
      >
        {control}
      </Pressable>
    );
  }

  // แถวกดได้ทั้งแถวเพื่อให้พื้นที่แตะใหญ่ แต่ screen reader โฟกัสที่ Switch ตัวเดียว
  return (
    <Pressable
      accessible={false}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[styles.row, style]}
    >
      <View
        style={styles.texts}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {label ? (
          <Text color={disabled ? 'textDisabled' : 'text'}>{label}</Text>
        ) : null}
        {description ? (
          <Text
            variant="bodySmall"
            color={disabled ? 'textDisabled' : 'textSecondary'}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {control}
    </Pressable>
  );
}
