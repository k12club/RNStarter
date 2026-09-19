import React, { useCallback } from 'react';
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { TextField, type TextFieldProps } from '@/components/ui/TextField';

/** ค่าแทรกในข้อความ error เช่น { count: 8 } สำหรับ 'validation:minLength' */
export type FieldErrorValues = Record<string, string | number>;

// รูปแบบ key ของ i18n ที่มี namespace นำหน้า เช่น 'validation:email', 'errors:network'
const I18N_KEY_PATTERN = /^[a-zA-Z]+:[\w.-]+$/;

/**
 * แปลงข้อความ error ของ field เป็นข้อความที่แสดงได้
 * - schema ใส่ error เป็น key ของ i18n ได้ เช่น z.email({ error: 'validation:email' })
 * - ข้อความที่ไม่ใช่ key (เช่นข้อความจาก zod locale หรือจาก server) แสดงตามเดิม
 * - {{field}} ใน key จะถูกแทนด้วย label ของ field (เช่น 'validation:required')
 */
export function useFieldErrorMessage() {
  const { t, i18n } = useTranslation();

  return useCallback(
    (
      message: string | undefined,
      values?: FieldErrorValues,
    ): string | undefined => {
      if (!message) {
        return undefined;
      }
      if (I18N_KEY_PATTERN.test(message) && i18n.exists(message)) {
        // key มาจาก schema ตอน runtime จึงตรวจ type ของ key ไม่ได้
        const translate = t as unknown as (
          key: string,
          options?: FieldErrorValues,
        ) => string;
        return translate(message, values);
      }
      return message;
    },
    [t, i18n],
  );
}

export type FormTextFieldProps<T extends FieldValues, TTransformed = T> = Omit<
  TextFieldProps,
  'value' | 'defaultValue' | 'onChangeText' | 'errorText' | 'ref'
> & {
  control: Control<T, unknown, TTransformed>;
  name: Path<T>;
  /** ค่าแทรกในข้อความ error (label ของ field ถูกใส่เป็น {{field}} ให้แล้ว) */
  errorValues?: FieldErrorValues;
  onChangeText?: (text: string) => void;
};

/**
 * TextField ที่ผูกกับ react-hook-form
 *
 * @example
 * <FormTextField control={control} name="email" label={t('auth:email')} keyboardType="email-address" />
 */
export function FormTextField<T extends FieldValues, TTransformed = T>({
  control,
  name,
  errorValues,
  onChangeText,
  onBlur,
  label,
  ...rest
}: FormTextFieldProps<T, TTransformed>) {
  const toErrorMessage = useFieldErrorMessage();

  return (
    <Controller<T, Path<T>, TTransformed>
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...rest}
          ref={field.ref}
          label={label}
          value={field.value == null ? '' : String(field.value)}
          onChangeText={text => {
            field.onChange(text);
            onChangeText?.(text);
          }}
          onBlur={e => {
            field.onBlur();
            onBlur?.(e);
          }}
          disabled={rest.disabled ?? field.disabled}
          errorText={toErrorMessage(fieldState.error?.message, {
            field: label ?? '',
            ...errorValues,
          })}
        />
      )}
    />
  );
}
