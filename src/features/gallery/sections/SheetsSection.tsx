import React, { memo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  BottomSheet,
  type BottomSheetRef,
  BottomSheetTextInput,
  Button,
  ListItem,
  SearchBar,
  Select,
  Text,
  TextField,
} from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { DemoGroup } from '@/features/gallery/components/DemoGroup';
import { GallerySection } from '@/features/gallery/components/GallerySection';
import {
  type Province,
  useProvinceOptions,
} from '@/features/gallery/hooks/useDemoOptions';

const LIST_SNAP_POINTS: Array<string> = ['50%', '90%'];
const LIST_ITEMS = Array.from({ length: 20 }, (_, index) => index + 1);

/** BottomSheet แบบสูงตามเนื้อหา (มีช่องกรอก) / แบบเลื่อนได้ และ Select ในหน้า */
export const SheetsSection = memo(function SheetsSectionContent() {
  const { t } = useTranslation(['gallery', 'common']);
  const toastApi = useToast();
  const provinceOptions = useProvinceOptions();
  const formSheetRef = useRef<BottomSheetRef>(null);
  const listSheetRef = useRef<BottomSheetRef>(null);
  const [label, setLabel] = useState('');
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState<Province | null>(null);

  const saveAddress = () => {
    toastApi.success(t('gallery:sheets.saved', { label: label.trim() || '-' }));
    formSheetRef.current?.dismiss();
  };

  return (
    <GallerySection name="sheets">
      <DemoGroup
        title={t('gallery:sheets.formTitle')}
        description={t('gallery:sheets.formDescription')}
      >
        <Button
          testID="gallery-sheet-open"
          variant="outline"
          title={t('gallery:sheets.openForm')}
          onPress={() => formSheetRef.current?.present()}
        />
      </DemoGroup>

      <DemoGroup
        title={t('gallery:sheets.listTitle')}
        description={t('gallery:sheets.listDescription')}
      >
        <Button
          testID="gallery-sheet-list-open"
          variant="outline"
          title={t('gallery:sheets.openList')}
          onPress={() => listSheetRef.current?.present()}
        />
      </DemoGroup>

      <DemoGroup
        title={t('gallery:sheets.selectTitle')}
        description={t('gallery:sheets.selectDescription')}
      >
        <Select
          label={t('gallery:sheets.deliveryProvince')}
          leftIcon="map-pin"
          options={provinceOptions}
          value={province}
          onChange={setProvince}
        />
      </DemoGroup>

      {/* ไม่ใส่ snapPoints = สูงตามเนื้อหา (BottomSheetView) */}
      <BottomSheet
        ref={formSheetRef}
        title={t('gallery:sheets.formSheetTitle')}
        testID="gallery-sheet-form"
      >
        <View className="gap-4">
          <TextField
            label={t('gallery:sheets.addressLabel')}
            placeholder={t('gallery:sheets.addressPlaceholder')}
            leftIcon="house"
            clearable
            value={label}
            onChangeText={setLabel}
          />
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('gallery:sheets.searchPlaceholder')}
            inputComponent={BottomSheetTextInput}
          />
          {/* TextField ยังใช้ TextInput ธรรมดา sheet จึงไม่เลื่อนหนีคีย์บอร์ดให้ (SearchBar ใช้ BottomSheetTextInput ได้) */}
          <Text variant="bodySmall" color="textSecondary">
            {t('gallery:sheets.keyboardNote')}
          </Text>
          <Button title={t('common:save')} fullWidth onPress={saveAddress} />
        </View>
      </BottomSheet>

      {/* scrollable = ห่อเนื้อหาด้วย BottomSheetScrollView */}
      <BottomSheet
        ref={listSheetRef}
        title={t('gallery:sheets.listSheetTitle')}
        snapPoints={LIST_SNAP_POINTS}
        scrollable
        testID="gallery-sheet-list"
      >
        {LIST_ITEMS.map(index => (
          <ListItem
            key={index}
            left="package"
            title={t('gallery:sheets.listItem', { index })}
            subtitle={t('gallery:sheets.listItemDetail')}
            chevron
            onPress={() => {
              toastApi.info(t('gallery:sheets.listItem', { index }));
              listSheetRef.current?.dismiss();
            }}
          />
        ))}
      </BottomSheet>
    </GallerySection>
  );
});
