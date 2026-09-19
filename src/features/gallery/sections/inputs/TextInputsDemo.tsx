import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  OTPInput,
  SearchBar,
  Select,
  type SelectOption,
  TextField,
} from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';
import {
  type Province,
  useProvinceOptions,
} from '@/features/gallery/hooks/useDemoOptions';
import { useDebounce } from '@/hooks';

const NOTE_MAX_LENGTH = 200;
const CONTACTS = ['line', 'phone', 'email'] as const;
type Contact = (typeof CONTACTS)[number];

/** TextField ทุกสถานะ, SearchBar (+ debounce), Select, OTPInput */
export function TextInputsDemo() {
  const { t } = useTranslation('gallery');
  const toastApi = useToast();
  const provinceOptions = useProvinceOptions();
  const [nickname, setNickname] = useState('');
  const [shop, setShop] = useState('');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [contact, setContact] = useState<Contact | null>(null);
  const [province, setProvince] = useState<Province | null>(null);
  const [branch, setBranch] = useState<Province | null>(null);

  const contactOptions = useMemo<ReadonlyArray<SelectOption<Contact>>>(
    () =>
      CONTACTS.map(value => ({
        value,
        label: t(`inputs.contacts.${value}.label`),
        description: t(`inputs.contacts.${value}.description`),
      })),
    [t],
  );

  return (
    <>
      <DemoGroup title="TextField">
        <View className="gap-5">
          <TextField
            label={t('inputs.nickname')}
            placeholder={t('inputs.nicknamePlaceholder')}
            helperText={t('inputs.nicknameHelper')}
            value={nickname}
            onChangeText={setNickname}
          />
          <TextField
            label={t('inputs.workEmail')}
            defaultValue="somchai@"
            keyboardType="email-address"
            autoCapitalize="none"
            errorText={t('inputs.workEmailError')}
          />
          <TextField
            label={t('inputs.memberId')}
            value="MEM-000123"
            helperText={t('inputs.memberIdHelper')}
            disabled
          />
          <TextField
            label={t('inputs.currentPassword')}
            type="password"
            defaultValue="secret-1234"
          />
          <TextField
            label={t('inputs.shop')}
            placeholder={t('inputs.shopPlaceholder')}
            leftIcon="search"
            clearable
            value={shop}
            onChangeText={setShop}
          />
          <TextField
            label={t('inputs.phone')}
            placeholder="081-234-5678"
            keyboardType="phone-pad"
            leftIcon="phone"
            rightIcon="circle-help"
            rightIconLabel={t('inputs.phoneHelp')}
            onRightIconPress={() => toastApi.info(t('inputs.phoneHelpMessage'))}
          />
          <TextField
            label={t('inputs.note')}
            placeholder={t('inputs.notePlaceholder')}
            helperText={t('inputs.noteCount', {
              current: note.length,
              max: NOTE_MAX_LENGTH,
            })}
            multiline
            maxLength={NOTE_MAX_LENGTH}
            leftIcon="pencil"
            value={note}
            onChangeText={setNote}
          />
        </View>
      </DemoGroup>

      <DemoGroup title="SearchBar">
        <View className="gap-2">
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={t('inputs.searchPlaceholder')}
          />
          <DemoLabel>
            {t('inputs.searchDebounced', { value: debouncedSearch || '-' })}
          </DemoLabel>
        </View>
      </DemoGroup>

      <DemoGroup title="Select">
        <View className="gap-5">
          <Select
            label={t('inputs.contact')}
            leftIcon="message-circle"
            options={contactOptions}
            value={contact}
            onChange={setContact}
            helperText={t('inputs.contactHelper')}
          />
          <Select
            label={t('inputs.province')}
            leftIcon="map-pin"
            searchable
            searchPlaceholder={t('inputs.provinceSearch')}
            options={provinceOptions}
            value={province}
            onChange={setProvince}
          />
          <Select
            label={t('inputs.branch')}
            options={provinceOptions}
            value={branch}
            onChange={setBranch}
            errorText={branch ? undefined : t('inputs.branchError')}
          />
          <Select
            label={t('inputs.branchDisabled')}
            options={provinceOptions}
            value="bkk"
            onChange={() => undefined}
            disabled
          />
        </View>
      </DemoGroup>

      <DemoGroup title="OTPInput">
        <View className="gap-5">
          <OTPInput
            label={t('inputs.otp')}
            helperText={t('inputs.otpHelper')}
            onComplete={code =>
              toastApi.success(t('inputs.otpComplete', { code }))
            }
          />
          <OTPInput
            length={4}
            label={t('inputs.pin')}
            value="12"
            errorText={t('inputs.pinError')}
          />
          <OTPInput
            length={4}
            label={t('inputs.pinDisabled')}
            value="1234"
            disabled
          />
        </View>
      </DemoGroup>
    </>
  );
}
