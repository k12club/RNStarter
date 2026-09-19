import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type AccordionProps = {
  title: string;
  subtitle?: string;
  /** icon หน้าหัวข้อ */
  icon?: IconName;
  children?: React.ReactNode;
  /** ควบคุมจากภายนอก (ใช้คู่กับ onExpandedChange) */
  expanded?: boolean;
  /** ค่าเริ่มต้นเมื่อไม่ได้ควบคุมจากภายนอก */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  disabled?: boolean;
  /** style ของส่วนเนื้อหา */
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * หัวข้อที่กดเพื่อแสดง / ซ่อนเนื้อหา
 * ลูกศรหมุนด้วย reanimated (ลดการเคลื่อนไหว = เปลี่ยนทันที)
 */
export function Accordion({
  title,
  subtitle,
  icon,
  children,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  disabled = false,
  contentStyle,
  style,
  testID,
}: AccordionProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [innerExpanded, setInnerExpanded] = useState(defaultExpanded);
  const isControlled = expandedProp !== undefined;
  const expanded = isControlled ? expandedProp : innerExpanded;

  const rotation = useSharedValue(expanded ? 180 : 0);

  useEffect(() => {
    const target = expanded ? 180 : 0;
    rotation.set(
      reducedMotion
        ? target
        : withTiming(target, { duration: theme.durations.normal }),
    );
  }, [expanded, reducedMotion, rotation, theme.durations.normal]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.get()}deg` }],
  }));

  const toggle = () => {
    const next = !expanded;
    if (!isControlled) {
      setInnerExpanded(next);
    }
    onExpandedChange?.(next);
  };

  return (
    <View testID={testID} style={style}>
      <Pressable
        cssInterop={false}
        testID={testID ? `${testID}-header` : undefined}
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
        accessibilityState={{ expanded, disabled }}
        disabled={disabled}
        onPress={toggle}
        style={({ pressed }) => [
          styles.header,
          {
            minHeight: theme.sizes.buttonLg,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            gap: theme.spacing.md,
          },
          pressed && !disabled && { backgroundColor: theme.colors.surfaceAlt },
          disabled && styles.disabled,
        ]}
      >
        {icon ? <Icon name={icon} size="md" color="textSecondary" /> : null}
        <View style={styles.titleBlock}>
          <Text variant="body" weight="semibold">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodySmall" color="textSecondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron-down" size="sm" color="textSecondary" />
        </Animated.View>
      </Pressable>
      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(theme.durations.normal)}
          style={[
            {
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: theme.spacing.lg,
            },
            contentStyle,
          ]}
        >
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});
