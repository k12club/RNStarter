import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  type ListRenderItem,
  Pressable,
  type StyleProp,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles, useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { SearchBar } from './SearchBar';
import { Text } from './Text';
import { FieldIconButton, FieldShell, useFieldStyles } from './TextField';

export type SelectOption<T extends string | number> = {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
};

export type SelectProps<T extends string | number> = {
  options: ReadonlyArray<SelectOption<T>>;
  value: T | null | undefined;
  onChange: (value: T) => void;
  label?: string;
  /** ข้อความเมื่อยังไม่เลือก (ค่าเริ่มต้น common:select) */
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  leftIcon?: IconName;
  /** แสดงช่องค้นหาใน sheet (เหมาะกับตัวเลือกเยอะ เช่น จังหวัด) */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** หัวข้อของ sheet (ค่าเริ่มต้นใช้ label) */
  sheetTitle?: string;
  /** ข้อความเมื่อค้นหาไม่เจอ (ค่าเริ่มต้น common:noData) */
  emptyText?: string;
  /** เรียกเมื่อปิด sheet (ใช้ mark touched ใน react-hook-form) */
  onBlur?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const HANDLE_HEIGHT = 24;
const MAX_SHEET_RATIO = 0.8;

const useStyles = makeStyles(theme => ({
  value: {
    flex: 1,
  },
  chevron: {
    marginLeft: theme.spacing.sm,
  },
  sheetBackground: {
    backgroundColor: theme.colors.surface,
  },
  handleIndicator: {
    backgroundColor: theme.colors.borderStrong,
  },
  backdrop: {
    backgroundColor: theme.colors.backdrop,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.sizes.touchTarget,
    paddingLeft: theme.sizes.screenGutter,
    paddingRight: theme.spacing.xs,
  },
  title: {
    flex: 1,
  },
  search: {
    marginHorizontal: theme.sizes.screenGutter,
    marginBottom: theme.spacing.sm,
  },
  // ให้รายการกินพื้นที่ที่เหลือของ sheet และเลื่อนได้ ไม่ล้นออกนอก sheet
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.sizes.input,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  optionPressed: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  optionSelected: {
    backgroundColor: theme.colors.primarySoft,
  },
  optionTexts: {
    flex: 1,
  },
  check: {
    marginLeft: theme.spacing.sm,
  },
  empty: {
    paddingVertical: theme.spacing.xxl,
  },
}));

/** ฉากหลังของ sheet: ใช้สี backdrop ของ theme (มี alpha ในตัวแล้ว จึงตั้ง opacity = 1) */
function SelectBackdrop(props: BottomSheetBackdropProps) {
  const styles = useStyles();
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={1}
      pressBehavior="close"
      style={[props.style, styles.backdrop]}
    />
  );
}

/**
 * ช่องเลือกค่าเดียวจากรายการ หน้าตาเหมือน TextField กดแล้วเปิด bottom sheet
 * ต้องอยู่ใต้ BottomSheetModalProvider (อยู่ใน RootNavigator แล้ว)
 */
