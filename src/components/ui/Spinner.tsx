import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { type ColorTokens, useTheme } from '@/theme';

import { Text } from './Text';

export type SpinnerProps = {
  size?: 'small' | 'large';
  /** สีจาก theme (ค่าเริ่มต้น primary) */
  color?: keyof ColorTokens;
  /** ข้อความใต้ spinner เช่น t('common:loading') */
  label?: string;
  /** ขยายเต็มพื้นที่และจัดกึ่งกลาง (ใช้เป็นหน้าโหลดทั้งหน้า) */
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** ตัวหมุนแสดงการโหลด พร้อมข้อความ (ถ้ามี) */
export function Spinner({
  size = 'large',
  color = 'primary',
  label,
  fullScreen = false,
  style,
  testID,
}: SpinnerProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? t('loading')}
      accessibilityState={{ busy: true }}
      style={[
        styles.container,
        { padding: theme.spacing.lg },
        fullScreen && styles.fullScreen,
        style,
      ]}
    >
      <ActivityIndicator size={size} color={theme.colors[color]} />
      {label ? (
        <Text
          variant="bodySmall"
          color="textSecondary"
          align="center"
          style={{ marginTop: theme.spacing.sm }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
  },
});
