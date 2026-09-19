import React, { useEffect, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { makeStyles, useTheme } from '@/theme';

import { Text } from './Text';

export type SegmentedOption<T extends string | number> = {
  label: string;
  value: T;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends string | number> = {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  /** ชื่อของกลุ่มสำหรับ screen reader */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const useStyles = makeStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    padding: theme.spacing.xxs,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
  },
  indicator: {
    position: 'absolute',
    top: theme.spacing.xxs,
    bottom: theme.spacing.xxs,
    left: theme.spacing.xxs,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    // dark: surface เข้มกว่า track และเงามองไม่เห็น (contrast 1.1:1) ใช้เส้นขอบ borderStrong (3.4:1) แทน
    borderColor: theme.isDark ? theme.colors.borderStrong : theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  segment: {
    flex: 1,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
}));

/**
 * ตัวเลือกแบบแถบ (2-4 ตัวเลือกสั้น ๆ) พร้อมแถบเลือกที่เลื่อนด้วย reanimated
 * ความกว้างของแต่ละช่องเท่ากัน ข้อความยาวเกินจะถูกตัดด้วย ... (ไม่ย่อฟอนต์)
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  disabled = false,
  accessibilityLabel,
  style,
  testID,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const translateX = useSharedValue(0);

  const count = options.length;
  const matchedIndex = options.findIndex(option => option.value === value);
  // value ไม่ตรงกับตัวเลือกใด: ไม่แสดงแถบเลือก (ไม่ให้ดูเหมือนเลือกช่องแรกอยู่)
  const hasSelection = matchedIndex >= 0;
  const selectedIndex = Math.max(0, matchedIndex);
  // width = 0 จนกว่า onLayout จะทำงาน (รวมถึงใน Jest) กันหารด้วย 0
  const segmentWidth =
    width > 0 && count > 0 ? (width - theme.spacing.xxs * 2) / count : 0;

  useEffect(() => {
    translateX.value = withTiming(selectedIndex * segmentWidth, {
      duration: theme.durations.normal,
    });
  }, [selectedIndex, segmentWidth, theme.durations.normal, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth === width) {
      return;
    }
    // วัดขนาดครั้งแรก / หมุนจอ: วางแถบเลือกทันที ไม่ต้องเลื่อน
    if (count > 0) {
      translateX.value =
        (selectedIndex * (nextWidth - theme.spacing.xxs * 2)) / count;
    }
    setWidth(nextWidth);
  };

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={handleLayout}
      style={[styles.container, disabled && styles.disabled, style]}
      testID={testID}
    >
      {segmentWidth > 0 && hasSelection ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.indicator, { width: segmentWidth }, indicatorStyle]}
          testID={testID ? `${testID}-indicator` : undefined}
        />
      ) : null}
      {options.map(option => {
        const selected = option.value === value;
        const optionDisabled = disabled || !!option.disabled;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, disabled: optionDisabled }}
            disabled={optionDisabled}
            onPress={() => {
              if (!selected) {
                onChange(option.value);
              }
            }}
            style={styles.segment}
          >
            <Text
              variant="label"
              weight={selected ? 'semibold' : 'medium'}
              color={
                optionDisabled && !selected
                  ? 'textDisabled'
                  : selected
                  ? 'text'
                  : 'textSecondary'
              }
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
