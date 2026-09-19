import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  Button,
  Card,
  Dialog,
  EmptyState,
  ErrorState,
  OfflineBanner,
  RadioGroup,
  type RadioOption,
  Text,
  Toast,
  type ToastType,
  useDialog,
} from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';
import { GallerySection } from '@/features/gallery/components/GallerySection';
import { RETRY_DEMO_MS } from '@/features/gallery/constants';
import { useNetworkStatus } from '@/hooks';
import { ApiError } from '@/services/api/errors';

const TOAST_TYPES: readonly ToastType[] = [
  'success',
  'error',
  'info',
  'warning',
];
const REASONS = ['price', 'quality', 'other'] as const;
type Reason = (typeof REASONS)[number];

// สร้างครั้งเดียว: ErrorState จำชนิด error ตาม reference และประกาศซ้ำเมื่อ error เปลี่ยน
const NETWORK_ERROR = new ApiError({ kind: 'network', message: '' });

type FeedbackSectionProps = {
  /** แสดง LoadingOverlay ของหน้าจอ (overlay ต้องอยู่ที่ Screen ไม่ใช่ใน scroll) */
  onShowLoading: () => void;
};

/** toast, dialog (alert / confirm / กำหนดเอง), LoadingOverlay, EmptyState, ErrorState, OfflineBanner */
export const FeedbackSection = memo(function FeedbackSectionContent({
  onShowLoading,
}: FeedbackSectionProps) {
  const { t } = useTranslation(['gallery', 'common']);
  const toastApi = useToast();
  const dialog = useDialog();
  const network = useNetworkStatus();
  const [customOpen, setCustomOpen] = useState(false);
  const [reason, setReason] = useState<Reason>('price');
  const [retrying, setRetrying] = useState(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
    },
    [],
  );

  const reasonOptions = useMemo<ReadonlyArray<RadioOption<Reason>>>(
    () =>
      REASONS.map(value => ({
        value,
        label: t(`gallery:feedback.reasons.${value}`),
      })),
    [t],
  );

  const showAlert = async () => {
    await dialog.alert({
      title: t('gallery:feedback.alertTitle'),
      message: t('gallery:feedback.alertMessage'),
    });
    toastApi.info(t('gallery:feedback.alertClosed'));
  };

  const showConfirm = async (destructive: boolean) => {
    const ok = await dialog.confirm(
      destructive
        ? {
            title: t('gallery:feedback.deleteTitle'),
            message: t('gallery:feedback.deleteMessage'),
            confirmLabel: t('common:delete'),
            destructive: true,
          }
        : {
            title: t('gallery:feedback.confirmTitle'),
            message: t('gallery:feedback.confirmMessage'),
          },
    );
    toastApi.show({
      type: ok ? 'success' : 'info',
      message: ok
        ? t('gallery:feedback.resultConfirmed')
        : t('gallery:feedback.resultCancelled'),
    });
  };

  const closeCustom = () => setCustomOpen(false);

  const handleRetry = () => {
    setRetrying(true);
    retryTimer.current = setTimeout(() => {
      setRetrying(false);
      toastApi.error(t('gallery:feedback.retryFailed'));
    }, RETRY_DEMO_MS);
  };

  return (
    <GallerySection name="feedback">
      <DemoGroup
        title={t('gallery:feedback.toastTitle')}
        description={t('gallery:feedback.toastDescription')}
      >
        <View className="gap-4">
          <View className="flex-row flex-wrap gap-3">
            {TOAST_TYPES.map(type => (
              <Button
                key={type}
                testID={`gallery-toast-${type}`}
                size="sm"
                variant="outline"
                title={t(`gallery:feedback.toastButtons.${type}`)}
                onPress={() =>
                  toastApi[type](t(`gallery:feedback.toastMessages.${type}`))
                }
              />
            ))}
          </View>
          <View className="flex-row flex-wrap gap-3">
            <Button
              size="sm"
              variant="secondary"
              title={t('gallery:feedback.toastWithTitle')}
              onPress={() =>
                toastApi.success(t('gallery:feedback.toastWithTitleMessage'), {
                  title: t('gallery:feedback.toastWithTitleHeading'),
                })
              }
            />
            <Button
              size="sm"
              variant="secondary"
              title={t('gallery:feedback.toastSticky')}
              onPress={() =>
                toastApi.warning(t('gallery:feedback.toastStickyMessage'), {
                  duration: 0,
                })
              }
            />
            <Button
              size="sm"
              variant="ghost"
              title={t('gallery:feedback.toastHideAll')}
              onPress={() => toastApi.hideAll()}
            />
          </View>
          <DemoLabel>{t('gallery:feedback.toastPreview')}</DemoLabel>
          <View className="gap-2">
            {TOAST_TYPES.map(type => (
              <Toast
                key={type}
                type={type}
                title={
                  type === 'success'
                    ? t('gallery:feedback.previewTitle')
                    : undefined
                }
                message={t('gallery:feedback.previewMessage', { type })}
              />
            ))}
          </View>
        </View>
      </DemoGroup>

      <DemoGroup
        title={t('gallery:feedback.dialogTitle')}
        description={t('gallery:feedback.dialogDescription')}
      >
        <View className="flex-row flex-wrap gap-3">
          <Button
            testID="gallery-dialog-alert"
            size="sm"
            variant="outline"
            title={t('gallery:feedback.openAlert')}
            onPress={showAlert}
          />
          <Button
            testID="gallery-dialog-confirm"
            size="sm"
            variant="outline"
            title={t('gallery:feedback.openConfirm')}
            onPress={() => showConfirm(false)}
          />
          <Button
            testID="gallery-dialog-destructive"
            size="sm"
            variant="danger"
            title={t('gallery:feedback.openDelete')}
            onPress={() => showConfirm(true)}
          />
          <Button
            testID="gallery-dialog-custom"
            size="sm"
            variant="secondary"
            title={t('gallery:feedback.openCustom')}
            onPress={() => setCustomOpen(true)}
          />
        </View>
        <Dialog
          testID="gallery-dialog-custom-modal"
          visible={customOpen}
          title={t('gallery:feedback.customTitle')}
          message={t('gallery:feedback.customMessage')}
          onRequestClose={closeCustom}
          // ปุ่มหลักอยู่ท้ายสุด (ล่างสุดเมื่อเรียงแนวตั้ง)
          actions={[
            {
              label: t('common:cancel'),
              variant: 'outline',
              onPress: closeCustom,
            },
            {
              label: t('gallery:feedback.customLater'),
              variant: 'ghost',
              onPress: closeCustom,
            },
            {
              label: t('gallery:feedback.customSubmit'),
              onPress: () => {
                closeCustom();
                toastApi.success(
                  t('gallery:feedback.customResult', {
                    reason: t(`gallery:feedback.reasons.${reason}`),
                  }),
                );
              },
            },
          ]}
        >
          <RadioGroup
            label={t('gallery:feedback.reasonLabel')}
            options={reasonOptions}
            value={reason}
            onChange={setReason}
          />
        </Dialog>
      </DemoGroup>

      <DemoGroup
        title="LoadingOverlay"
        description={t('gallery:feedback.overlayDescription')}
      >
        <Button
          testID="gallery-loading-overlay"
          variant="outline"
          title={t('gallery:feedback.showOverlay')}
          onPress={onShowLoading}
        />
      </DemoGroup>

      <DemoGroup title="EmptyState" padding="none">
        <EmptyState
          icon="shopping-cart"
          title={t('gallery:feedback.emptyTitle')}
          description={t('gallery:feedback.emptyDescription')}
          actionLabel={t('gallery:feedback.emptyAction')}
          actionIcon="search"
          onAction={() => toastApi.info(t('gallery:feedback.emptyAction'))}
        />
      </DemoGroup>

      <DemoGroup
        title="ErrorState"
        description={t('gallery:feedback.errorDescription')}
        padding="none"
      >
        <ErrorState
          error={NETWORK_ERROR}
          onRetry={handleRetry}
          retrying={retrying}
        />
      </DemoGroup>

      <DemoGroup
        title="OfflineBanner"
        description={t('gallery:feedback.offlineDescription')}
        bare
      >
        <OfflineBanner testID="gallery-offline-banner" />
        <Card>
          <Text variant="bodySmall" color="textSecondary">
            {t('gallery:feedback.networkStatus', {
              status: network.isOffline
                ? t('gallery:feedback.statusOffline')
                : t('gallery:feedback.statusOnline'),
              type: network.type,
            })}
          </Text>
        </Card>
      </DemoGroup>
    </GallerySection>
  );
});
