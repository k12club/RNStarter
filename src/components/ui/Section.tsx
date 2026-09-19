import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { type SpacingToken, useTheme } from '@/theme';

import { Text } from './Text';

export type SectionProps = {
  title?: string;
  /** ขนาดหัวข้อ (ค่าเริ่มต้น h3) */
  titleVariant?: 'h3' | 'title';
  description?: string;
  /** ลิงก์ด้านขวาของหัวข้อ เช่น t('common:seeAll') */
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  /** ระยะห่างระหว่าง children (ค่าเริ่มต้น md = 12) */
  gap?: SpacingToken;
  /** ระยะขอบซ้ายขวาของหัวข้อ (ใช้เมื่อ children เต็มจอ เช่น list) */
  headerInset?: SpacingToken;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** กลุ่มเนื้อหาพร้อมหัวข้อ */
export function Section({
  title,
  titleVariant = 'h3',
  description,
  actionLabel,
  onAction,
  children,
  gap = 'md',
  headerInset = 'none',
  style,
  testID,
}: SectionProps) {
  const theme = useTheme();
  const hasAction = !!actionLabel && !!onAction;
  const hasHeader = !!title || !!description || hasAction;
  const slop = Math.max(
    0,
    (theme.sizes.touchTarget - theme.typeScale.label.lineHeight) / 2,
  );

  return (
    <View testID={testID} style={[{ gap: theme.spacing[gap] }, style]}>
      {hasHeader ? (
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: theme.spacing[headerInset],
              gap: theme.spacing.md,
            },
          ]}
        >
          <View style={styles.titleBlock}>
            {title ? (
              <Text variant={titleVariant} accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            {description ? (
              <Text variant="bodySmall" color="textSecondary">
                {description}
              </Text>
            ) : null}
          </View>
          {hasAction ? (
            <Pressable
              cssInterop={false}
              accessibilityRole="button"
              accessibilityLabel={
                title ? `${actionLabel} ${title}` : actionLabel
              }
              hitSlop={slop}
              onPress={onAction}
              style={({ pressed }) => [
                styles.action,
                { minHeight: theme.typeScale.label.lineHeight },
                pressed && styles.pressed,
              ]}
            >
              <Text variant="label" color="primary">
                {actionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  titleBlock: {
    flex: 1,
    flexShrink: 1,
  },
  action: {
    flexShrink: 0,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
