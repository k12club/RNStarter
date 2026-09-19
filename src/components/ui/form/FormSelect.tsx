import React from 'react';
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from 'react-hook-form';

import { Select, type SelectProps } from '@/components/ui/Select';

import { type FieldErrorValues, useFieldErrorMessage } from './FormTextField';

export type FormSelectProps<
  T extends FieldValues,
  V extends string | number,
  TTransformed = T,
> = Omit<SelectProps<V>, 'value' | 'onChange' | 'errorText'> & {
  control: Control<T, unknown, TTransformed>;
  name: Path<T>;
  errorValues?: FieldErrorValues;
  onChange?: (value: V) => void;
};

/**
 * Select ที่ผูกกับ react-hook-form
 * ข้อความ error ของค่าว่างใช้ 'validation:requiredSelect' ({{field}} = label)
 */
export function FormSelect<
  T extends FieldValues,
  V extends string | number,
  TTransformed = T,
>({
  control,
  name,
  errorValues,
  onChange,
  onBlur,
  label,
  ...rest
}: FormSelectProps<T, V, TTransformed>) {
  const toErrorMessage = useFieldErrorMessage();

  return (
    <Controller<T, Path<T>, TTransformed>
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Select<V>
          {...rest}
          label={label}
          value={field.value as V | null | undefined}
          onChange={next => {
            field.onChange(next);
            onChange?.(next);
          }}
          onBlur={() => {
            field.onBlur();
            onBlur?.();
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
