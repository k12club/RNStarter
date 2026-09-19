import React from 'react';
import { useTranslation } from 'react-i18next';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { useNetworkStatus } from '@/hooks';
import { makeStyles, useTheme } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export type OfflineBannerProps = {
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * แถบแจ้งเตือนเมื่อไม่มีอินเทอร์เน็ต (ซ่อนเองเมื่อกลับมาออนไลน์)
 * แสดงเฉพาะเมื่อรู้แน่ว่า offline (ดู useNetworkStatus) ไม่เว้น safe area เอง
 * วางใต้ header หรือเป็นลูกแรกของ <Screen>
 */
export function OfflineBanner({ style, testID }: OfflineBannerProps) {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const styles = useStyles();
  const { isOffline } = useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View
      testID={testID}
      entering={FadeInUp.duration(theme.durations.normal)}
      exiting={FadeOutUp.duration(theme.durations.fast)}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, style]}
    >
      <Icon name="wifi-off" size="sm" color="onWarningSoft" />
      <Text variant="label" color="onWarningSoft" style={styles.text}>
        {t('offline')}
      </Text>
    </Animated.View>
  );
}

const useStyles = makeStyles(theme => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.screenGutter,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.warningSoft,
  },
  text: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
}));
