import React, { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type LayoutChangeEvent, View } from 'react-native';

import {
  EmptyState,
  Icon,
  type IconName,
  SearchBar,
  Text,
} from '@/components/ui';
import { icons } from '@/components/ui/icons';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';
import { GallerySection } from '@/features/gallery/components/GallerySection';
import { makeStyles, useTheme } from '@/theme';

const ICON_NAMES = Object.keys(icons) as IconName[];
// ช่องแคบสุดที่ชื่อยาวอย่าง sliders-horizontal ยังตัดบรรทัดที่ขีดได้โดยไม่ตัดกลางคำ
const MIN_CELL_WIDTH = 88;
const MIN_COLUMNS = 3;

const useStyles = makeStyles(theme => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: theme.spacing.sm,
    rowGap: theme.spacing.lg,
  },
  cell: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  // ก่อนวัดความกว้างได้ (render แรก / Jest) ใช้ 3 คอลัมน์แบบเปอร์เซ็นต์
  cellFallback: {
    width: '30%',
  },
}));

type IconCellProps = {
  name: IconName;
  width: number | undefined;
};

const IconCell = memo(function IconCellContent({ name, width }: IconCellProps) {
  const styles = useStyles();

  return (
    <View
      testID={`gallery-icon-${name}`}
      style={[styles.cell, width ? { width } : styles.cellFallback]}
    >
      <Icon name={name} size="lg" />
      {/* ไม่จำกัดบรรทัด: ชื่อยาวขึ้นบรรทัดใหม่ ไม่ล้นแนวนอน */}
      <Text variant="caption" color="textSecondary" align="center">
        {name}
      </Text>
    </View>
  );
});

/** icon ทุกตัวใน icons.ts พร้อมชื่อ กรองด้วยช่องค้นหาได้ */
export const IconsSection = memo(function IconsSectionContent() {
  const { t } = useTranslation('gallery');
  const theme = useTheme();
  const styles = useStyles();
  const [query, setQuery] = useState('');
  const [gridWidth, setGridWidth] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ICON_NAMES.filter(name => name.includes(q)) : ICON_NAMES;
  }, [query]);

  // จำนวนคอลัมน์ตามความกว้างจริง: มือถือ 3 คอลัมน์, แท็บเล็ตเพิ่มขึ้นเอง
  const gap = theme.spacing.sm;
  const columns =
    gridWidth > 0
      ? Math.max(
          MIN_COLUMNS,
          Math.floor((gridWidth + gap) / (MIN_CELL_WIDTH + gap)),
        )
      : MIN_COLUMNS;
  const cellWidth =
    gridWidth > 0 ? (gridWidth - gap * (columns - 1)) / columns : undefined;

  const handleLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    if (next !== gridWidth) {
      setGridWidth(next);
    }
  };

  return (
    <GallerySection name="icons">
      <DemoGroup title={t('icons.title')}>
        <View className="gap-4">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('icons.searchPlaceholder')}
            accessibilityLabel={t('icons.searchPlaceholder')}
          />
          <DemoLabel>
            {t('icons.count', {
              shown: filtered.length,
              total: ICON_NAMES.length,
            })}
          </DemoLabel>
          {filtered.length > 0 ? (
            <View style={styles.grid} onLayout={handleLayout}>
              {filtered.map(name => (
                <IconCell key={name} name={name} width={cellWidth} />
              ))}
            </View>
          ) : (
            <EmptyState icon="search" title={t('icons.empty')} />
          )}
        </View>
      </DemoGroup>
    </GallerySection>
  );
});
