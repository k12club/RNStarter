import React from 'react';
import { useTranslation } from 'react-i18next';
import type { StyleProp, ViewStyle } from 'react-native';

import { Badge, type BadgeSize, type BadgeStatus } from '@/components/ui';

import { getAvailability } from '../utils';

/** ข้อความ + สีของสถานะสินค้า (สถานะที่ไม่รู้จักแสดงข้อความดิบ สีกลาง) */
export function useAvailability(availabilityStatus: string): {
  label: string;
  status: BadgeStatus;
} {
  const { t } = useTranslation('products');
  const info = getAvailability(availabilityStatus);
  return info
    ? { label: t(info.labelKey), status: info.status }
    : { label: availabilityStatus, status: 'neutral' };
}

type AvailabilityBadgeProps = {
  availabilityStatus: string;
  size?: BadgeSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** มีสินค้า = success, ใกล้หมด = warning, สินค้าหมด = danger (พื้น soft ทั้งหมด) */
export function AvailabilityBadge({
  availabilityStatus,
  size,
  style,
  testID,
}: AvailabilityBadgeProps) {
  const { label, status } = useAvailability(availabilityStatus);
  return (
    <Badge
      label={label}
      status={status}
      variant="soft"
      size={size}
      style={style}
      testID={testID}
    />
  );
}
