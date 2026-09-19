import type { BadgeStatus } from '@/components/ui';
import { formatNumber } from '@/utils/format';

import type { AvailabilityStatus } from './types';

/** ราคาของ DummyJSON เป็น USD: 1234.5 -> "$1,234.50" (ห้ามใช้ formatCurrency ซึ่งเป็นบาท) */
export function formatUsd(price: number): string {
  return `$${formatNumber(price)}`;
}

/** 4.567 -> "4.6" */
export function formatRating(rating: number): string {
  return formatNumber(rating, { decimals: 1 });
}

/** 10.48 -> "10" (ใช้ใน badge ส่วนลด) */
export function formatDiscount(percent: number): string {
  return formatNumber(percent, { decimals: 0 });
}

/** slug หมวด -> ชื่อที่อ่านได้: 'mens-shirts' -> 'Mens Shirts' (ตรงกับ name ของ /products/categories) */
export function formatCategoryName(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

type AvailabilityInfo = {
  labelKey:
    | 'availability.inStock'
    | 'availability.lowStock'
    | 'availability.outOfStock';
  status: BadgeStatus;
};

const AVAILABILITY: Record<AvailabilityStatus, AvailabilityInfo> = {
  'In Stock': { labelKey: 'availability.inStock', status: 'success' },
  'Low Stock': {
    labelKey: 'availability.lowStock',
    status: 'warning',
  },
  'Out of Stock': {
    labelKey: 'availability.outOfStock',
    status: 'danger',
  },
};

/** สถานะที่ไม่รู้จักคืน null (ผู้เรียกแสดงข้อความดิบเป็น badge สีกลาง) */
export function getAvailability(status: string): AvailabilityInfo | null {
  return Object.prototype.hasOwnProperty.call(AVAILABILITY, status)
    ? AVAILABILITY[status as AvailabilityStatus]
    : null;
}
