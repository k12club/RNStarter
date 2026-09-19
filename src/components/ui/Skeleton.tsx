import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type DimensionValue,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { type RadiusToken, useTheme } from '@/theme';

export type SkeletonVariant = 'text' | 'circle' | 'rect';

export type SkeletonProps = {
  variant?: SkeletonVariant;
  /** ความกว้าง (text / rect) ค่าเริ่มต้นเต็มความกว้าง */
  width?: DimensionValue;
  /** ความสูง (rect) หรือเส้นผ่านศูนย์กลาง (circle) */
  height?: number;
  /** จำนวนบรรทัด (text) */
  lines?: number;
  /** ความกว้างบรรทัดสุดท้ายเมื่อมีหลายบรรทัด (text) */
  lastLineWidth?: DimensionValue;
  radius?: RadiusToken;
  /** ใส่เมื่อ skeleton นี้เป็นตัวแทนการโหลดของทั้งส่วน (ไม่ใส่ = screen reader ข้าม) */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

// รอบของ shimmer (ไป-กลับ) และความสูง default ของ rect เช่น รูป thumbnail
const SHIMMER_DURATION = 900;
const DEFAULT_RECT_HEIGHT = 120;
const FULL_WIDTH: DimensionValue = '100%';
// ความกว้างบรรทัดใน SkeletonList: บรรทัดแรก (หัวข้อ) ยาวกว่าบรรทัดรอง
const LIST_TITLE_WIDTH: DimensionValue = '70%';
const LIST_SUBTITLE_WIDTH: DimensionValue = '45%';

/**
 * สีกระพริบระหว่าง skeleton <-> skeletonHighlight
 * ผู้ใช้เปิด "ลดการเคลื่อนไหว" = ไม่ animate ใช้สีนิ่ง
 */
function useShimmerStyle() {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const base = theme.colors.skeleton;
  const highlight = theme.colors.skeletonHighlight;

  useEffect(() => {
    if (reducedMotion) {
      progress.set(0);
      return;
    }
    progress.set(
      withRepeat(
        withTiming(1, {
          duration: SHIMMER_DURATION,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, reducedMotion]);

  return useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.get(),
      [0, 1],
      [base, highlight],
    ),
  }));
}

type ShimmerStyle = ReturnType<typeof useShimmerStyle>;

function Block({
  shimmer,
  style,
}: {
  shimmer: ShimmerStyle;
  style: StyleProp<ViewStyle>;
}) {
  return <Animated.View style={[style, shimmer]} />;
}

function useLineHeight() {
  const theme = useTheme();
  // ความสูงเท่าตัวอักษร bodySmall (14) เว้นบรรทัด sm
  return {
    height: theme.typeScale.bodySmall.fontSize,
    gap: theme.spacing.sm,
    radius: theme.radius.xs,
  };
}

/** กล่องเทาแทนเนื้อหาระหว่างโหลด */
export function Skeleton({
  variant = 'rect',
  width,
  height,
  lines = 1,
  lastLineWidth = '60%',
  radius,
  accessibilityLabel,
  style,
  testID,
}: SkeletonProps) {
  const theme = useTheme();
  const shimmer = useShimmerStyle();
  const line = useLineHeight();

  const a11y = {
    accessible: !!accessibilityLabel,
    accessibilityRole: accessibilityLabel
      ? ('progressbar' as const)
      : undefined,
    accessibilityLabel,
    accessibilityState: accessibilityLabel ? { busy: true } : undefined,
    accessibilityElementsHidden: !accessibilityLabel,
    importantForAccessibility: accessibilityLabel
      ? ('yes' as const)
      : ('no-hide-descendants' as const),
  };

  if (variant === 'circle') {
    const size = height ?? theme.sizes.avatar.md;
    return (
      <View testID={testID} {...a11y} style={style}>
        <Block
          shimmer={shimmer}
          style={{
            width: size,
            height: size,
            borderRadius: theme.radius.full,
          }}
        />
      </View>
    );
  }

  if (variant === 'text') {
    const count = Math.max(1, Math.floor(lines));
    return (
      <View
        testID={testID}
        {...a11y}
        style={[{ width: width ?? FULL_WIDTH, gap: line.gap }, style]}
      >
        {Array.from({ length: count }, (_, index) => (
          <Block
            key={index}
            shimmer={shimmer}
            style={{
              width:
                count > 1 && index === count - 1 ? lastLineWidth : FULL_WIDTH,
              height: line.height,
              borderRadius: radius ? theme.radius[radius] : line.radius,
            }}
          />
        ))}
      </View>
    );
  }

  return (
    <View testID={testID} {...a11y} style={style}>
      <Block
        shimmer={shimmer}
        style={{
          width: width ?? FULL_WIDTH,
          height: height ?? DEFAULT_RECT_HEIGHT,
          borderRadius: theme.radius[radius ?? 'md'],
        }}
      />
    </View>
  );
}

export type SkeletonListProps = {
  /** จำนวนแถว (ค่าเริ่มต้น 5) */
  count?: number;
  /** วงกลมด้านซ้ายแทนรูป / icon */
  avatar?: boolean;
  /** จำนวนบรรทัดข้อความต่อแถว */
  lines?: number;
  /** ค่าเริ่มต้น t('common:loading') */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** skeleton ของรายการ ขนาดเท่า ListItem ทุกแถวกระพริบพร้อมกัน */
export function SkeletonList({
  count = 5,
  avatar = true,
  lines = 2,
  accessibilityLabel,
  style,
  testID,
}: SkeletonListProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const shimmer = useShimmerStyle();
  const line = useLineHeight();
  const lineCount = Math.max(1, Math.floor(lines));
  const circle = theme.sizes.avatar.md;

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? t('loading')}
      accessibilityState={{ busy: true }}
      style={style}
    >
      {Array.from({ length: Math.max(1, count) }, (_row, row) => (
        <View
          key={row}
          style={[
            styles.row,
            {
              minHeight: theme.sizes.buttonLg,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              gap: theme.spacing.md,
            },
          ]}
        >
          {avatar ? (
            <Block
              shimmer={shimmer}
              style={{
                width: circle,
                height: circle,
                borderRadius: theme.radius.full,
              }}
            />
          ) : null}
          <View style={[styles.lines, { gap: line.gap }]}>
            {Array.from({ length: lineCount }, (_line, index) => (
              <Block
                key={index}
                shimmer={shimmer}
                style={{
                  width: index === 0 ? LIST_TITLE_WIDTH : LIST_SUBTITLE_WIDTH,
                  height: line.height,
                  borderRadius: line.radius,
                }}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lines: {
    flex: 1,
  },
});
