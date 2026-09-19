import React, { useCallback, useState } from 'react';
import {
  type LayoutChangeEvent,
  RefreshControl,
  type ScrollViewProps,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { type Edge, useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles, useTheme } from '@/theme';

const DEFAULT_EDGES: readonly Edge[] = ['top'];

export type ScreenProps = {
  children?: React.ReactNode;
  /**
   * ขอบที่ต้องเว้น safe area (ค่าเริ่มต้น ['top'] = หน้าที่ไม่มี native header)
   * - หน้าที่มี native header: ใส่ [] (header เว้นด้านบนให้แล้ว)
   * - หน้าใน tab: ไม่ต้องใส่ 'bottom' (tab bar เว้นให้แล้ว)
   * - หน้า stack ที่ไม่มี footer และเนื้อหายาวถึงล่างจอ: ใส่ 'bottom' เพิ่ม
   */
  edges?: readonly Edge[];
  /** header ที่ไม่เลื่อนตามเนื้อหา เช่น <AppHeader /> (header เว้น top inset เอง Screen จะไม่เว้นซ้ำ) */
  header?: React.ReactNode;
  /** เนื้อหาเลื่อนได้ + เลื่อนหลบคีย์บอร์ดให้ช่องที่กำลังพิมพ์ */
  scroll?: boolean;
  /** เว้นขอบซ้ายขวาด้วย sizes.screenGutter */
  padded?: boolean;
  /** ดึงลงเพื่อรีเฟรช (ใช้ได้เมื่อ scroll = true) */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** ส่วนล่างที่ติดอยู่เหนือคีย์บอร์ด เช่นปุ่มยืนยัน (เว้น bottom inset ให้เสมอ) */
  footer?: React.ReactNode;
  /** ชั้นบนสุดที่คลุมทั้ง header / เนื้อหา / footer เช่น <LoadingOverlay visible={saving} /> */
  overlay?: React.ReactNode;
  /** ระยะระหว่างช่องที่พิมพ์กับคีย์บอร์ด (ไม่รวมความสูง footer ซึ่งบวกให้อัตโนมัติ) */
  keyboardBottomOffset?: number;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<
    ScrollViewProps,
    'children' | 'contentContainerStyle' | 'refreshControl' | 'style'
  >;
  testID?: string;
};

/**
 * กรอบหน้าจอมาตรฐาน: พื้นหลัง, safe area, scroll + คีย์บอร์ด, pull-to-refresh, footer
 * บนแท็บเล็ตเนื้อหากว้างไม่เกิน sizes.contentMaxWidth และอยู่กึ่งกลาง
 *
 * @example
 * <Screen scroll padded edges={[]} footer={<Button title={t('common:save')} fullWidth />}>
 *   ...ฟอร์ม
 * </Screen>
 */
export function Screen({
  children,
  edges = DEFAULT_EDGES,
  header,
  scroll = false,
  padded = false,
  refreshing = false,
  onRefresh,
  footer,
  overlay,
  keyboardBottomOffset,
  style,
  contentContainerStyle,
  scrollProps,
  testID,
}: ScreenProps) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(0);

  const onFooterLayout = useCallback((event: LayoutChangeEvent) => {
    setFooterHeight(event.nativeEvent.layout.height);
  }, []);

  const has = (edge: Edge) => edges.includes(edge);
  const insetStyle: ViewStyle = {
    paddingTop: !header && has('top') ? insets.top : 0,
    paddingLeft: has('left') ? insets.left : 0,
    paddingRight: has('right') ? insets.right : 0,
  };
  // footer เว้น bottom inset เองแล้ว เนื้อหาจึงไม่ต้องเว้นซ้ำ
  const contentBottom = !footer && has('bottom') ? insets.bottom : 0;
  const footerBottom = Math.max(insets.bottom, theme.spacing.md);
  // ตอนคีย์บอร์ดเปิด footer เลื่อนลงไปใต้คีย์บอร์ดเท่านี้ (ไม่ต้องเว้นพื้นที่ home indicator)
  const stickyOpenedOffset = footerBottom - theme.spacing.md;
  // ส่วนของ footer ที่บังเนื้อหาเหนือคีย์บอร์ด (footer ถูกเอาออกแล้ว = 0 ไม่ใช้ความสูงเก่าค้าง)
  const footerAboveKeyboard = footer
    ? Math.max(footerHeight - stickyOpenedOffset, 0)
    : 0;

  const contentStyles = [
    styles.content,
    padded && styles.padded,
    contentBottom > 0 && { paddingBottom: contentBottom },
    contentContainerStyle,
  ];

  const body = scroll ? (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentStyles]}
      bottomOffset={
        (keyboardBottomOffset ?? theme.spacing.lg) + footerAboveKeyboard
      }
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        ) : undefined
      }
      {...scrollProps}
    >
      {children}
    </KeyboardAwareScrollView>
  ) : (
    <View style={[styles.flex, contentStyles]}>{children}</View>
  );

  return (
    <View testID={testID} style={[styles.root, insetStyle, style]}>
      {header}
      {body}
      {footer ? (
        <KeyboardStickyView
          // ตอนคีย์บอร์ดเปิด ไม่ต้องเว้นพื้นที่ home indicator เหลือไว้แค่ spacing.md
          offset={{ closed: 0, opened: stickyOpenedOffset }}
        >
          <View
            onLayout={onFooterLayout}
            style={[styles.footer, { paddingBottom: footerBottom }]}
          >
            <View style={styles.footerInner}>{footer}</View>
          </View>
        </KeyboardStickyView>
      ) : null}
      {overlay}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: theme.sizes.contentMaxWidth,
    alignSelf: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: theme.sizes.screenGutter,
  },
  footer: {
    backgroundColor: theme.colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.sizes.screenGutter,
  },
  footerInner: {
    width: '100%',
    maxWidth: theme.sizes.contentMaxWidth,
    alignSelf: 'center',
  },
}));
