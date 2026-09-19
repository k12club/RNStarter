import React from 'react';
import { Pressable, type StyleProp, View, type ViewStyle } from 'react-native';

import { makeStyles } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  /** สถานะ "เลือกบางส่วน" (เช่น เลือกทั้งหมดในรายการที่เลือกไว้บางตัว) */
  indeterminate?: boolean;
  disabled?: boolean;
  errorText?: string;
  /** ใช้เมื่อไม่มี label ที่มองเห็น */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const BOX_SIZE = 22;

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: theme.sizes.touchTarget,
    paddingVertical: (theme.sizes.touchTarget - BOX_SIZE) / 2,
  },
  // ไม่มี label: กว้างแค่กล่อง 22 ขยายให้ครบ 44 (เฉพาะกรณีนี้ ไม่งั้นแถวมี label จะถูกจัดกึ่งกลาง)
  rowBare: {
    minWidth: theme.sizes.touchTarget,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.xs,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
  },
  boxChecked: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  boxError: {
    borderColor: theme.colors.danger,
  },
  boxDisabled: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  boxCheckedDisabled: {
    borderColor: theme.colors.textDisabled,
    backgroundColor: theme.colors.textDisabled,
  },
  // จัดกล่องให้อยู่กึ่งกลางบรรทัดแรกของ label (lineHeight body = 24)
  boxWrap: {
    height: theme.typeScale.body.lineHeight,
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  error: {
    marginLeft: BOX_SIZE + theme.spacing.md,
  },
}));

/**
 * Checkbox ทั้งแถวกดได้ (สูง >= 44) ใช้กับตัวเลือกที่เลือกได้หลายอัน / ยอมรับเงื่อนไข
 */
export function Checkbox({
  checked,
  onChange,
  label,
  description,
  indeterminate = false,
  disabled = false,
  errorText,
  accessibilityLabel,
  style,
  testID,
}: CheckboxProps) {
  const styles = useStyles();
  const filled = checked || indeterminate;

  return (
    <View style={style}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={errorText ?? description}
        accessibilityState={{
          checked: indeterminate ? 'mixed' : checked,
          disabled,
        }}
        disabled={disabled}
        // indeterminate กดแล้วเป็น "เลือกทั้งหมด"
        onPress={() => onChange(indeterminate ? true : !checked)}
        style={[styles.row, !label && !description && styles.rowBare]}
        testID={testID}
      >
        <View style={styles.boxWrap}>
          <View
            style={[
              styles.box,
              filled && styles.boxChecked,
              !!errorText && !filled && styles.boxError,
              disabled &&
                (filled ? styles.boxCheckedDisabled : styles.boxDisabled),
            ]}
          >
            {filled ? (
              <Icon
                name={indeterminate ? 'minus' : 'check'}
                size="xs"
                color={disabled ? 'surface' : 'onPrimary'}
                strokeWidth={3}
              />
            ) : null}
          </View>
        </View>
        {label || description ? (
          <View style={styles.texts}>
            {label ? (
              <Text color={disabled ? 'textDisabled' : 'text'}>{label}</Text>
            ) : null}
            {description ? (
              <Text
                variant="bodySmall"
                color={disabled ? 'textDisabled' : 'textSecondary'}
              >
                {description}
              </Text>
            ) : null}
          </View>
        ) : null}
      </Pressable>
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
