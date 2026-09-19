import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  Badge,
  type BadgeSize,
  type BadgeStatus,
  type BadgeVariant,
  CountBadge,
  IconButton,
} from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';
import { makeStyles } from '@/theme';

const STATUSES: readonly BadgeStatus[] = [
  'neutral',
  'primary',
  'success',
  'warning',
  'danger',
  'info',
];
const VARIANTS: readonly BadgeVariant[] = ['soft', 'solid'];
const SIZES: readonly BadgeSize[] = ['md', 'sm'];
const NOTIFICATION_COUNT = 5;

const useStyles = makeStyles(theme => ({
  // CountBadge มุมขวาบนของปุ่ม (ยื่นออกนอกปุ่มเล็กน้อย)
  countOverlay: {
    position: 'absolute',
    top: -theme.spacing.xs,
    right: -theme.spacing.xs,
  },
}));

/** Badge ทุกสถานะ x รูปแบบ x ขนาด, จุดสถานะ, icon และ CountBadge */
export function BadgesDemo() {
  const { t } = useTranslation('gallery');
  const toastApi = useToast();
  const styles = useStyles();
  const notificationsLabel = t('display.badges.notifications', {
    total: NOTIFICATION_COUNT,
  });

  return (
    <DemoGroup title={t('display.badges.title')}>
      <View className="gap-5">
        {SIZES.flatMap(size =>
          VARIANTS.map(variant => (
            <View key={`${size}-${variant}`} className="gap-2">
              <DemoLabel>{`${variant} · ${size}`}</DemoLabel>
              <View className="flex-row flex-wrap gap-2">
                {STATUSES.map(status => (
                  <Badge
                    key={status}
                    label={t(`display.badges.status.${status}`)}
                    status={status}
                    variant={variant}
                    size={size}
                  />
                ))}
              </View>
            </View>
          )),
        )}

        <View className="gap-2">
          <DemoLabel>dot / icon</DemoLabel>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge label={t('display.badges.online')} status="success" dot />
            <Badge label={t('display.badges.pending')} status="warning" dot />
            <Badge
              label={t('display.badges.verified')}
              status="primary"
              icon="shield-check"
            />
            <Badge
              label={t('display.badges.sale')}
              status="danger"
              variant="solid"
              size="sm"
              icon="tag"
            />
            <Badge
              dot
              status="danger"
              accessibilityLabel={t('display.badges.unread')}
            />
          </View>
        </View>

        <View className="gap-2">
          <DemoLabel>CountBadge</DemoLabel>
          <View className="flex-row flex-wrap items-center gap-4">
            <CountBadge count={3} />
            <CountBadge count={120} />
            <CountBadge count={12} status="primary" />
            <CountBadge count={0} showZero status="neutral" />
            <View>
              <IconButton
                icon="bell"
                variant="secondary"
                accessibilityLabel={notificationsLabel}
                onPress={() => toastApi.info(notificationsLabel)}
              />
              {/* ปุ่มประกาศจำนวนใน label แล้ว ตัวเลขจึงซ่อนจาก screen reader */}
              <View
                pointerEvents="none"
                style={styles.countOverlay}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <CountBadge count={NOTIFICATION_COUNT} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </DemoGroup>
  );
}
