import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { type SpacingToken, useTheme } from '@/theme';

import { Text } from './Text';

export type DividerProps = {
  /** เว้นระยะด้านหน้า (เช่น ให้ตรงกับข้อความใน ListItem) เป็น token หรือค่า dp ที่คำนวณแล้ว */
  inset?: SpacingToken | number;
  /** เว้นระยะด้านท้าย */
  insetEnd?: SpacingToken | number;
  /** ระยะห่างบน-ล่าง (หรือซ้าย-ขวาเมื่อ vertical) */
  spacing?: SpacingToken;
  /** ข้อความกลางเส้น เช่น "หรือ" */
  label?: string;
  /** เส้นแนวตั้ง ใช้ในแถว flexDirection: 'row' */
  vertical?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** เส้นแบ่งบาง ๆ (hairline) สี border ของ theme */
export function Divider({
  inset,
  insetEnd,
  spacing = 'none',
  label,
  vertical = false,
  style,
  testID,
}: DividerProps) {
  const theme = useTheme();
  const resolve = (value?: SpacingToken | number) =>
    value === undefined
      ? 0
      : typeof value === 'number'
      ? value
      : theme.spacing[value];
  const gap = theme.spacing[spacing];
  const line = { backgroundColor: theme.colors.border };

  if (vertical) {
    return (
      <View
        testID={testID}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.vertical,
          line,
          {
            marginHorizontal: gap,
            marginTop: resolve(inset),
            marginBottom: resolve(insetEnd),
          },
          style,
        ]}
      />
    );
  }

  const containerInset = {
    marginVertical: gap,
    marginStart: resolve(inset),
    marginEnd: resolve(insetEnd),
  };

  if (label) {
    return (
      <View testID={testID} style={[styles.labelRow, containerInset, style]}>
        <View style={[styles.flexLine, line]} />
        <Text
          variant="caption"
          color="textTertiary"
          align="center"
          style={[styles.label, { marginHorizontal: theme.spacing.md }]}
        >
          {label}
        </Text>
        <View style={[styles.flexLine, line]} />
      </View>
    );
  }

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.horizontal, line, containerInset, style]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  vertical: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  label: {
    flexShrink: 1,
  },
});
