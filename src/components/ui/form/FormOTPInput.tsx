import React from 'react';
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from 'react-hook-form';

import { OTPInput, type OTPInputProps } from '@/components/ui/OTPInput';

import { type FieldErrorValues, useFieldErrorMessage } from './FormTextField';

export type FormOTPInputProps<T extends FieldValues, TTransformed = T> = Omit<
  OTPInputProps,
  'value' | 'onChange' | 'errorText' | 'ref'
> & {
  control: Control<T, unknown, TTransformed>;
  name: Path<T>;
  errorValues?: FieldErrorValues;
  onChange?: (code: string) => void;
};

/**
 * OTPInput ที่ผูกกับ react-hook-form
 * {{count}} ของ 'validation:otp' ถูกใส่เป็น length ให้แล้ว
 *
 * @example
 * <FormOTPInput control={control} name="otp" onComplete={() => handleSubmit(onSubmit)()} />
 */
export function FormOTPInput<T extends FieldValues, TTransformed = T>({
  control,
  name,
  errorValues,
  onChange,
  onBlur,
  label,
  length = 6,
  ...rest
}: FormOTPInputProps<T, TTransformed>) {
  const toErrorMessage = useFieldErrorMessage();

  return (
    <Controller<T, Path<T>, TTransformed>
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <OTPInput
          {...rest}
          ref={field.ref}
          label={label}
          length={length}
          value={field.value == null ? '' : String(field.value)}
          onChange={code => {
            field.onChange(code);
            onChange?.(code);
          }}
          onBlur={e => {
            field.onBlur();
            onBlur?.(e);
          }}
          disabled={rest.disabled ?? field.disabled}
          errorText={toErrorMessage(fieldState.error?.message, {
            field: label ?? '',
            count: length,
            ...errorValues,
          })}
        />
      )}
    />
  );
}
