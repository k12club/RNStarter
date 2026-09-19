import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  Card,
  Chip,
  SegmentedControl,
  type SegmentedOption,
  Text,
} from '@/components/ui';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@/i18n/languages';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectThemePreference,
  setLanguage,
  setThemePreference,
} from '@/store/slices/settingsSlice';
import type { ThemePreference } from '@/theme/types';

/**
 * สลับธีม / ภาษาจากหน้า gallery ได้ทันที เพื่อตรวจทุก section ครบ 2 ธีม 2 ภาษา
 * ค่าที่เลือกเป็นค่าเดียวกับหน้า Settings (เก็บใน Redux และจำไว้หลังปิดแอป)
 */
export const GalleryControls = memo(function GalleryControlsContent() {
  const { t, i18n } = useTranslation('gallery');
  const dispatch = useAppDispatch();
  const preference = useAppSelector(selectThemePreference);
  // ภาษาใน store เป็น null ได้ (ยังไม่เคยเลือก = ตามเครื่อง) จึงอ่านภาษาที่ใช้อยู่จริงจาก i18n
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language;

  const themeOptions = useMemo<ReadonlyArray<SegmentedOption<ThemePreference>>>(
    () => [
      { value: 'system', label: t('controls.themeSystem') },
      { value: 'light', label: t('controls.themeLight') },
      { value: 'dark', label: t('controls.themeDark') },
    ],
    [t],
  );

  return (
    <Card>
      <View className="gap-5">
        <View className="gap-2">
          <Text variant="label">{t('controls.theme')}</Text>
          <SegmentedControl
            testID="gallery-theme"
            accessibilityLabel={t('controls.theme')}
            options={themeOptions}
            value={preference}
            onChange={value => dispatch(setThemePreference(value))}
          />
        </View>
        <View className="gap-2">
          <Text variant="label">{t('controls.language')}</Text>
          <View className="flex-row flex-wrap gap-3">
            {SUPPORTED_LANGUAGES.map(language => (
              <Chip
                key={language}
                testID={`gallery-lang-${language}`}
                label={LANGUAGE_LABELS[language]}
                selected={currentLanguage === language}
                onPress={() => dispatch(setLanguage(language))}
              />
            ))}
          </View>
        </View>
      </View>
    </Card>
  );
});
