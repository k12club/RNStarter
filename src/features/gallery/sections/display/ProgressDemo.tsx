import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  Button,
  ProgressBar,
  Skeleton,
  SkeletonList,
  Spinner,
} from '@/components/ui';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';
import type { StatusColor } from '@/theme';
import { formatPercent } from '@/utils/format';

const STEP = 0.25;
const STATUS_SAMPLES: ReadonlyArray<{ color: StatusColor; value: number }> = [
  { color: 'success', value: 1 },
  { color: 'info', value: 0.75 },
  { color: 'warning', value: 0.5 },
  { color: 'danger', value: 0.2 },
];

/** ProgressBar (มีค่า + เลื่อนแบบ animate / ไม่รู้ค่า) และ Spinner */
export function ProgressDemo() {
  const { t } = useTranslation(['gallery', 'common']);
  const [value, setValue] = useState(0.5);

  return (
    <DemoGroup title={t('gallery:display.progress.title')}>
      <View className="gap-5">
        <View className="gap-2">
          <DemoLabel>
            {t('gallery:display.progress.upload', {
              percent: formatPercent(value, 0),
            })}
          </DemoLabel>
          <ProgressBar
            value={value}
            size="md"
            accessibilityLabel={t('gallery:display.progress.uploadLabel')}
          />
          <View className="flex-row flex-wrap gap-3">
            <Button
              size="sm"
              variant="outline"
              title={t('gallery:display.progress.decrease')}
              disabled={value <= 0}
              onPress={() => setValue(current => Math.max(0, current - STEP))}
            />
            <Button
              size="sm"
              variant="outline"
              title={t('gallery:display.progress.increase')}
              disabled={value >= 1}
              onPress={() => setValue(current => Math.min(1, current + STEP))}
            />
          </View>
        </View>

        <View className="gap-3">
          <DemoLabel>color · size sm</DemoLabel>
          {STATUS_SAMPLES.map(sample => (
            <ProgressBar
              key={sample.color}
              value={sample.value}
              color={sample.color}
              accessibilityLabel={`${sample.color} ${formatPercent(
                sample.value,
                0,
              )}`}
            />
          ))}
        </View>

        <View className="gap-2">
          <DemoLabel>indeterminate</DemoLabel>
          <ProgressBar
            indeterminate
            accessibilityLabel={t('gallery:display.progress.syncing')}
          />
        </View>

        <View className="gap-2">
          <DemoLabel>Spinner</DemoLabel>
          <View className="flex-row flex-wrap items-center">
            <Spinner size="small" />
            <Spinner />
            <Spinner label={t('common:loading')} />
          </View>
        </View>
      </View>
    </DemoGroup>
  );
}

/** Skeleton ทุกแบบ (text / circle / rect) และ SkeletonList */
export function SkeletonDemo() {
  const { t } = useTranslation('gallery');

  return (
    <DemoGroup title={t('display.skeleton.title')}>
      <View className="gap-5">
        <View className="flex-row items-center gap-3">
          <Skeleton variant="circle" />
          <View className="flex-1">
            <Skeleton variant="text" lines={2} />
          </View>
        </View>
        <Skeleton variant="rect" height={96} />
        <Skeleton variant="text" lines={3} lastLineWidth="40%" />
        <DemoLabel>SkeletonList</DemoLabel>
        <SkeletonList count={2} />
      </View>
    </DemoGroup>
  );
}
