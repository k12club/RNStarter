import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { type ElevationToken, type SpacingToken, useTheme } from '@/theme';

export type CardProps = {
  children?: React.ReactNode;
  /** ระยะขอบด้านใน (ค่าเริ่มต้น lg = 16) */
  padding?: SpacingToken;
  /** เงาจาก theme.shadows (ค่าเริ่มต้น sm) */
  elevation?: ElevationToken;
  /** เส้นขอบ hairline (ช่วยแยก card จากพื้นหลังเมื่อไม่มีเงา) */
  bordered?: boolean;
  /** ส่วนหัว / ท้าย คั่นจากเนื้อหาด้วยเส้นแบ่ง */
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** ใส่แล้ว card กดได้ทั้งใบ */
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  /** แนะนำให้ใส่เมื่อกดได้ (ค่าเริ่มต้นอ่านจากข้อความข้างใน) */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** กล่องเนื้อหาบนพื้น surface มุมโค้ง lg */
export function Card({
  children,
  padding = 'lg',
  elevation = 'sm',
  bordered = false,
  header,
  footer,
  onPress,
  onLongPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: CardProps) {
  const theme = useTheme();
  const pad = theme.spacing[padding];
  // toArray ตัด null / undefined / boolean ทิ้ง: {cond && <X />} ที่เป็น false จะไม่ได้กล่องว่างที่มี padding
  const hasBody = React.Children.toArray(children).length > 0;
  const divider = {
    borderColor: theme.colors.border,
  };

  const baseStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
    },
    theme.shadows[elevation],
    bordered && {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
  ];

  const content = (
    <>
      {header ? (
        <View
          style={[
            styles.header,
            divider,
            { paddingHorizontal: pad, paddingVertical: theme.spacing.md },
          ]}
        >
          {header}
        </View>
      ) : null}
      {hasBody ? <View style={{ padding: pad }}>{children}</View> : null}
      {footer ? (
        <View
          style={[
            styles.footer,
            divider,
            { paddingHorizontal: pad, paddingVertical: theme.spacing.md },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </>
  );

  if (!onPress && !onLongPress) {
    return (
      <View testID={testID} style={[baseStyle, style]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      cssInterop={false}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        baseStyle,
        pressed && !disabled && { backgroundColor: theme.colors.surfaceAlt },
        disabled && styles.disabled,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    // ไม่ใช้ overflow: 'hidden' เพราะจะตัดเงา (boxShadow) ทิ้ง
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  disabled: {
    opacity: 0.5,
  },
});
