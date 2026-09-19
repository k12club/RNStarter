import React from 'react';
import { Pressable, type StyleProp, View, type ViewStyle } from 'react-native';

import { makeStyles } from '@/theme';

import { Text } from './Text';

export type RadioOption<T extends string | number> = {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
};

export type RadioGroupProps<T extends string | number> = {
  options: ReadonlyArray<RadioOption<T>>;
  value: T | null | undefined;
  onChange: (value: T) => void;
  /** หัวข้อของกลุ่ม (แสดงด้านบน + เป็นชื่อกลุ่มของ screen reader) */
  label?: string;
  errorText?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const RADIO_SIZE = 22;
const DOT_SIZE = 10;

const useStyles = makeStyles(theme => ({
  label: {
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: theme.sizes.touchTarget,
    paddingVertical: (theme.sizes.touchTarget - RADIO_SIZE) / 2,
  },
  // จัดวงกลมให้อยู่กึ่งกลางบรรทัดแรกของ label
  radioWrap: {
    height: theme.typeScale.body.lineHeight,
    justifyContent: 'center',
  },
  radio: {
    width: RADIO_SIZE,
    height: RADIO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
  },
  radioSelected: {
    borderColor: theme.colors.primary,
  },
  radioError: {
    borderColor: theme.colors.danger,
  },
  radioDisabled: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
  },
  dotDisabled: {
    backgroundColor: theme.colors.textDisabled,
  },
  texts: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  error: {
    marginTop: theme.spacing.xs,
  },
}));

/**
 * กลุ่มตัวเลือกเดียว (radio) แต่ละแถวกดได้ทั้งแถว สูง >= 44
 * ตัวเลือกเกิน ~6 ตัว หรือพื้นที่จำกัด ให้ใช้ Select แทน
 */
export function RadioGroup<T extends string | number>({
  options,
  value,
  onChange,
  label,
  errorText,
  disabled = false,
  style,
  testID,
}: RadioGroupProps<T>) {
  const styles = useStyles();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={style}
      testID={testID}
    >
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
      {options.map(option => {
        const selected = option.value === value;
        const optionDisabled = disabled || !!option.disabled;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityHint={option.description}
            accessibilityState={{ checked: selected, disabled: optionDisabled }}
            disabled={optionDisabled}
            onPress={() => {
              if (!selected) {
                onChange(option.value);
              }
            }}
            style={styles.row}
          >
            <View style={styles.radioWrap}>
              <View
                style={[
                  styles.radio,
                  selected && styles.radioSelected,
                  !!errorText && !selected && styles.radioError,
                  optionDisabled && styles.radioDisabled,
                ]}
              >
                {selected ? (
                  <View
                    style={[styles.dot, optionDisabled && styles.dotDisabled]}
                  />
                ) : null}
              </View>
            </View>
            <View style={styles.texts}>
              <Text color={optionDisabled ? 'textDisabled' : 'text'}>
                {option.label}
              </Text>
              {option.description ? (
                <Text
                  variant="bodySmall"
                  color={optionDisabled ? 'textDisabled' : 'textSecondary'}
                >
                  {option.description}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
      {errorText ? (
        <Text
          variant="caption"
          color="danger"
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}
