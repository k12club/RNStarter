import React from 'react';
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from 'react-hook-form';

import { Checkbox, type CheckboxProps } from '@/components/ui/Checkbox';

import { type FieldErrorValues, useFieldErrorMessage } from './FormTextField';

export type FormCheckboxProps<T extends FieldValues, TTransformed = T> = Omit<
  CheckboxProps,
  'checked' | 'onChange' | 'errorText'
> & {
  control: Control<T, unknown, TTransformed>;
  name: Path<T>;
  errorValues?: FieldErrorValues;
  onChange?: (checked: boolean) => void;
};

/**
 * Checkbox ที่ผูกกับ react-hook-form (ค่าเป็น boolean)
 * เช่น ยอมรับเงื่อนไข: ใช้ acceptTerms() จาก '@/utils/schemas'
 */
export function FormCheckbox<T extends FieldValues, TTransformed = T>({
  control,
  name,
  errorValues,
  onChange,
  label,
  ...rest
}: FormCheckboxProps<T, TTransformed>) {
  const toErrorMessage = useFieldErrorMessage();

  return (
    <Controller<T, Path<T>, TTransformed>
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Checkbox
          {...rest}
          label={label}
          checked={field.value === true}
          onChange={checked => {
            field.onChange(checked);
            // checkbox ไม่มี blur: ถือว่า touched ทันทีที่กด
            field.onBlur();
            onChange?.(checked);
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
