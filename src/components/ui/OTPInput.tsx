import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  type StyleProp,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { INVISIBLE_TEXT_COLOR, makeStyles } from '@/theme';
import { onlyDigits } from '@/utils/validation';

import { Text } from './Text';
import { FieldShell } from './TextField';

export type OTPInputProps = {
  /** จำนวนหลัก (ค่าเริ่มต้น 6) */
  length?: number;
  /** controlled; ไม่ใส่ = จัดการค่าเอง */
  value?: string;
  onChange?: (code: string) => void;
  /** เรียกครั้งเดียวเมื่อกรอกครบทุกหลัก (พิมพ์ / วาง / เติมจาก SMS) */
  onComplete?: (code: string) => void;
  label?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** ปิดคีย์บอร์ดเมื่อกรอกครบ (ค่าเริ่มต้น true) */
  blurOnComplete?: boolean;
  onBlur?: TextInputProps['onBlur'];
  /** ชื่อของช่องสำหรับ screen reader (ค่าเริ่มต้นใช้ label) */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  ref?: React.Ref<TextInputInstance>;
};

const useStyles = makeStyles(theme => ({
  wrapper: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  // flex: 1 ให้ 6 ช่องพอดีจอ 320dp ได้ (ไม่ล้นแนวนอน) และไม่กว้างเกินบนแท็บเล็ต
  box: {
    flex: 1,
    maxWidth: theme.sizes.input,
    height: theme.sizes.input,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
  },
  boxActive: {
    borderColor: theme.colors.primary,
    boxShadow: `0px 0px 0px 1px ${theme.colors.primary}`,
  },
  boxError: {
    borderColor: theme.colors.danger,
  },
  boxDisabled: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  // ช่องจริงวางทับกล่องทั้งหมด ข้อความ/เคอร์เซอร์โปร่งใส
  // ไม่ใช้ opacity: 0 เพราะ iOS จะไม่ส่ง touch ให้ view ที่โปร่งใสทั้งหมด (กดค้างเพื่อวางไม่ได้)
  // สีข้อความต้องเป็น INVISIBLE_TEXT_COLOR: 'transparent' บน Android ถูกวาดเป็นสีดำ
  hiddenInput: {
    color: INVISIBLE_TEXT_COLOR,
    backgroundColor: theme.colors.transparent,
    fontSize: theme.typeScale.body.fontSize,
  },
}));

/**
 * ช่องกรอกรหัส OTP: TextInput ตัวเดียวซ่อนไว้ + กล่องแสดงผลทีละหลัก
 * - รองรับวางรหัสทั้งชุด และเติมอัตโนมัติจาก SMS (iOS oneTimeCode / Android sms-otp)
 * - รับเฉพาะตัวเลข ตัดส่วนเกินทิ้ง
 */
export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  label,
  helperText,
  errorText,
  disabled = false,
  autoFocus = false,
  blurOnComplete = true,
  onBlur,
  accessibilityLabel,
  style,
  testID,
  ref,
}: OTPInputProps) {
  const styles = useStyles();
  const [innerValue, setInnerValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInputInstance | null>(null);

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

  const code = (value ?? innerValue).slice(0, length);
  const activeIndex = Math.min(code.length, length - 1);

  const handleChangeText = (text: string) => {
    const next = onlyDigits(text).slice(0, length);
    if (next === code) {
      return;
    }
    setInnerValue(next);
    onChange?.(next);
    // เรียกเฉพาะตอนเพิ่งครบ ไม่ใช่ทุก render ที่ค่าครบ
    if (next.length === length && code.length < length) {
      if (blurOnComplete) {
        inputRef.current?.blur();
      }
      onComplete?.(next);
    }
  };

  return (
    <FieldShell
      label={label}
      helperText={helperText}
      errorText={errorText}
      disabled={disabled}
      style={style}
    >
      <View style={styles.wrapper}>
        <View
          style={styles.row}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Array.from({ length }, (_, index) => {
            const char = code[index] ?? '';
            const active = focused && !disabled && index === activeIndex;
            return (
              <View
                key={index}
                style={[
                  styles.box,
                  !!errorText && styles.boxError,
                  active && styles.boxActive,
                  disabled && styles.boxDisabled,
                ]}
              >
                <Text variant="h2" color={disabled ? 'textDisabled' : 'text'}>
                  {char}
                </Text>
              </View>
            );
          })}
        </View>
        <TextInput
          ref={setRefs}
          value={code}
          onChangeText={handleChangeText}
          onFocus={() => setFocused(true)}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          editable={!disabled}
          autoFocus={autoFocus}
          // ห้ามใส่ maxLength: native ตัดข้อความที่วางก่อนกรองตัวเลข ("123 456" เหลือ "123 45")
          // handleChangeText ตัดความยาวเองแล้ว และ TextInput แบบ controlled จะคืนค่าเดิมให้ native
          keyboardType="number-pad"
          inputMode="numeric"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          autoCorrect={false}
          caretHidden
          selectionColor={INVISIBLE_TEXT_COLOR}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={errorText ?? helperText}
          accessibilityState={{ disabled }}
          style={[StyleSheet.absoluteFill, styles.hiddenInput]}
          testID={testID}
        />
      </View>
    </FieldShell>
  );
}
