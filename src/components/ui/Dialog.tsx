import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles, useTheme } from '@/theme';

import { Button, type ButtonVariant } from './Button';
import { Text } from './Text';

export type DialogAction = {
  label: string;
  onPress: () => void;
  /** ค่าเริ่มต้น primary ปุ่มยกเลิกควรใช้ outline, ปุ่มลบใช้ danger */
  variant?: ButtonVariant;
  testID?: string;
};

export type DialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  /** เรียงซ้ายไปขวา (หรือบนลงล่าง) ปุ่มหลักควรอยู่ท้ายสุด */
  actions: DialogAction[];
  /** ปุ่ม back ของ Android / แตะฉากหลัง (ถ้า dismissible) */
  onRequestClose: () => void;
  /** Modal ปิดเสร็จ (หลัง fade-out จบ) เรียกเฉพาะ iOS */
  onDismiss?: () => void;
  /** แตะฉากหลังเพื่อปิดได้ (ค่าเริ่มต้น true) */
  dismissible?: boolean;
  /** 'auto' = แถวเดียวเมื่อมีไม่เกิน 2 ปุ่ม นอกนั้นเรียงแนวตั้ง */
  actionsLayout?: 'auto' | 'row' | 'column';
  /** เนื้อหาเพิ่มเติมใต้ message (ไม่รองรับการดันหลบคีย์บอร์ด) */
  children?: React.ReactNode;
  testID?: string;
};

/**
 * กล่องโต้ตอบกลางจอ (RN Modal แบบ transparent + fade)
 * ส่วนใหญ่ให้ใช้ผ่าน useDialog().alert / confirm แทนการ render เอง
 *
 * - เนื้อหาใน Modal อยู่คนละ root กับแอป ต้องมี GestureHandlerRootView ของตัวเอง
 * - statusBarTranslucent / navigationBarTranslucent: แอปเปิด edge-to-edge ฉากหลังต้องคลุมแถบระบบด้วย
 */
export function Dialog({
  visible,
  title,
  message,
  actions,
  onRequestClose,
  onDismiss,
  dismissible = true,
  actionsLayout = 'auto',
  children,
  testID,
}: DialogProps) {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const isRow =
    actionsLayout === 'row' ||
    (actionsLayout === 'auto' && actions.length <= 2);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onRequestClose}
      onDismiss={onDismiss}
    >
      <GestureHandlerRootView style={styles.root}>
        {/* Modal คลุมใต้แถบระบบ: เว้น safe area เพื่อไม่ให้ card ยาว ๆ ไปอยู่ใต้ notch / home indicator */}
        <View
          style={[
            styles.center,
            {
              paddingTop: insets.top + theme.sizes.screenGutter,
              paddingBottom: insets.bottom + theme.sizes.screenGutter,
            },
          ]}
        >
          {dismissible ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('close')}
              onPress={onRequestClose}
              style={styles.backdrop}
            />
          ) : (
            <View style={styles.backdrop} />
          )}
          <View testID={testID} accessibilityViewIsModal style={styles.card}>
            <Text variant="title" accessibilityRole="header">
              {title}
            </Text>
            {message || children ? (
              // ข้อความยาว / ตัวอักษรขยาย: เลื่อนเฉพาะเนื้อหา ปุ่มยังอยู่ในจอเสมอ
              <ScrollView
                style={styles.body}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                {message ? (
                  <Text
                    variant="body"
                    color="textSecondary"
                    style={styles.message}
                  >
                    {message}
                  </Text>
                ) : null}
                {children ? (
                  <View style={styles.children}>{children}</View>
                ) : null}
              </ScrollView>
            ) : null}
            {actions.length > 0 ? (
              <View style={isRow ? styles.actionsRow : styles.actionsColumn}>
                {actions.map((action, index) => (
                  <Button
                    // ปุ่มไม่สลับตำแหน่งระหว่างที่ dialog เปิด index จึงเป็น key ได้
                    key={`${index}-${action.label}`}
                    title={action.label}
                    variant={action.variant ?? 'primary'}
                    onPress={action.onPress}
                    testID={action.testID}
                    fullWidth
                    style={isRow ? styles.actionInRow : null}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.sizes.screenGutter,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.backdrop,
  },
  card: {
    width: '100%',
    maxHeight: '100%',
    // dialog ไม่ควรกว้างเท่าเนื้อหาบนแท็บเล็ต
    maxWidth: theme.sizes.contentMaxWidth * 0.7,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xxl,
    ...theme.shadows.lg,
  },
  body: {
    flexGrow: 0,
    flexShrink: 1,
  },
  message: {
    marginTop: theme.spacing.sm,
  },
  children: {
    marginTop: theme.spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xxl,
  },
  actionsColumn: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xxl,
  },
  actionInRow: {
    flex: 1,
  },
}));
