import React, { memo } from 'react';

import { GallerySection } from '@/features/gallery/components/GallerySection';
import { ChoiceInputsDemo } from '@/features/gallery/sections/inputs/ChoiceInputsDemo';
import { TextInputsDemo } from '@/features/gallery/sections/inputs/TextInputsDemo';

/** ช่องกรอกทุกชนิดพร้อมสถานะ helper / error / disabled */
export const InputsSection = memo(function InputsSectionContent() {
  return (
    <GallerySection name="inputs">
      <TextInputsDemo />
      <ChoiceInputsDemo />
    </GallerySection>
  );
});
