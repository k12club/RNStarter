import React, { memo } from 'react';

import { GallerySection } from '@/features/gallery/components/GallerySection';
import { BadgesDemo } from '@/features/gallery/sections/display/BadgesDemo';
import { CardsDemo } from '@/features/gallery/sections/display/CardsDemo';
import {
  AvatarsDemo,
  ChipsDemo,
} from '@/features/gallery/sections/display/ChipsAvatarsDemo';
import {
  DividerDemo,
  ListItemsDemo,
  SectionAccordionDemo,
} from '@/features/gallery/sections/display/ListDemo';
import {
  LayoutDemo,
  MediaDemo,
} from '@/features/gallery/sections/display/MediaLayoutDemo';
import {
  ProgressDemo,
  SkeletonDemo,
} from '@/features/gallery/sections/display/ProgressDemo';

/** คอมโพเนนต์แสดงผลทั้งหมด (แยกไฟล์ตามกลุ่มใน sections/display) */
export const DisplaySection = memo(function DisplaySectionContent() {
  return (
    <GallerySection name="display">
      <CardsDemo />
      <BadgesDemo />
      <ChipsDemo />
      <AvatarsDemo />
      <DividerDemo />
      <ListItemsDemo />
      <SectionAccordionDemo />
      <ProgressDemo />
      <SkeletonDemo />
      <MediaDemo />
      <LayoutDemo />
    </GallerySection>
  );
});
