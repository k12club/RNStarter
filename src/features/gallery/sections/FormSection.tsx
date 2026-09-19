import { zodResolver } from '@hookform/resolvers/zod';
import React, { memo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';

import {
  Button,
  FormCheckbox,
  FormOTPInput,
  FormSelect,
  FormTextField,
} from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { DemoGroup } from '@/features/gallery/components/DemoGroup';
import { GallerySection } from '@/features/gallery/components/GallerySection';
import { useProvinceOptions } from '@/features/gallery/hooks/useDemoOptions';
import { formatThaiPhone } from '@/utils/format';
import {
  acceptTerms,
  email,
  otp,
  OTP_LENGTH,
  password,
  PASSWORD_MIN_LENGTH,
  passwordsMatch,
  requiredSelect,
  requiredString,
  thaiMobile,
  thaiNationalId,
} from '@/utils/schemas';

// ฟอร์มตัวอย่างที่ใช้ schema กลางทั้งหมดจาก utils/schemas (ข้อความ error เป็น i18n key)
const demoSchema = z
  .object({
    name: requiredString(),
    email: email(),
    mobile: thaiMobile(),
    nationalId: thaiNationalId(),
    province: requiredSelect(),
    password: password(),
    confirmPassword: requiredString(),
    otp: otp(),
    acceptTerms: acceptTerms(),
  })
  .refine(...passwordsMatch());

type DemoFormInput = z.input<typeof demoSchema>;
type DemoFormOutput = z.output<typeof demoSchema>;

const DEFAULT_VALUES: DemoFormInput = {
  name: '',
  email: '',
  mobile: '',
  nationalId: '',
  province: '',
  password: '',
  confirmPassword: '',
  otp: '',
  acceptTerms: false,
};

/** ฟอร์มเต็มรูปแบบ: react-hook-form + zod + Form* wrapper ส่งแล้วแสดง toast สรุปค่า */
export const FormSection = memo(function FormSectionContent() {
  const { t } = useTranslation('gallery');
  const toastApi = useToast();
  const provinceOptions = useProvinceOptions();
  const { control, handleSubmit, reset } = useForm<
    DemoFormInput,
    unknown,
    DemoFormOutput
  >({
    resolver: zodResolver(demoSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onValid = (values: DemoFormOutput) => {
    const province =
      provinceOptions.find(option => option.value === values.province)?.label ??
      values.province;
    toastApi.success(
      t('form.successMessage', {
        name: values.name,
        email: values.email,
        mobile: formatThaiPhone(values.mobile),
        province,
      }),
      { title: t('form.successTitle') },
    );
  };

  return (
    <GallerySection name="form">
      <DemoGroup title={t('form.title')} description={t('form.description')}>
        <View className="gap-5">
          <FormTextField
            control={control}
            name="name"
            label={t('form.name')}
            placeholder={t('form.namePlaceholder')}
            autoComplete="name"
            textContentType="name"
          />
          <FormTextField
            control={control}
            name="email"
            label={t('form.email')}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <FormTextField
            control={control}
            name="mobile"
            label={t('form.mobile')}
            placeholder="0812345678"
            keyboardType="phone-pad"
            leftIcon="smartphone"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
          <FormTextField
            control={control}
            name="nationalId"
            label={t('form.nationalId')}
            helperText={t('form.nationalIdHelper')}
            keyboardType="number-pad"
            leftIcon="credit-card"
            maxLength={17}
          />
          <FormSelect
            control={control}
            name="province"
            label={t('form.province')}
            leftIcon="map-pin"
            searchable
            searchPlaceholder={t('inputs.provinceSearch')}
            options={provinceOptions}
          />
          <FormTextField
            control={control}
            name="password"
            label={t('form.password')}
            helperText={t('form.passwordHelper', { min: PASSWORD_MIN_LENGTH })}
            type="password"
            autoComplete="new-password"
            textContentType="newPassword"
            errorValues={{ count: PASSWORD_MIN_LENGTH }}
          />
          <FormTextField
            control={control}
            name="confirmPassword"
            label={t('form.confirmPassword')}
            type="password"
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <FormOTPInput
            control={control}
            name="otp"
            testID="gallery-form-otp"
            length={OTP_LENGTH}
            label={t('form.otp')}
            helperText={t('form.otpHelper')}
          />
          <FormCheckbox
            control={control}
            name="acceptTerms"
            label={t('form.acceptTerms')}
          />
          <View className="gap-3">
            <Button
              testID="gallery-form-submit"
              title={t('form.submit')}
              fullWidth
              onPress={() => handleSubmit(onValid)()}
            />
            <Button
              testID="gallery-form-reset"
              variant="outline"
              title={t('form.reset')}
              fullWidth
              onPress={() => reset(DEFAULT_VALUES)}
            />
          </View>
        </View>
      </DemoGroup>
    </GallerySection>
  );
});
