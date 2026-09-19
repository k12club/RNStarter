import React from 'react';
import { useTranslation } from 'react-i18next';

import { Section } from '@/components/ui';
import type { GallerySectionName } from '@/features/gallery/constants';

type GallerySectionProps = {
  name: GallerySectionName;
  children: React.ReactNode;
};

/** หัวข้อของแต่ละกลุ่มคอมโพเนนต์ (testID gallery-section-<name> ใช้กับ Maestro) */
export function GallerySection({ name, children }: GallerySectionProps) {
  const { t } = useTranslation('gallery');

  return (
    <Section
      testID={`gallery-section-${name}`}
      title={t(`sections.${name}.title`)}
      description={t(`sections.${name}.description`)}
      gap="xl"
    >
      {children}
    </Section>
  );
}
