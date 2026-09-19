import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { SelectOption } from '@/components/ui';

// ตัวอย่างบางจังหวัด (พอให้เห็นการค้นหาใน Select) ชื่อแปลอยู่ใน gallery.json
export const PROVINCES = [
  'bkk',
  'nbi',
  'ptm',
  'ayy',
  'cbi',
  'nma',
  'kkn',
  'cnx',
  'cri',
  'hkt',
  'sni',
  'ska',
] as const;

export type Province = (typeof PROVINCES)[number];

/** ตัวเลือกจังหวัดตามภาษาปัจจุบัน */
export function useProvinceOptions(): ReadonlyArray<SelectOption<Province>> {
  const { t } = useTranslation('gallery');
  return useMemo(
    () => PROVINCES.map(value => ({ value, label: t(`provinces.${value}`) })),
    [t],
  );
}
