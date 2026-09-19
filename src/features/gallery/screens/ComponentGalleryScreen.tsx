import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { LoadingOverlay, Screen, Text } from '@/components/ui';
import { GalleryControls } from '@/features/gallery/components/GalleryControls';
import { LOADING_DEMO_MS } from '@/features/gallery/constants';
import { ButtonsSection } from '@/features/gallery/sections/ButtonsSection';
import { ColorsSection } from '@/features/gallery/sections/ColorsSection';
import { DisplaySection } from '@/features/gallery/sections/DisplaySection';
import { FeedbackSection } from '@/features/gallery/sections/FeedbackSection';
import { FormSection } from '@/features/gallery/sections/FormSection';
import { IconsSection } from '@/features/gallery/sections/IconsSection';
import { InputsSection } from '@/features/gallery/sections/InputsSection';
import { NativeWindSection } from '@/features/gallery/sections/NativeWindSection';
import { ResponsiveSection } from '@/features/gallery/sections/ResponsiveSection';
import { SheetsSection } from '@/features/gallery/sections/SheetsSection';
import { TypographySection } from '@/features/gallery/sections/TypographySection';
import { makeStyles } from '@/theme';

// testID อยู่ที่ ScrollView จริง (Maestro ใช้ scroll / swipe บน element นี้)
const SCROLL_PROPS = { testID: 'gallery-scroll' } as const;

/**
 * Component Gallery: รวมทุกคอมโพเนนต์ใน components/ui พร้อม variant / state
 * - เปิดได้ทั้งก่อนและหลังเข้าสู่ระบบ (native header ตั้งชื่อหน้าให้แล้ว)
 * - สลับธีม / ภาษาได้จากด้านบน ทุก section เปลี่ยนตามทันที
 * - แต่ละ section เป็น memo: state ของหน้านี้ (overlay) ไม่ทำให้ทุก section render ใหม่
 */
export function ComponentGalleryScreen() {
  const { t } = useTranslation('gallery');
  const styles = useStyles();
  const [loading, setLoading] = useState(false);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (loadingTimer.current) {
        clearTimeout(loadingTimer.current);
      }
    },
    [],
  );

  const showLoading = useCallback(() => {
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current);
    }
    setLoading(true);
    loadingTimer.current = setTimeout(() => {
      setLoading(false);
    }, LOADING_DEMO_MS);
  }, []);

  return (
    <Screen
      testID="gallery-screen"
      scroll
      padded
      // มี native header แล้ว เว้นเฉพาะด้านล่าง (เนื้อหายาวถึงล่างจอ ไม่มี footer)
      edges={['bottom']}
      scrollProps={SCROLL_PROPS}
      contentContainerStyle={styles.content}
      overlay={
        <LoadingOverlay
          visible={loading}
          message={t('feedback.overlayMessage')}
          testID="gallery-loading"
        />
      }
    >
      <View className="gap-4">
        <Text color="textSecondary">{t('intro')}</Text>
        <GalleryControls />
      </View>
      <TypographySection />
      <ColorsSection />
      <IconsSection />
      <ButtonsSection />
      <InputsSection />
      <FormSection />
      <DisplaySection />
      <FeedbackSection onShowLoading={showLoading} />
      <SheetsSection />
      <NativeWindSection />
      <ResponsiveSection />
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  content: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.huge,
    gap: theme.spacing.huge,
  },
}));
