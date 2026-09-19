import React from 'react';
import { StyleSheet, View } from 'react-native';

import { type SpacingToken, useTheme } from '@/theme';

export type SpacerProps = {
  /** ระยะจาก spacing token (ค่าเริ่มต้น lg = 16) */
  size?: SpacingToken;
  /** เว้นระยะแนวนอน (ใช้ในแถว flexDirection: 'row') */
  horizontal?: boolean;
  /** ขยายเต็มพื้นที่ที่เหลือ ใช้ดันของไปชิดขอบ */
  flex?: boolean;
};

/** ช่องว่างระหว่าง element ตาม spacing token */
export function Spacer({
  size = 'lg',
  horizontal = false,
  flex = false,
}: SpacerProps) {
  const theme = useTheme();
  const value = theme.spacing[size];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        horizontal ? { width: value } : { height: value },
        flex && styles.flex,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
