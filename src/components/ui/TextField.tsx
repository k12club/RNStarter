import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  Pressable,
  type StyleProp,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { makeStyles, MAX_FONT_SIZE_MULTIPLIER, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/**
 * กรอบของ field ที่ใช้ร่วมกัน (TextField / Select / OTPInput)
 * label ด้านบน, ข้อความช่วย / error ด้านล่าง
 */
export const useFieldStyles = makeStyles(theme => ({
  container: {
    alignSelf: 'stretch',
  },
  label: {
    marginBottom: theme.spacing.xs,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.sizes.input,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
  },
  // กรอบหนาขึ้นด้วย boxShadow แทน borderWidth เพื่อไม่ให้ layout ขยับตอน focus
  boxFocused: {
    borderColor: theme.colors.primary,
    boxShadow: `0px 0px 0px 1px ${theme.colors.primary}`,
  },
  boxError: {
    borderColor: theme.colors.danger,
  },
  boxErrorFocused: {
    borderColor: theme.colors.danger,
    boxShadow: `0px 0px 0px 1px ${theme.colors.danger}`,
  },
  boxDisabled: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  boxMultiline: {
    alignItems: 'flex-start',
  },
  boxWithTrailing: {
    paddingRight: theme.spacing.xxs,
  },
  leading: {
    marginRight: theme.spacing.sm,
  },
  trailing: {
    marginLeft: theme.spacing.sm,
  },
  leadingMultiline: {
    height: theme.typeScale.body.lineHeight,
    marginTop: theme.spacing.md,
    justifyContent: 'center',
  },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.spacing.xs,
  },
  messageIcon: {
    height: theme.typeScale.caption.lineHeight,
    justifyContent: 'center',
    marginRight: theme.spacing.xs,
  },
  messageText: {
    flex: 1,
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
  input: {
    flex: 1,
    alignSelf: 'stretch',
    paddingVertical: 0,
    paddingHorizontal: 0,
    color: theme.colors.text,
    fontFamily: theme.fonts.body.regular,
    fontSize: theme.typeScale.body.fontSize,
  },
  // iOS: ใส่ lineHeight กับ TextInput บรรทัดเดียวแล้วข้อความไม่อยู่กึ่งกลาง จึงใส่เฉพาะ multiline
  inputMultiline: {
    lineHeight: theme.typeScale.body.lineHeight,
    minHeight: theme.typeScale.body.lineHeight * 3 + theme.spacing.md * 2,
    paddingVertical: theme.spacing.md,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    color: theme.colors.textDisabled,
  },
}));

// Android เพิ่ม padding ของฟอนต์เอง ทำให้ข้อความไทยไม่อยู่กึ่งกลาง
const androidInputFix: TextStyle | null =
  Platform.OS === 'android' ? { includeFontPadding: false } : null;

type FieldShellProps = {
  label?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * label + ช่อง + ข้อความช่วย / error
 * label ซ่อนจาก screen reader เพราะ control ด้านในประกาศ label เองอยู่แล้ว (ไม่ให้อ่านซ้ำ)
 */
export function FieldShell({
  label,
  helperText,
  errorText,
  disabled,
  style,
  children,
}: FieldShellProps) {
  const styles = useFieldStyles();

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text
          variant="label"
          color={disabled ? 'textDisabled' : 'text'}
          style={styles.label}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {label}
        </Text>
      ) : null}
      {children}
      {errorText ? (
        <View style={styles.message}>
          <View style={styles.messageIcon}>
            <Icon name="circle-alert" size="xs" color="danger" />
          </View>
          <Text
            variant="caption"
            color="danger"
            style={styles.messageText}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {errorText}
          </Text>
        </View>
      ) : helperText ? (
        <View style={styles.message}>
          <Text
            variant="caption"
            color="textSecondary"
            style={styles.messageText}
          >
            {helperText}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

type FieldIconButtonProps = {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  accessibilityRole?: 'button' | 'togglebutton';
  accessibilityState?: { checked?: boolean; disabled?: boolean };
  disabled?: boolean;
  testID?: string;
};

/** ปุ่มไอคอนในช่องกรอก (ล้างข้อความ / แสดงรหัสผ่าน) พื้นที่แตะ 44 */
export function FieldIconButton({
  icon,
  accessibilityLabel,
  onPress,
  accessibilityRole = 'button',
  accessibilityState,
  disabled,
  testID,
}: FieldIconButtonProps) {
  const styles = useFieldStyles();

  return (
    <Pressable
      cssInterop={false}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ ...accessibilityState, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && !disabled && styles.iconButtonPressed,
      ]}
    >
      <Icon name={icon} size="sm" color="textSecondary" />
    </Pressable>
  );
}

export type TextFieldType = 'text' | 'password';

export type TextFieldProps = Omit<
  TextInputProps,
  'style' | 'editable' | 'secureTextEntry' | 'placeholderTextColor'
> & {
  label?: string;
  helperText?: string;
  /** มีค่า = แสดงกรอบสีแดง + ข้อความ error (ประกาศให้ screen reader) */
  errorText?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  /** ทำให้ rightIcon กดได้ (ต้องใส่ rightIconLabel) */
  onRightIconPress?: () => void;
  rightIconLabel?: string;
  /** แสดงปุ่มล้างข้อความเมื่อมีข้อความ */
  clearable?: boolean;
  /** 'password' = ซ่อนข้อความ + ปุ่มรูปตาสลับแสดง/ซ่อน */
  type?: TextFieldType;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  /** accessibilityLabel ของปุ่มล้าง (ค่าเริ่มต้น common:delete) */
  clearLabel?: string;
  /** accessibilityLabel ของปุ่มรูปตา (ค่าเริ่มต้นใช้ label ของช่อง) */
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  ref?: React.Ref<TextInputInstance>;
};

/**
 * ช่องกรอกข้อความของแอป
 * - ใช้ได้ทั้งแบบ controlled (value) และ uncontrolled (defaultValue)
 * - ความสูงบรรทัดเดียว = sizes.input, multiline สูงอย่างน้อย 3 บรรทัด
 * - ฟอนต์เดียวกับ <Text variant="body">
 */
export function TextField({
  label,
  helperText,
  errorText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  rightIconLabel,
  clearable = false,
  type = 'text',
  disabled = false,
  containerStyle,
  inputStyle,
  clearLabel,
  showPasswordLabel,
  hidePasswordLabel,
  ref,
  value,
  defaultValue,
  onChangeText,
  onFocus,
  onBlur,
  multiline,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const styles = useFieldStyles();
  const { t } = useTranslation();
  const [focused, setFocused] = useState(false);
  const [innerValue, setInnerValue] = useState(defaultValue ?? '');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const inputRef = useRef<TextInputInstance | null>(null);

  // เก็บ instance ไว้ใช้เอง (focus ตอนแตะกรอบ) และส่งต่อให้ ref ของผู้เรียก
  const setRefs = useCallback(
    (node: TextInputInstance | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  // ภายในเป็น controlled เสมอ เพื่อให้ปุ่มล้างรู้ว่ามีข้อความหรือไม่
  const currentValue = value ?? innerValue;
  const isPassword = type === 'password';
  const showClear = clearable && !disabled && currentValue.length > 0;
  const hasTrailing =
    showClear || isPassword || (!!rightIcon && !!onRightIconPress);

  const handleChangeText = (text: string) => {
    setInnerValue(text);
    onChangeText?.(text);
  };

  const handleClear = () => {
    handleChangeText('');
    inputRef.current?.focus();
  };

  const handleFocus: NonNullable<TextInputProps['onFocus']> = e => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur: NonNullable<TextInputProps['onBlur']> = e => {
    setFocused(false);
    onBlur?.(e);
  };

  const boxStateStyle = errorText
    ? focused
      ? styles.boxErrorFocused
      : styles.boxError
    : focused
    ? styles.boxFocused
    : null;

  // ยังไม่มี key ของ i18n สำหรับ "แสดง/ซ่อนรหัสผ่าน": ใช้ชื่อของช่องไปก่อน กันปุ่มไม่มีชื่อ
  const fieldName = accessibilityLabel ?? label ?? '';
  const passwordToggleLabel = passwordVisible
    ? hidePasswordLabel ?? t('hidePassword')
    : showPasswordLabel ?? t('showPassword');

  return (
    <FieldShell
      label={label}
      helperText={helperText}
      errorText={errorText}
      disabled={disabled}
      style={containerStyle}
    >
      <Pressable
        accessible={false}
        disabled={disabled}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.box,
          multiline && styles.boxMultiline,
          hasTrailing && styles.boxWithTrailing,
          boxStateStyle,
          disabled && styles.boxDisabled,
        ]}
      >
        {leftIcon ? (
          <View style={[styles.leading, multiline && styles.leadingMultiline]}>
            <Icon
              name={leftIcon}
              size="sm"
              color={disabled ? 'textDisabled' : 'textSecondary'}
            />
          </View>
        ) : null}
        <TextInput
          ref={setRefs}
          value={currentValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          multiline={multiline}
          secureTextEntry={isPassword && !passwordVisible}
          autoCapitalize={isPassword ? 'none' : undefined}
          autoCorrect={isPassword ? false : undefined}
          textContentType={isPassword ? 'password' : undefined}
          placeholderTextColor={theme.colors.textTertiary}
          selectionColor={theme.colors.primary}
          cursorColor={theme.colors.primary}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={errorText ?? helperText ?? accessibilityHint}
          accessibilityState={{ disabled }}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            disabled && styles.inputDisabled,
            androidInputFix,
            inputStyle,
          ]}
          {...rest}
        />
        {showClear ? (
          <FieldIconButton
            icon="circle-x"
            accessibilityLabel={clearLabel ?? t('clear')}
            onPress={handleClear}
          />
        ) : null}
        {isPassword ? (
          <FieldIconButton
            icon={passwordVisible ? 'eye-off' : 'eye'}
            accessibilityRole="togglebutton"
            accessibilityLabel={passwordToggleLabel}
            accessibilityState={{ checked: passwordVisible }}
            disabled={disabled}
            onPress={() => setPasswordVisible(v => !v)}
          />
        ) : null}
        {rightIcon && onRightIconPress ? (
          <FieldIconButton
            icon={rightIcon}
            accessibilityLabel={rightIconLabel ?? fieldName}
            disabled={disabled}
            onPress={onRightIconPress}
          />
        ) : rightIcon ? (
          <View style={styles.trailing}>
            <Icon
              name={rightIcon}
              size="sm"
              color={disabled ? 'textDisabled' : 'textSecondary'}
            />
          </View>
        ) : null}
      </Pressable>
    </FieldShell>
  );
}
