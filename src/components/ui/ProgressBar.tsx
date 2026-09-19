import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type LayoutChangeEvent,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { type StatusColor, useTheme } from '@/theme';

export type ProgressBarProps = {
  /** 0..1 (ค่านอกช่วงจะถูกบีบให้อยู่ในช่วง) */
  value?: number;
  /** ไม่รู้ความคืบหน้า: แถบวิ่งวนไปเรื่อย ๆ */
  indeterminate?: boolean;
  /** สีจาก theme (ค่าเริ่มต้น primary) */
  color?: StatusColor;
  /** sm = 4, md = 8 */
  size?: 'sm' | 'md';
  /** ค่าเริ่มต้น t('common:loading') */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

// ความกว้างของแถบวิ่ง (สัดส่วนของราง) และเวลาต่อรอบ
const SEGMENT_RATIO = 0.4;
const INDETERMINATE_DURATION = 1200;

function clamp01(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

/**
 * แถบความคืบหน้า
 * ขยับด้วย translateX (ไม่เปลี่ยน layout ทุกเฟรม) จึงต้องรู้ความกว้างรางจาก onLayout
 */
export function ProgressBar({
  value,
  indeterminate = false,
  color = 'primary',
  size = 'sm',
  accessibilityLabel,
  style,
  testID,
}: ProgressBarProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const reducedMotion = useReducedMotion();
  const trackWidth = useSharedValue(0);
  const progress = useSharedValue(0);
  const loop = useSharedValue(0);
  const target = clamp01(value);
  const height = size === 'md' ? theme.spacing.sm : theme.spacing.xs;

  useEffect(() => {
    if (indeterminate) {
      return;
    }
    progress.set(
      reducedMotion
        ? target
        : withTiming(target, {
            duration: theme.durations.normal,
            easing: Easing.out(Easing.cubic),
          }),
    );
  }, [indeterminate, progress, reducedMotion, target, theme.durations.normal]);

  useEffect(() => {
    if (!indeterminate || reducedMotion) {
      cancelAnimation(loop);
      loop.set(0);
      return;
    }
    loop.set(0);
    loop.set(
      withRepeat(
        withTiming(1, {
          duration: INDETERMINATE_DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(loop);
  }, [indeterminate, loop, reducedMotion]);

  const fillStyle = useAnimatedStyle(() => {
    const width = trackWidth.get();
    if (indeterminate) {
      const segment = width * SEGMENT_RATIO;
      // ลดการเคลื่อนไหว: แถบนิ่งอยู่กลางราง
      const x = reducedMotion
        ? (width - segment) / 2
        : -segment + loop.get() * (width + segment);
      return {
        width: segment,
        opacity: width > 0 ? 1 : 0,
        transform: [{ translateX: x }],
      };
    }
    return {
      width,
      opacity: width > 0 ? 1 : 0,
      transform: [{ translateX: -(1 - progress.get()) * width }],
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    trackWidth.set(event.nativeEvent.layout.width);
  };

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? t('loading')}
      accessibilityState={indeterminate ? { busy: true } : undefined}
      accessibilityValue={
        indeterminate
          ? undefined
          : { min: 0, max: 100, now: Math.round(target * 100) }
      }
      onLayout={onLayout}
      style={[
        styles.track,
        {
          height,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.surfaceAlt,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors[color],
          },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
});
