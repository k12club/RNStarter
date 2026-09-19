import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Divider, Text } from '@/components/ui';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';
import { GallerySection } from '@/features/gallery/components/GallerySection';
import {
  hp,
  isTablet,
  moderateScale,
  scale,
  useResponsive,
  verticalScale,
  wp,
} from '@/theme';

const SAMPLE_SIZE = 16;

function formatDp(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

type ValueRowProps = {
  name: string;
  value: string;
};

/** แถว ชื่อฟังก์ชัน : ค่า (ชื่อยาวขึ้นบรรทัดใหม่ ค่าอยู่ขวาเสมอ) */
function ValueRow({ name, value }: ValueRowProps) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <View className="flex-1">
        <Text variant="bodySmall" color="textSecondary">
          {name}
        </Text>
      </View>
      <Text variant="body" weight="semibold" align="right">
        {value}
      </Text>
    </View>
  );
}

/** ค่าจาก responsive helpers ของ theme บนเครื่องนี้ */
export const ResponsiveSection = memo(function ResponsiveSectionContent() {
  const { t } = useTranslation(['gallery', 'common']);
  const responsive = useResponsive();
  const yesNo = (value: boolean) => (value ? t('common:yes') : t('common:no'));

  const hookRows: ReadonlyArray<ValueRowProps> = [
    { name: 'width', value: formatDp(responsive.width) },
    { name: 'height', value: formatDp(responsive.height) },
    { name: 'isLandscape', value: yesNo(responsive.isLandscape) },
    { name: 'isTablet', value: yesNo(responsive.isTablet) },
    { name: 'wp(50)', value: formatDp(responsive.wp(50)) },
    { name: 'hp(10)', value: formatDp(responsive.hp(10)) },
  ];

  const staticRows: ReadonlyArray<ValueRowProps> = [
    { name: 'wp(50)', value: formatDp(wp(50)) },
    { name: 'hp(10)', value: formatDp(hp(10)) },
    { name: 'isTablet()', value: yesNo(isTablet()) },
    { name: `scale(${SAMPLE_SIZE})`, value: formatDp(scale(SAMPLE_SIZE)) },
    {
      name: `verticalScale(${SAMPLE_SIZE})`,
      value: formatDp(verticalScale(SAMPLE_SIZE)),
    },
    {
      name: `moderateScale(${SAMPLE_SIZE})`,
      value: formatDp(moderateScale(SAMPLE_SIZE)),
    },
  ];

  return (
    <GallerySection name="responsive">
      <DemoGroup
        title="useResponsive()"
        description={t('gallery:responsive.hookDescription')}
      >
        {hookRows.map((row, index) => (
          <View key={row.name}>
            {index > 0 ? <Divider /> : null}
            <ValueRow name={row.name} value={row.value} />
          </View>
        ))}
        <View className="mt-3 gap-2">
          <DemoLabel>{t('gallery:responsive.barLabel')}</DemoLabel>
          {/* ความกว้างคำนวณจากจอ: ต้องใช้ style (className รับค่าที่คำนวณตอน runtime ไม่ได้) */}
          <View
            className="h-2 max-w-full rounded-full bg-primary"
            style={{ width: responsive.wp(50) }}
          />
        </View>
      </DemoGroup>

      <DemoGroup
        title="wp / hp / scale"
        description={t('gallery:responsive.staticDescription')}
      >
        {staticRows.map((row, index) => (
          <View key={row.name}>
            {index > 0 ? <Divider /> : null}
            <ValueRow name={row.name} value={row.value} />
          </View>
        ))}
      </DemoGroup>
    </GallerySection>
  );
});
