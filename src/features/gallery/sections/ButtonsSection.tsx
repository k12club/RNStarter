import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  Button,
  type ButtonSize,
  type ButtonVariant,
  Icon,
  IconButton,
  type IconButtonSize,
  type IconButtonVariant,
} from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';
import { GallerySection } from '@/features/gallery/components/GallerySection';

const VARIANTS: readonly ButtonVariant[] = [
  'primary',
  'secondary',
  'outline',
  'ghost',
  'danger',
];
const SIZES: readonly ButtonSize[] = ['sm', 'md', 'lg'];
const ICON_VARIANTS: readonly IconButtonVariant[] = [
  'primary',
  'secondary',
  'ghost',
];
const ICON_SIZES: readonly IconButtonSize[] = ['sm', 'md', 'lg'];

/** ปุ่มทุก variant x size, สถานะ loading / disabled, icon ซ้าย-ขวา, เต็มความกว้าง, IconButton */
export const ButtonsSection = memo(function ButtonsSectionContent() {
  const { t } = useTranslation('gallery');
  const toastApi = useToast();

  const pressed = (name: string) => () =>
    toastApi.info(t('buttons.pressed', { name }));

  return (
    <GallerySection name="buttons">
      <DemoGroup
        title={t('buttons.variantsTitle')}
        description={t('buttons.variantsDescription')}
      >
        <View className="gap-5">
          {VARIANTS.map(variant => (
            <View key={variant} className="gap-2">
              <DemoLabel>{variant}</DemoLabel>
              <View className="flex-row flex-wrap items-center gap-3">
                {SIZES.map(size => (
                  <Button
                    key={size}
                    variant={variant}
                    size={size}
                    title={t('buttons.sample')}
                    accessibilityLabel={`${t(
                      'buttons.sample',
                    )} ${variant} ${size}`}
                    onPress={pressed(`${variant} ${size}`)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      </DemoGroup>

      <DemoGroup title={t('buttons.statesTitle')}>
        <View className="gap-5">
          <View className="gap-2">
            <DemoLabel>loading</DemoLabel>
            <View className="flex-row flex-wrap items-center gap-3">
              <Button title={t('buttons.saving')} loading />
              <Button title={t('buttons.saving')} variant="outline" loading />
            </View>
          </View>
          <View className="gap-2">
            <DemoLabel>disabled</DemoLabel>
            <View className="flex-row flex-wrap items-center gap-3">
              {VARIANTS.map(variant => (
                <Button
                  key={variant}
                  variant={variant}
                  size="sm"
                  title={variant}
                  disabled
                />
              ))}
            </View>
          </View>
          <View className="gap-2">
            <DemoLabel>left / right</DemoLabel>
            <View className="flex-row flex-wrap items-center gap-3">
              <Button
                title={t('buttons.addToCart')}
                left={<Icon name="shopping-cart" size="sm" color="onPrimary" />}
                onPress={pressed(t('buttons.addToCart'))}
              />
              <Button
                variant="outline"
                title={t('buttons.continue')}
                right={<Icon name="arrow-right" size="sm" color="text" />}
                onPress={pressed(t('buttons.continue'))}
              />
              <Button
                variant="ghost"
                title={t('buttons.share')}
                left={<Icon name="share" size="sm" color="primary" />}
                onPress={pressed(t('buttons.share'))}
              />
              <Button
                variant="danger"
                size="sm"
                title={t('buttons.remove')}
                left={<Icon name="trash" size="sm" color="onDanger" />}
                onPress={pressed(t('buttons.remove'))}
              />
            </View>
          </View>
          <View className="gap-2">
            <DemoLabel>fullWidth</DemoLabel>
            <Button
              fullWidth
              size="lg"
              title={t('buttons.checkout')}
              onPress={pressed(t('buttons.checkout'))}
            />
            <Button
              fullWidth
              variant="secondary"
              title={t('buttons.saveDraft')}
              onPress={pressed(t('buttons.saveDraft'))}
            />
          </View>
        </View>
      </DemoGroup>

      <DemoGroup
        title={t('buttons.iconButtonsTitle')}
        description={t('buttons.iconButtonsDescription')}
      >
        <View className="gap-5">
          {ICON_VARIANTS.map(variant => (
            <View key={variant} className="gap-2">
              <DemoLabel>{variant}</DemoLabel>
              <View className="flex-row flex-wrap items-center gap-4">
                {ICON_SIZES.map(size => (
                  <IconButton
                    key={size}
                    icon="heart"
                    variant={variant}
                    size={size}
                    accessibilityLabel={t('buttons.iconButtonLabel', {
                      variant,
                      size,
                    })}
                    onPress={pressed(`IconButton ${variant} ${size}`)}
                  />
                ))}
                <IconButton
                  icon="settings"
                  variant={variant}
                  shape="rounded"
                  accessibilityLabel={t('buttons.iconButtonRounded', {
                    variant,
                  })}
                  onPress={pressed(`IconButton ${variant} rounded`)}
                />
              </View>
            </View>
          ))}
          <View className="gap-2">
            <DemoLabel>loading / disabled</DemoLabel>
            <View className="flex-row flex-wrap items-center gap-4">
              <IconButton
                icon="refresh-cw"
                variant="secondary"
                loading
                accessibilityLabel={t('buttons.refreshing')}
              />
              <IconButton
                icon="trash"
                variant="primary"
                disabled
                accessibilityLabel={t('buttons.remove')}
              />
            </View>
          </View>
        </View>
      </DemoGroup>
    </GallerySection>
  );
});
