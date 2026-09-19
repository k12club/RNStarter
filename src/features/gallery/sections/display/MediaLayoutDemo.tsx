import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppHeader, AppImage, IconButton, Spacer, Text } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';
import { BROKEN_IMAGE_URL, DEMO_IMAGE_URL } from '@/features/gallery/constants';
import { makeStyles } from '@/theme';

const WIDE_RATIO = 16 / 9;

const useStyles = makeStyles(theme => ({
  // กล่องเล็กสำหรับเห็นระยะของ Spacer
  box: {
    width: theme.sizes.buttonSm,
    height: theme.sizes.buttonSm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
}));

/** AppImage: โหลดได้ / URL เสีย / ไม่มีรูป (placeholder) */
export function MediaDemo() {
  const { t } = useTranslation('gallery');

  return (
    <DemoGroup title={t('display.media.title')}>
      <View className="gap-4">
        <AppImage
          uri={DEMO_IMAGE_URL}
          aspectRatio={WIDE_RATIO}
          accessibilityLabel={t('display.media.sample')}
          testID="gallery-image-ok"
        />
        <View className="flex-row gap-3">
          <View className="flex-1 gap-1">
            <AppImage
              uri={BROKEN_IMAGE_URL}
              aspectRatio={1}
              accessibilityLabel={t('display.media.broken')}
              testID="gallery-image-broken"
            />
            <DemoLabel>{t('display.media.broken')}</DemoLabel>
          </View>
          <View className="flex-1 gap-1">
            <AppImage uri={null} aspectRatio={1} decorative />
            <DemoLabel>{t('display.media.empty')}</DemoLabel>
          </View>
        </View>
      </View>
    </DemoGroup>
  );
}

/** AppHeader (ตัวอย่างในกรอบ ไม่เว้น safe area) และ Spacer */
export function LayoutDemo() {
  const { t } = useTranslation('gallery');
  const toastApi = useToast();
  const styles = useStyles();

  return (
    <>
      <DemoGroup
        title={t('display.layout.headerTitle')}
        description={t('display.layout.headerDescription')}
        padding="none"
      >
        <AppHeader
          title={t('display.layout.headerSample')}
          safeAreaTop={false}
          showBack
          bordered
          onBackPress={() => toastApi.info(t('display.layout.backPressed'))}
          right={
            <IconButton
              icon="share"
              accessibilityLabel={t('display.layout.share')}
              onPress={() => toastApi.info(t('display.layout.share'))}
            />
          }
        />
        <View className="p-4">
          <Text color="textSecondary">{t('display.layout.headerBody')}</Text>
        </View>
      </DemoGroup>

      <DemoGroup title={t('display.layout.spacerTitle')}>
        <View className="gap-3">
          <DemoLabel>{'horizontal size="xxl" · flex'}</DemoLabel>
          <View className="flex-row items-center">
            <View style={styles.box} />
            <Spacer horizontal size="xxl" />
            <View style={styles.box} />
            <Spacer flex />
            <View style={styles.box} />
          </View>
          <DemoLabel>{'size="lg" (16)'}</DemoLabel>
          <View>
            <View style={styles.box} />
            <Spacer />
            <View style={styles.box} />
          </View>
        </View>
      </DemoGroup>
    </>
  );
}
