import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Avatar, type AvatarSize, Button, Chip } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';
import {
  BROKEN_IMAGE_URL,
  DEMO_AVATAR_URL,
  LATIN_SAMPLE_NAME,
  THAI_SAMPLE_NAME,
} from '@/features/gallery/constants';
import { getInitials } from '@/utils/format';

const FILTERS = ['all', 'new', 'sale', 'freeShipping'] as const;
type Filter = (typeof FILTERS)[number];

const TAGS = ['coffee', 'bakery', 'vegan'] as const;
type Tag = (typeof TAGS)[number];

const AVATAR_SIZES: readonly AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

/** Chip: เลือกได้ / ลบได้ / icon / disabled */
export function ChipsDemo() {
  const { t } = useTranslation('gallery');
  const toastApi = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [tags, setTags] = useState<readonly Tag[]>(TAGS);

  return (
    <DemoGroup title={t('display.chips.title')}>
      <View className="gap-5">
        <View className="gap-3">
          <DemoLabel>selected</DemoLabel>
          <View className="flex-row flex-wrap gap-3">
            {FILTERS.map(value => (
              <Chip
                key={value}
                label={t(`display.chips.filters.${value}`)}
                selected={filter === value}
                onPress={() => setFilter(value)}
              />
            ))}
          </View>
        </View>

        <View className="gap-3">
          <DemoLabel>onRemove</DemoLabel>
          <View className="flex-row flex-wrap items-center gap-3">
            {tags.map(tag => (
              <Chip
                key={tag}
                label={t(`display.chips.tags.${tag}`)}
                onRemove={() =>
                  setTags(current => current.filter(item => item !== tag))
                }
              />
            ))}
            {tags.length < TAGS.length ? (
              <Button
                size="sm"
                variant="ghost"
                title={t('display.chips.reset')}
                onPress={() => setTags(TAGS)}
              />
            ) : null}
          </View>
        </View>

        <View className="gap-3">
          <DemoLabel>icon / disabled / static</DemoLabel>
          <View className="flex-row flex-wrap gap-3">
            <Chip
              label={t('display.chips.nearby')}
              icon="map-pin"
              onPress={() => toastApi.info(t('display.chips.nearby'))}
            />
            <Chip
              label={t('display.chips.soldOut')}
              disabled
              onPress={() => undefined}
            />
            <Chip
              label={t('display.chips.selectedDisabled')}
              selected
              disabled
              onPress={() => undefined}
            />
            <Chip label={t('display.chips.readOnly')} />
          </View>
        </View>
      </View>
    </DemoGroup>
  );
}

/** Avatar ทุกขนาด, ตัวอักษรย่อ (รวมชื่อไทย), รูปเสีย, จุดสถานะ */
export function AvatarsDemo() {
  const { t } = useTranslation('gallery');

  return (
    <DemoGroup title={t('display.avatars.title')}>
      <View className="gap-5">
        <View className="gap-3">
          <DemoLabel>{t('display.avatars.withImage')}</DemoLabel>
          <View className="flex-row flex-wrap items-end gap-3">
            {AVATAR_SIZES.map(size => (
              <Avatar
                key={size}
                size={size}
                uri={DEMO_AVATAR_URL}
                name={LATIN_SAMPLE_NAME}
              />
            ))}
          </View>
        </View>

        <View className="gap-3">
          <DemoLabel>
            {t('display.avatars.initials', {
              name: THAI_SAMPLE_NAME,
              initials: getInitials(THAI_SAMPLE_NAME),
            })}
          </DemoLabel>
          <View className="flex-row flex-wrap items-end gap-3">
            {AVATAR_SIZES.map(size => (
              <Avatar
                key={size}
                size={size}
                name={THAI_SAMPLE_NAME}
                testID={`gallery-avatar-thai-${size}`}
              />
            ))}
          </View>
        </View>

        <View className="gap-3">
          <DemoLabel>{t('display.avatars.statusAndFallback')}</DemoLabel>
          <View className="flex-row flex-wrap items-end gap-4">
            <Avatar
              size="lg"
              name={LATIN_SAMPLE_NAME}
              status="online"
              statusLabel={t('display.avatars.online')}
            />
            <Avatar
              size="lg"
              name={THAI_SAMPLE_NAME}
              status="busy"
              statusLabel={t('display.avatars.busy')}
            />
            <Avatar
              size="lg"
              uri={BROKEN_IMAGE_URL}
              name={THAI_SAMPLE_NAME}
              status="away"
              statusLabel={t('display.avatars.away')}
            />
            <Avatar
              size="lg"
              status="offline"
              statusLabel={t('display.avatars.offline')}
            />
          </View>
        </View>
      </View>
    </DemoGroup>
  );
}
