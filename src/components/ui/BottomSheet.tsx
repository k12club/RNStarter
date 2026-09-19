import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles, useTheme } from '@/theme';

import { Text } from './Text';

// เนื้อหาที่มี scroll / TextInput ข้างใน sheet ต้องใช้ตัวของ bottom-sheet (gesture + คีย์บอร์ดถึงจะทำงานถูก)
export {
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';

export type BottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export type BottomSheetProps = {
  title?: string;
  /** ไม่ใส่ = สูงตามเนื้อหา (dynamic sizing) เช่น ['50%', '90%'] */
  snapPoints?: Array<string | number>;
  /** เนื้อหายาวเกินจอ: ห่อด้วย BottomSheetScrollView แทน BottomSheetView */
  scrollable?: boolean;
  /** ปัดลงเพื่อปิด (ค่าเริ่มต้น true) */
  enablePanDownToClose?: boolean;
  onDismiss?: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  testID?: string;
};

/**
 * bottom sheet แบบ modal ที่ตั้ง theme แล้ว (ต้องอยู่ใต้ BottomSheetModalProvider ซึ่ง mount ไว้ใน RootNavigator)
 *
 * @example
 * const sheetRef = useRef<BottomSheetRef>(null);
 * <Button title="ตัวเลือก" onPress={() => sheetRef.current?.present()} />
 * <BottomSheet ref={sheetRef} title="ตัวเลือก">
 *   <ListItem ... />
 * </BottomSheet>
 */
export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  function ThemedBottomSheet(
    {
      title,
      snapPoints,
      scrollable = false,
      enablePanDownToClose = true,
      onDismiss,
      contentContainerStyle,
      children,
      testID,
    },
    ref,
  ) {
    const { t } = useTranslation('common');
    const theme = useTheme();
    const styles = useStyles();
    const insets = useSafeAreaInsets();
    const modalRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(
      ref,
      () => ({
        present: () => modalRef.current?.present(),
        dismiss: () => modalRef.current?.dismiss(),
      }),
      [],
    );

    const closeLabel = t('close');
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          // ค่าเริ่มต้นของ library เป็นภาษาอังกฤษ
          accessibilityLabel={closeLabel}
          accessibilityHint={null}
        />
      ),
      [closeLabel],
    );

    const contentStyle = [
      styles.content,
      // เว้นพื้นที่ home indicator ด้านล่าง
      { paddingBottom: insets.bottom + theme.spacing.lg },
      contentContainerStyle,
    ];

    const content = (
      <>
        {title ? (
          <Text variant="title" accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
        ) : null}
        {children}
      </>
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={snapPoints}
        enableDynamicSizing={!snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        onDismiss={onDismiss}
        topInset={insets.top}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        // ค่าเริ่มต้นของ library (accessible = true) รวมทั้ง sheet เป็นก้อนเดียว
        // screen reader จะเข้าถึงปุ่มข้างในไม่ได้
        accessible={false}
        accessibilityRole={null}
      >
        {scrollable ? (
          <BottomSheetScrollView
            testID={testID}
            contentContainerStyle={contentStyle}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView testID={testID} style={contentStyle}>
            {content}
          </BottomSheetView>
        )}
      </BottomSheetModal>
    );
  },
);

const useStyles = makeStyles(theme => ({
  background: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
  },
  handleIndicator: {
    backgroundColor: theme.colors.borderStrong,
  },
  content: {
    paddingHorizontal: theme.sizes.screenGutter,
  },
  title: {
    marginBottom: theme.spacing.md,
  },
}));
