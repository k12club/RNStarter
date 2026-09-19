import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type LayoutChangeEvent, View } from 'react-native';

import { Text } from '@/components/ui';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';
import { GallerySection } from '@/features/gallery/components/GallerySection';
import { makeStyles } from '@/theme';

// class ต้องเขียนเต็มเป็น literal ในไฟล์ (Tailwind สแกนหา class จากข้อความ ต่อ string เองไม่ได้)
const GAP_SAMPLES = [
  { className: 'flex-row gap-1', label: 'gap-1 · 0.25rem' },
  { className: 'flex-row gap-2', label: 'gap-2 · 0.5rem' },
  { className: 'flex-row gap-3', label: 'gap-3 · 0.75rem' },
  { className: 'flex-row gap-4', label: 'gap-4 · 1rem' },
  { className: 'flex-row gap-6', label: 'gap-6 · 1.5rem' },
] as const;

const STATUS_SAMPLES = [
  {
    className: 'rounded-md bg-success-soft p-3',
    color: 'onSuccessSoft',
    label: 'bg-success-soft',
  },
  {
    className: 'rounded-md bg-warning-soft p-3',
    color: 'onWarningSoft',
    label: 'bg-warning-soft',
  },
  {
    className: 'rounded-md bg-danger-soft p-3',
    color: 'onDangerSoft',
    label: 'bg-danger-soft',
  },
  {
    className: 'rounded-md bg-info-soft p-3',
    color: 'onInfoSoft',
    label: 'bg-info-soft',
  },
] as const;

// StyleSheet ที่ให้ผลเดียวกับ className ด้านซ้าย (ค่าจาก theme token ตรง ๆ)
const useStyles = makeStyles(theme => ({
  softBox: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  outlinedBox: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  // มือถือเรียงเป็นคอลัมน์เดียว แท็บเล็ตวางคู่กัน (ขั้นต่ำ 200dp ต่อฝั่ง)
  pair: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  pairItem: {
    flexGrow: 1,
    flexBasis: 200,
    gap: theme.spacing.sm,
  },
}));

type CompareProps = {
  label: string;
  code: string;
  children: React.ReactNode;
};

function CompareItem({ label, code, children }: CompareProps) {
  const styles = useStyles();
  return (
    <View style={styles.pairItem}>
      <Text variant="label">{label}</Text>
      {children}
      <DemoLabel>{code}</DemoLabel>
    </View>
  );
}

/** วัดความกว้างจริงของ w-16 (4rem) เพื่อดูว่า 1rem = กี่ dp บนเครื่องนี้ */
function RemProbe() {
  const { t } = useTranslation('gallery');
  const [width, setWidth] = useState<number | null>(null);

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View className="gap-2">
      <View
        className="h-3 w-16 rounded-full bg-primary"
        onLayout={handleLayout}
      />
      <Text variant="bodySmall" color="textSecondary">
        {width === null
          ? t('nativewind.remMeasuring')
          : t('nativewind.remMeasured', {
              width: Math.round(width * 10) / 10,
              rem: Math.round((width / 4) * 10) / 10,
            })}
      </Text>
    </View>
  );
}

/** className (NativeWind) เทียบกับ StyleSheet ที่ให้ผลเดียวกัน + ข้อควรระวัง */
export const NativeWindSection = memo(function NativeWindSectionContent() {
  const { t } = useTranslation('gallery');
  const styles = useStyles();

  return (
    <GallerySection name="nativewind">
      <DemoGroup
        title={t('nativewind.compareTitle')}
        description={t('nativewind.compareDescription')}
      >
        <View className="gap-6">
          <View style={styles.pair}>
            <CompareItem
              label="className"
              code="bg-primary-soft rounded-lg p-4"
            >
              <View className="rounded-lg bg-primary-soft p-4">
                <Text color="onPrimarySoft">{t('nativewind.sampleText')}</Text>
              </View>
            </CompareItem>
            <CompareItem
              label="StyleSheet"
              code="primarySoft · radius.lg · spacing.lg"
            >
              <View style={styles.softBox}>
                <Text color="onPrimarySoft">{t('nativewind.sampleText')}</Text>
              </View>
            </CompareItem>
          </View>

          <View style={styles.pair}>
            <CompareItem
              label="className"
              code="border border-border-strong rounded-md bg-surface p-4"
            >
              <View className="rounded-md border border-border-strong bg-surface p-4">
                <Text>{t('nativewind.sampleText')}</Text>
              </View>
            </CompareItem>
            <CompareItem
              label="StyleSheet"
              code="borderStrong · radius.md · surface · spacing.lg"
            >
              <View style={styles.outlinedBox}>
                <Text>{t('nativewind.sampleText')}</Text>
              </View>
            </CompareItem>
          </View>
        </View>
      </DemoGroup>

      <DemoGroup
        title={t('nativewind.spacingTitle')}
        description={t('nativewind.spacingDescription')}
      >
        <View className="gap-4">
          {GAP_SAMPLES.map(sample => (
            <View key={sample.label} className="gap-1">
              <DemoLabel>{sample.label}</DemoLabel>
              <View className={sample.className}>
                <View className="h-6 w-6 rounded-xs bg-primary" />
                <View className="h-6 w-6 rounded-xs bg-primary" />
                <View className="h-6 w-6 rounded-xs bg-primary" />
              </View>
            </View>
          ))}
          <RemProbe />
        </View>
      </DemoGroup>

      <DemoGroup
        title={t('nativewind.themeTitle')}
        description={t('nativewind.themeDescription')}
      >
        <View className="gap-3">
          {STATUS_SAMPLES.map(sample => (
            <View key={sample.label} className={sample.className}>
              <Text variant="label" color={sample.color}>
                {sample.label}
              </Text>
            </View>
          ))}
        </View>
      </DemoGroup>

      <DemoGroup
        title={t('nativewind.textTitle')}
        description={t('nativewind.textDescription')}
      >
        <View className="gap-3">
          <DemoLabel>{'<Text className="text-h1 text-primary">'}</DemoLabel>
          {/* ตั้งใจให้เห็นว่าไม่มีผล: Text ใส่ขนาด / สี ผ่าน style ซึ่งชนะ className */}
          <Text className="text-h1 text-primary">
            {t('nativewind.overriddenSample')}
          </Text>
          <DemoLabel>{'<Text variant="h1" color="primary">'}</DemoLabel>
          <Text variant="h1" color="primary">
            {t('nativewind.propsSample')}
          </Text>
        </View>
      </DemoGroup>
    </GallerySection>
  );
});
