import {
  NavigationContext,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export type AppHeaderProps = {
  title?: string;
  /**
   * ค่าเริ่มต้น: แสดงเมื่อมี onBackPress หรือ stack ย้อนกลับได้
   * (หน้าแรกของแท็บไม่แสดง แม้ canGoBack() ของ tab จะเป็น true เพราะนั่นคือการสลับแท็บ)
   */
  showBack?: boolean;
  /** ค่าเริ่มต้น navigation.goBack() */
  onBackPress?: () => void;
  /** ปุ่มด้านขวา เช่น <IconButton /> (ควรมีพื้นที่แตะ >= 44) */
  right?: React.ReactNode;
  /** เว้น top inset (ค่าเริ่มต้น true) ปิดเมื่อวาง header ในที่ที่เว้นให้แล้ว */
  safeAreaTop?: boolean;
  /** เส้นคั่นด้านล่าง */
  bordered?: boolean;
  testID?: string;
};

/**
 * header สำหรับหน้าที่ตั้ง headerShown: false (เช่น หน้าใน tab หรือหน้าที่ต้องการ header เอง)
 * ใช้คู่กับ <Screen header={<AppHeader title="..." />}> เพื่อไม่ให้เลื่อนตามเนื้อหา
 *
 * อ่าน navigation จาก context ตรง ๆ (ไม่ใช้ useNavigation ที่ throw เมื่ออยู่นอก navigator)
 * จึง render ได้ทั้งใน test และนอกหน้าจอของ navigator
 */
export function AppHeader({
  title,
  showBack,
  onBackPress,
  right,
  safeAreaTop = true,
  bordered = false,
  testID,
}: AppHeaderProps) {
  const { t } = useTranslation('common');
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const navigation = useContext(NavigationContext);

  const backVisible =
    showBack ?? (!!onBackPress || canGoBackInStack(navigation));

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        safeAreaTop && { paddingTop: insets.top },
        bordered && styles.bordered,
      ]}
    >
      <View style={styles.bar}>
        {backVisible ? (
          <Pressable
            cssInterop={false}
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            onPress={handleBack}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Icon
              name={Platform.OS === 'ios' ? 'chevron-left' : 'arrow-left'}
              size="lg"
            />
          </Pressable>
        ) : null}
        {title ? (
          <Text
            variant="h3"
            numberOfLines={1}
            accessibilityRole="header"
            style={[styles.title, backVisible && styles.titleWithBack]}
          >
            {title}
          </Text>
        ) : (
          // ไม่มีหัวข้อ: เว้นที่ไว้ให้ปุ่มขวายังชิดขวา และไม่ให้ screen reader อ่าน header ว่าง
          <View style={styles.spacer} />
        )}
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

/**
 * ย้อนกลับได้ภายใน stack หรือไม่ (ไล่ขึ้นไปหา stack ชั้นนอก)
 * หยุดเมื่อเจอ navigator ที่ไม่ใช่ stack: goBack ของ tab / drawer คือการสลับแท็บ ไม่ใช่การย้อนหน้า
 */
function canGoBackInStack(
  navigation: NavigationProp<ParamListBase> | undefined,
): boolean {
  let current = navigation;
  while (current) {
    const state = current.getState();
    if (state?.type !== 'stack') {
      return false;
    }
    if (state.index > 0) {
      return true;
    }
    current = current.getParent();
  }
  return false;
}

const useStyles = makeStyles(theme => ({
  container: {
    backgroundColor: theme.colors.background,
  },
  bordered: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.sizes.touchTarget + theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  iconButton: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
  },
  iconButtonPressed: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  title: {
    flex: 1,
    minWidth: 0,
    // ไม่มีปุ่มย้อนกลับ: ชิดขอบเท่ากับเนื้อหา (gutter)
    marginHorizontal: theme.sizes.screenGutter - theme.spacing.xs,
  },
  titleWithBack: {
    marginLeft: theme.spacing.xs,
  },
  spacer: {
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
}));
