import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { StyleProp, ViewStyle } from 'react-native';

import { toApiError } from '@/services/api/errors';

import { EmptyState } from './EmptyState';

export type ErrorStateProps = {
  /** error อะไรก็ได้ (AxiosError / ApiError / Error) แปลงผ่าน toApiError */
  error: unknown;
  /** ไม่ใส่ = ไม่แสดงปุ่มลองอีกครั้ง */
  onRetry?: () => void;
  /** กำลังลองใหม่ (ปุ่มแสดง loading) */
  retrying?: boolean;
  /** แทนหัวข้อเริ่มต้น t('errors:title') */
  title?: string;
  /** ขยายเต็มพื้นที่และจัดกึ่งกลางแนวตั้ง */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** แสดง error ที่แปลแล้วตามชนิด (ApiError.kind) พร้อมปุ่มลองอีกครั้ง */
export function ErrorState({
  error,
  onRetry,
  retrying = false,
  title,
  fill = false,
  style,
  testID,
}: ErrorStateProps) {
  const { t } = useTranslation(['errors', 'common']);
  const kind = useMemo(() => toApiError(error).kind, [error]);

  return (
    <EmptyState
      testID={testID}
      tone="danger"
      announce
      icon={kind === 'network' ? 'wifi-off' : 'circle-alert'}
      title={title ?? t('errors:title')}
      description={t(`errors:${kind}`)}
      actionLabel={onRetry ? t('common:retry') : undefined}
      onAction={onRetry}
      actionIcon="refresh-cw"
      actionLoading={retrying}
      fill={fill}
      style={style}
    />
  );
}
