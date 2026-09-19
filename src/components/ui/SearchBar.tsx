import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  type StyleProp,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { makeStyles, MAX_FONT_SIZE_MULTIPLIER, useTheme } from '@/theme';

import { Icon } from './Icon';
import { FieldIconButton } from './TextField';

export type SearchBarProps = Omit<
  TextInputProps,
  'style' | 'value' | 'onChangeText' | 'placeholderTextColor'
> & {
  value: string;
  onChangeText: (text: string) => void;
  /** เรียกหลังกดปุ่มล้าง (onChangeText('') ถูกเรียกให้แล้ว) */
  onClear?: () => void;
  /** accessibilityLabel ของปุ่มล้าง (ค่าเริ่มต้น common:delete) */
  clearLabel?: string;
  style?: StyleProp<ViewStyle>;
  /**
   * เปลี่ยนตัว input เช่น BottomSheetTextInput เมื่ออยู่ใน bottom sheet
   * (ให้ sheet เลื่อนหนีคีย์บอร์ดได้)
   */
  inputComponent?: React.ComponentType<TextInputProps>;
  ref?: React.Ref<TextInputInstance>;
};

const useStyles = makeStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: theme.sizes.touchTarget,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.xxs,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.transparent,
    backgroundColor: theme.colors.surfaceAlt,
  },
  containerFocused: {
    borderColor: theme.colors.primary,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    minHeight: theme.sizes.touchTarget - 2,
    paddingVertical: 0,
    paddingHorizontal: 0,
    color: theme.colors.text,
    fontFamily: theme.fonts.body.regular,
    fontSize: theme.typeScale.body.fontSize,
  },
  // เว้นที่ด้านขวาให้เท่ากับตอนมีปุ่มล้าง ข้อความจะได้ไม่กระโดด
  clearPlaceholder: {
    width: theme.spacing.md - theme.spacing.xxs,
  },
}));

const androidInputFix: TextStyle | null =
  Platform.OS === 'android' ? { includeFontPadding: false } : null;

/**
 * ช่องค้นหา (controlled) พร้อมไอคอนแว่นขยายและปุ่มล้าง
 * ถ้าต้อง debounce ให้ผู้เรียกใช้ useDebounce(value) จาก '@/hooks'
 */
export function SearchBar({
  value,
  onChangeText,
  onClear,
  clearLabel,
  style,
  inputComponent,
  ref,
  placeholder,
  accessibilityLabel,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}: SearchBarProps) {
  const theme = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);

  // BottomSheetTextInput รับ ref ได้เหมือน TextInput
  const Input = (inputComponent ?? TextInput) as React.ComponentType<
    TextInputProps & { ref?: React.Ref<TextInputInstance> }
  >;
  const showClear = editable && value.length > 0;

  const handleFocus: NonNullable<TextInputProps['onFocus']> = e => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur: NonNullable<TextInputProps['onBlur']> = e => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, focused && styles.containerFocused, style]}>
      <View style={styles.icon}>
        <Icon name="search" size="sm" color="textSecondary" />
      </View>
      <Input
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={editable}
        placeholder={placeholder ?? t('searchPlaceholder')}
        placeholderTextColor={theme.colors.textTertiary}
        selectionColor={theme.colors.primary}
        cursorColor={theme.colors.primary}
        returnKeyType="search"
        enterKeyHint="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        accessibilityRole="search"
        accessibilityLabel={accessibilityLabel ?? t('search')}
        style={[styles.input, androidInputFix]}
        {...rest}
      />
      {showClear ? (
        <FieldIconButton
          icon="circle-x"
          accessibilityLabel={clearLabel ?? t('clear')}
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
        />
      ) : (
        <View style={styles.clearPlaceholder} />
      )}
    </View>
  );
}
