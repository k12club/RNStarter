import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';
import { GallerySection } from '@/features/gallery/components/GallerySection';
import {
  fonts,
  type FontWeightName,
  type TextVariant,
  typeScale,
  useTheme,
} from '@/theme';

const VARIANTS = Object.keys(typeScale) as TextVariant[];
const WEIGHTS = Object.keys(fonts.body) as FontWeightName[];
// ตัวแทนของแต่ละ family: body = Sarabun, h3 = Kanit
const WEIGHT_SAMPLES: ReadonlyArray<{ variant: TextVariant; family: string }> =
  [
    { variant: 'body', family: 'Sarabun' },
    { variant: 'h3', family: 'Kanit' },
  ];

/** ทุก variant ของ Text พร้อมตัวอย่างไทย (สระบน-ล่าง / วรรณยุกต์) และละติน */
export const TypographySection = memo(function TypographySectionContent() {
  const { t } = useTranslation('gallery');
  const theme = useTheme();

  return (
    <GallerySection name="typography">
      <DemoGroup title={t('typography.variantsTitle')}>
        <View className="gap-6">
          {VARIANTS.map(variant => {
            const spec = theme.typeScale[variant];
            return (
              <View key={variant} className="gap-1">
                <Text variant="label">{variant}</Text>
                <DemoLabel>
                  {t('typography.spec', {
                    size: spec.fontSize,
                    lineHeight: spec.lineHeight,
                    font: theme.fonts[spec.family][spec.weight],
                  })}
                </DemoLabel>
                {/* พื้น surfaceAlt = กรอบบรรทัด ถ้าสระบนหรือวรรณยุกต์ล้นกรอบจะเห็นทันที */}
                <View className="self-start rounded-xs bg-surface-alt">
                  <Text variant={variant}>{t('typography.sampleThai')}</Text>
                </View>
                <Text variant={variant}>{t('typography.sampleLatin')}</Text>
              </View>
            );
          })}
        </View>
      </DemoGroup>

      <DemoGroup
        title={t('typography.weightsTitle')}
        description={t('typography.weightsDescription')}
      >
        <View className="gap-5">
          {WEIGHT_SAMPLES.map(({ variant, family }) => (
            <View key={variant} className="gap-1">
              <DemoLabel>{family}</DemoLabel>
              {WEIGHTS.map(weight => (
                <Text key={weight} variant={variant} weight={weight}>
                  {t('typography.weightSample', { weight })}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </DemoGroup>
    </GallerySection>
  );
});
