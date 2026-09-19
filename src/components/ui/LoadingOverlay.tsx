import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { makeStyles, useTheme } from '@/theme';

import { Text } from './Text';

export type LoadingOverlayProps = {
  visible: boolean;
  /** ข้อความใต้ spinner (ค่าเริ่มต้นไม่มี แต่ screen reader จะอ่าน t('common:loading')) */
  message?: string;
  testID?: string;
};

/**
 * ฉากหลังโปร่งแสงพร้อม spinner กันการแตะระหว่างรอ (เช่น ตอนกดบันทึก)
 *
 * - เป็น View แบบ absolute ไม่ใช่ RN Modal: iOS แสดง Modal ใหม่ (เช่น dialog แจ้ง error)
 *   ระหว่างที่ Modal เดิมกำลังปิดไม่ได้ ถ้าใช้ Modal ทั้งคู่ dialog จะไม่ขึ้นและ promise ค้าง
 * - คลุมเฉพาะ parent: ส่งผ่าน <Screen overlay={<LoadingOverlay visible={saving} />}> จะคลุม
 *   header slot + เนื้อหา + footer ของหน้านั้น แต่ไม่คลุม native header / tab bar
 *   (ห้ามใส่เป็น children ของ Screen: จะอยู่ใน scroll content และเลื่อนตามเนื้อหา)
 *   ถ้าต้องคลุมทั้งแอปให้วางไว้ใน RootNavigator หลัง navigator
 * - ระหว่างแสดงจะกันปุ่ม back ของ Android
 * - accessibilityViewIsModal (ซ่อนเนื้อหาด้านล่างจาก screen reader) ใช้ได้เฉพาะ iOS
 *   บน Android TalkBack ยังโฟกัสและกดเนื้อหาด้านล่างได้ ปุ่มที่ต้องกันกดซ้ำให้ใส่ loading / disabled ด้วย
 */
export function LoadingOverlay({
  visible,
  message,
  testID,
}: LoadingOverlayProps) {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const styles = useStyles();

  useEffect(() => {
    if (!visible) {
      return;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => subscription.remove();
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      testID={testID}
      entering={FadeIn.duration(theme.durations.fast)}
      exiting={FadeOut.duration(theme.durations.fast)}
      accessible
      accessibilityViewIsModal
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? t('loading')}
      accessibilityState={{ busy: true }}
      accessibilityLiveRegion="polite"
      // รับ touch ทั้งหมดไว้เอง ไม่ให้ทะลุไปถึงหน้าจอด้านล่าง
      onStartShouldSetResponder={() => true}
      style={styles.overlay}
    >
      <View style={styles.card}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        {message ? (
          <Text
            variant="body"
            color="textSecondary"
            align="center"
            style={styles.message}
          >
            {message}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles(theme => ({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.sizes.screenGutter,
    backgroundColor: theme.colors.backdrop,
    zIndex: 999,
  },
  card: {
    alignItems: 'center',
    minWidth: theme.sizes.avatar.xl,
    maxWidth: theme.sizes.contentMaxWidth / 2,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
  },
  message: {
    marginTop: theme.spacing.md,
  },
}));
