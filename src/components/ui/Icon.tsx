import React from 'react';

import { type ColorTokens, useTheme } from '@/theme';

import { type IconName, icons } from './icons';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type IconProps = {
  name: IconName;
  /** token ของ theme (ค่าเริ่มต้น md = 22) หรือเลข dp */
  size?: IconSize | number;
  /** สีจาก theme หรือค่าสีตรง ๆ (ใช้กับ tabBarIcon ที่ส่งสีมาให้) */
  color?: keyof ColorTokens | (string & {});
  strokeWidth?: number;
  /** ใส่เมื่อ icon สื่อความหมายเอง (ไม่มีข้อความประกอบ) */
  accessibilityLabel?: string;
  testID?: string;
};

export function Icon({
  name,
  size = 'md',
  color = 'text',
  strokeWidth = 2,
  accessibilityLabel,
  testID,
}: IconProps) {
  const theme = useTheme();
  const Component = icons[name];
  const px = typeof size === 'number' ? size : theme.sizes.icon[size];
  const resolvedColor =
    color in theme.colors
      ? theme.colors[color as keyof ColorTokens]
      : (color as string);

  return (
    <Component
      size={px}
      color={resolvedColor}
      strokeWidth={strokeWidth}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={
        accessibilityLabel ? 'yes' : 'no-hide-descendants'
      }
      testID={testID}
    />
  );
}

export type { IconName };