export function Select<T extends string | number>({
  options,
  value,
  onChange,
  label,
  placeholder,
  helperText,
  errorText,
  disabled = false,
  leftIcon,
  searchable = false,
  searchPlaceholder,
  sheetTitle,
  emptyText,
  onBlur,
  style,
  testID,
}: SelectProps<T>) {
  const theme = useTheme();
  const styles = useStyles();
  const fieldStyles = useFieldStyles();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find(option => option.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!searchable || q.length === 0) {
      return options;
    }
    return options.filter(option => option.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  // ความสูงของ sheet ตามจำนวนตัวเลือก (ไม่เกิน 80% ของจอ) คำนวณจากทั้งหมด ไม่ใช่ผลค้นหา จะได้ไม่กระโดด
  const snapPoints = useMemo(() => {
    const rowHeight = theme.sizes.input;
    const header = theme.sizes.touchTarget + HANDLE_HEIGHT;
    const search = searchable ? theme.sizes.touchTarget + theme.spacing.sm : 0;
    const content =
      header +
      search +
      Math.max(options.length, 1) * rowHeight +
      insets.bottom +
      theme.spacing.lg;
    const max = windowHeight * MAX_SHEET_RATIO;
    return [searchable ? max : Math.min(content, max)];
  }, [
    insets.bottom,
    options.length,
    searchable,
    theme.sizes.input,
    theme.sizes.touchTarget,
    theme.spacing.lg,
    theme.spacing.sm,
    windowHeight,
  ]);

  const openSheet = () => {
    Keyboard.dismiss();
    setOpen(true);
    sheetRef.current?.present();
  };

  const closeSheet = () => {
    sheetRef.current?.dismiss();
  };

  const handleDismiss = () => {
    setOpen(false);
    setQuery('');
    onBlur?.();
  };

  const handleSelect = useCallback(
    (option: SelectOption<T>) => {
      onChange(option.value);
      sheetRef.current?.dismiss();
    },
    [onChange],
  );

  const renderItem: ListRenderItem<SelectOption<T>> = ({ item }) => {
    const isSelected = item.value === value;
    return (
      <Pressable
        cssInterop={false}
        accessibilityRole="radio"
        accessibilityLabel={item.label}
        accessibilityHint={item.description}
        accessibilityState={{ checked: isSelected, disabled: !!item.disabled }}
        disabled={item.disabled}
        onPress={() => handleSelect(item)}
        style={({ pressed }) => [
          styles.option,
          isSelected && styles.optionSelected,
          pressed && !isSelected && styles.optionPressed,
        ]}
      >
        <View style={styles.optionTexts}>
          <Text
            weight={isSelected ? 'semibold' : undefined}
            color={
              item.disabled
                ? 'textDisabled'
                : isSelected
                ? 'onPrimarySoft'
                : 'text'
            }
          >
            {item.label}
          </Text>
          {item.description ? (
            <Text
              variant="bodySmall"
              color={item.disabled ? 'textDisabled' : 'textSecondary'}
            >
              {item.description}
            </Text>
          ) : null}
        </View>
        {isSelected ? (
          <View style={styles.check}>
            <Icon name="check" size="sm" color="onPrimarySoft" />
          </View>
        ) : null}
      </Pressable>
    );
  };

  const boxStateStyle = errorText
    ? open
      ? fieldStyles.boxErrorFocused
      : fieldStyles.boxError
    : open
    ? fieldStyles.boxFocused
    : null;

  return (
    <FieldShell
      label={label}
      helperText={helperText}
      errorText={errorText}
      disabled={disabled}
      style={style}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder ?? t('select')}
        accessibilityValue={selected ? { text: selected.label } : undefined}
        accessibilityHint={errorText ?? helperText}
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={openSheet}
        style={[
          fieldStyles.box,
          boxStateStyle,
          disabled && fieldStyles.boxDisabled,
        ]}
        testID={testID}
      >
        {leftIcon ? (
          <View style={fieldStyles.leading}>
            <Icon
              name={leftIcon}
              size="sm"
              color={disabled ? 'textDisabled' : 'textSecondary'}
            />
          </View>
        ) : null}
        <Text
          style={styles.value}
          numberOfLines={1}
          color={disabled ? 'textDisabled' : selected ? 'text' : 'textTertiary'}
        >
          {selected ? selected.label : placeholder ?? t('select')}
        </Text>
        <View style={styles.chevron}>
          <Icon
            name="chevron-down"
            size="sm"
            color={disabled ? 'textDisabled' : 'textSecondary'}
          />
        </View>
      </Pressable>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={SelectBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        onDismiss={handleDismiss}
      >
        <View style={styles.header}>
          <Text variant="title" style={styles.title} numberOfLines={1}>
            {sheetTitle ?? label ?? t('select')}
          </Text>
          <FieldIconButton
            icon="x"
            accessibilityLabel={t('close')}
            onPress={closeSheet}
          />
        </View>
        {searchable ? (
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            inputComponent={BottomSheetTextInput}
            style={styles.search}
          />
        ) : null}
        <BottomSheetFlatList
          data={filtered}
          keyExtractor={item => String(item.value)}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + theme.spacing.lg },
          ]}
          ListEmptyComponent={
            <Text color="textSecondary" align="center" style={styles.empty}>
              {emptyText ?? t('noData')}
            </Text>
          }
        />
      </BottomSheetModal>
    </FieldShell>
  );
}
