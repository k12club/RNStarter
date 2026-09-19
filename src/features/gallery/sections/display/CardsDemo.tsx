import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Button, Card, Icon, Text } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';
import { type ElevationToken, makeStyles } from '@/theme';

const ELEVATIONS: readonly ElevationToken[] = ['none', 'sm', 'md', 'lg'];

const useStyles = makeStyles(theme => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing.md,
  },
  cell: {
    width: '48%',
  },
}));

/** Card: ระดับเงา, เส้นขอบ, กดได้ / กดไม่ได้, header + footer */
export function CardsDemo() {
  const { t } = useTranslation('gallery');
  const toastApi = useToast();
  const styles = useStyles();

  return (
    <DemoGroup
      title={t('display.cards.title')}
      description={t('display.cards.description')}
      bare
    >
      <View style={styles.grid}>
        {ELEVATIONS.map(elevation => (
          <Card
            key={elevation}
            elevation={elevation}
            bordered={elevation === 'none'}
            style={styles.cell}
          >
            <Text variant="label">elevation</Text>
            <DemoLabel>
              {elevation === 'none' ? 'none + bordered' : elevation}
            </DemoLabel>
          </Card>
        ))}
      </View>

      <Card
        onPress={() => toastApi.info(t('display.cards.pressed'))}
        accessibilityLabel={t('display.cards.pressableTitle')}
        accessibilityHint={t('display.cards.pressableHint')}
      >
        <View className="flex-row items-center gap-3">
          <Icon name="package" color="primary" />
          <View className="flex-1">
            <Text weight="semibold">{t('display.cards.pressableTitle')}</Text>
            <Text variant="bodySmall" color="textSecondary">
              {t('display.cards.pressableHint')}
            </Text>
          </View>
          <Icon name="chevron-right" size="sm" color="textSecondary" />
        </View>
      </Card>

      <Card
        onPress={() => undefined}
        disabled
        accessibilityLabel={t('display.cards.disabledTitle')}
      >
        <Text weight="semibold">{t('display.cards.disabledTitle')}</Text>
        <Text variant="bodySmall" color="textSecondary">
          {t('display.cards.disabledHint')}
        </Text>
      </Card>

      <Card
        header={
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text variant="title">{t('display.cards.orderTitle')}</Text>
            </View>
            <Badge label={t('display.cards.orderStatus')} status="info" />
          </View>
        }
        footer={
          <View className="flex-row flex-wrap justify-end gap-3">
            <Button
              size="sm"
              variant="ghost"
              title={t('display.cards.orderTrack')}
              onPress={() => toastApi.info(t('display.cards.orderTrack'))}
            />
            <Button
              size="sm"
              title={t('display.cards.orderReceived')}
              onPress={() => toastApi.success(t('display.cards.orderReceived'))}
            />
          </View>
        }
      >
        <Text>{t('display.cards.orderBody')}</Text>
      </Card>
    </DemoGroup>
  );
}
